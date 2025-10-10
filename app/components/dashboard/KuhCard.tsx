'use client';

import { useState } from 'react';
import { Calendar, AlertCircle, CheckCircle, Milk, Trash2 } from 'lucide-react';
import { Kuh } from '@/app/lib/types';
import { 
  parseDate, 
  formatDate, 
  getDaysUntil, 
  getTrockenstellDatum, 
  getKalbeDatum,
  addDays,
  getNaechsteBrunst,
  getKontrollDatum,
  BRUNST_ZYKLUS_TAGE,
  KONTROLLE_NACH_TAGEN,
  TROCKENSTELLEN_NACH_TAGEN,
  KALBEN_NACH_TAGEN
} from '@/app/lib/dateUtils';
import ConfirmDialog from '@/app/components/dialogs/ConfirmDialog';
import AbgangDialog from '@/app/components/dialogs/AbgangDialog';
import DatePickerDialog from '@/app/components/dialogs/DatePickerDialog';

interface KuhCardProps {
  kuh: Kuh;
  showInfo: string[];
  onUpdate: () => void;
  showKlauenpflege?: boolean;
}

export default function KuhCard({ kuh, showInfo, onUpdate, showKlauenpflege = false }: KuhCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAbgang, setShowAbgang] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerConfig, setDatePickerConfig] = useState<{
    title: string;
    message: string;
    action: (date: Date) => Promise<void>;
  } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    action: () => void;
    isDanger?: boolean;
  } | null>(null);

  const trockenstellDatum = kuh.besamung_datum 
    ? getTrockenstellDatum(parseDate(kuh.besamung_datum)!) 
    : null;
  
  const kalbeDatum = kuh.besamung_datum ? getKalbeDatum(parseDate(kuh.besamung_datum)) : null;
  
  const kontrollDatum = kuh.besamung_datum 
    ? getKontrollDatum(parseDate(kuh.besamung_datum)!) 
    : null;

  const handleAction = (action: () => Promise<void>, title: string, message: string, isDanger = false) => {
    setConfirmAction({
      title,
      message,
      action: async () => {
        await action();
        onUpdate();
        setShowConfirm(false);
      },
      isDanger
    });
    setShowConfirm(true);
  };

  const handleDateAction = (action: (date: Date) => Promise<void>, title: string, message: string) => {
    setDatePickerConfig({ title, message, action });
    setShowDatePicker(true);
  };

  const heute = new Date();
  heute.setHours(0, 0, 0, 0);

  const getAktionen = () => {
    const aktionen: any[] = [];

    // ==================== KLAUENPFLEGE ====================
    if (showKlauenpflege && kuh.klauenpflege) {
      aktionen.push({
        label: '✅ Klauenpflege erledigt',
        color: 'from-green-500 to-green-600',
        onClick: () => handleAction(
          async () => {
            await fetch(`/api/kuehe/${kuh.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ klauenpflege: false })
            });
          },
          'Klauenpflege erledigt',
          `${kuh.name} wurde die Klauenpflege durchgeführt?`
        )
      });
      return aktionen;
    }

    // ==================== BRUNST / BESAMEN ====================
    if (showInfo.includes('brunst')) {
      aktionen.push({
        label: '👁️ Brunst beobachtet',
        color: 'from-blue-500 to-blue-600',
        onClick: () => handleDateAction(
          async (date: Date) => {
            await fetch(`/api/kuehe/${kuh.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                letzte_brunst: date.toISOString()
              })
            });
            onUpdate();
          },
          'Brunst beobachtet',
          `Wann wurde bei ${kuh.name} die Brunst beobachtet?`
        )
      });

      aktionen.push({
        label: '💉 Besamt',
        color: 'from-green-500 to-green-600',
        onClick: () => handleDateAction(
          async (date: Date) => {
            await fetch(`/api/kuehe/${kuh.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                besamung_datum: date.toISOString(),
                letzte_brunst: date.toISOString(),
                besamung_versuche: (kuh.besamung_versuche || 0) + 1
              })
            });
            onUpdate();
          },
          'Besamt',
          `Wann wurde ${kuh.name} besamt?`
        )
      });
    }

    // ==================== KONTROLLE ====================
    if (showInfo.includes('kontrolle') && kontrollDatum) {
      const diff = getDaysUntil(kontrollDatum);
      
      aktionen.push({
        label: '✅ Trächtig',
        color: 'from-green-500 to-green-600',
        onClick: () => handleAction(
          async () => {
            await fetch(`/api/kuehe/${kuh.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                kontroll_status: 'positiv'
              })
            });
          },
          'Trächtigkeit bestätigen',
          `${kuh.name} ist trächtig?`
        )
      });

      aktionen.push({
        label: '❌ Nicht trächtig',
        color: 'from-red-500 to-red-600',
        onClick: () => handleAction(
          async () => {
            const letzteBrunst = kuh.besamung_datum ? parseDate(kuh.besamung_datum)! : new Date();
            const naechsteBrunst = getNaechsteBrunst(letzteBrunst);
            
            await fetch(`/api/kuehe/${kuh.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                kontroll_status: 'negativ'
              })
            });
          },
          'Nicht trächtig',
          `${kuh.name} ist nicht trächtig? (Kuh kommt zurück zur Brunstbeobachtung)`
        )
      });

      aktionen.push({
        label: '❓ Unsicher',
        color: 'from-gray-500 to-gray-600',
        onClick: () => handleAction(
          async () => {
            await fetch(`/api/kuehe/${kuh.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                kontroll_status: 'unsicher'
              })
            });
          },
          'Kontrolle unsicher',
          `Kontrolle bei ${kuh.name} war nicht eindeutig? (Kuh bleibt zur erneuten Kontrolle)`
        )
      });
    }

    // ==================== TROCKENSTELLEN ====================
    if (trockenstellDatum && kuh.kontroll_status === 'positiv') {
        aktionen.push({
          label: '💤 Trockengestellt',
          color: 'from-indigo-500 to-indigo-600',
          onClick: () => handleDateAction(
            async (date: Date) => {
              await fetch(`/api/kuehe/${kuh.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  trockengestellt_am: date.toISOString()
                })
              });
              onUpdate();
            },
            'Trockenstellen',
            `Wann wurde ${kuh.name} trockengestellt?`
          )
        });
    }

    // ==================== ABKALBEN ====================
    if (kalbeDatum && (kuh.trockengestellt_am || !kuh.abgekalbt_am)) {
        aktionen.push({
          label: '🐮 Abgekalbt',
          color: 'from-green-500 to-green-600',
          onClick: () => handleDateAction(
            async (date: Date) => {
              await fetch(`/api/kuehe/${kuh.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  abgekalbt_am: date.toISOString(),
                  trockengestellt_am: null,
                  besamung_datum: null,
                  letzte_brunst: null,
                  kontroll_status: null,
                  besamung_versuche: 0
                })
              });
              onUpdate();
            },
            'Abkalbung',
            `Wann hat ${kuh.name} abgekalbt?`
          )
        });
    }

    return aktionen;
  };

  const aktionen = getAktionen();
  const isUeberfaellig = kontrollDatum && getDaysUntil(kontrollDatum) < -7;

  return (
    <>
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${
        isUeberfaellig 
          ? 'border-red-300 ring-2 ring-red-200' 
          : !kuh.abgekalbt_am 
          ? 'border-pink-300' 
          : 'border-transparent'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`text-4xl ${!kuh.abgekalbt_am ? 'bg-pink-100' : 'bg-blue-100'} w-14 h-14 rounded-xl flex items-center justify-center`}>
              {!kuh.abgekalbt_am ? '🐄' : '🐮'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-800">{kuh.name}</h3>
                {!kuh.abgekalbt_am && (
                  <span className="bg-pink-500 text-white px-2 py-0.5 rounded text-xs font-semibold">
                    Kalbin
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm">Nr. {kuh.tiernummer}</p>
            </div>
          </div>
        </div>

        {/* Info-Anzeigen */}
        <div className="space-y-2 mb-4">
          {showInfo.includes('brunst') && kuh.letzte_brunst && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Letzte Brunst: {formatDate(parseDate(kuh.letzte_brunst))}</span>
            </div>
          )}
          
          {showInfo.includes('brunst') && kuh.letzte_brunst && (
            <div className="flex items-center gap-2 text-sm text-blue-600 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>Nächster Zyklus: {formatDate(getNaechsteBrunst(parseDate(kuh.letzte_brunst)!))}</span>
            </div>
          )}

          {showInfo.includes('kontrolle') && kontrollDatum && (
            <div className={`flex items-center gap-2 text-sm font-semibold ${
              isUeberfaellig ? 'text-red-600' : 'text-orange-600'
            }`}>
              <CheckCircle className="w-4 h-4" />
              <span>
                Kontrolle: {formatDate(kontrollDatum)}
                {isUeberfaellig && ' (ÜBERFÄLLIG!)'}
              </span>
            </div>
          )}

          {showInfo.includes('trockenstellen') && trockenstellDatum && (
            <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
              <Milk className="w-4 h-4" />
              <span>Trockenstellen: {formatDate(trockenstellDatum)} (in {getDaysUntil(trockenstellDatum)} Tagen)</span>
            </div>
          )}

          {showInfo.includes('kalben') && kalbeDatum && (
            <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
              <Calendar className="w-4 h-4" />
              <span>Kalben: {formatDate(kalbeDatum)} (in {getDaysUntil(kalbeDatum)} Tagen)</span>
            </div>
          )}


        </div>

        {/* Aktionen */}
        {aktionen.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {aktionen.map((aktion, index) => (
              <button
                key={index}
                onClick={aktion.onClick}
                className={`flex-1 min-w-[120px] bg-gradient-to-r ${aktion.color} text-white py-3 px-4 rounded-xl font-semibold text-sm hover:shadow-lg transition-all active:scale-95 touch-manipulation`}
              >
                {aktion.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dialoge */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmAction?.action || (() => {})}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        isDanger={confirmAction?.isDanger}
      />

      <AbgangDialog
        isOpen={showAbgang}
        onClose={() => setShowAbgang(false)}
        kuh={kuh}
        onConfirm={async (grund) => {
          await fetch(`/api/kuehe/${kuh.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              aktiv: false,
              abgangsdatum: new Date().toISOString(),
              abgangsgrund: grund
            })
          });
          onUpdate();
          setShowAbgang(false);
        }}
      />

      <DatePickerDialog
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={async (date: Date) => {
          if (datePickerConfig) {
            await datePickerConfig.action(date);
          }
          setShowDatePicker(false);
        }}
        title={datePickerConfig?.title || ''}
        message={datePickerConfig?.message || ''}
      />
    </>
  );
}