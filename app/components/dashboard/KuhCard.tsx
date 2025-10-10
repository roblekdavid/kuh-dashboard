'use client';

import { useState } from 'react';
import { Calendar, AlertCircle, CheckCircle, Milk, Trash2 } from 'lucide-react';
import { Kuh } from '@/app/lib/types';
import { 
   parseDate, 
  formatDate, 
  getDaysUntil,
  getDaysSince,
  getTrockenstellDatum, 
  getKalbeDatum,
  getKontrollDatum,
  getNextBrunstForKuh,
  getAlterInMonaten
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

  const nextBrunst = getNextBrunstForKuh(kuh);
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
          `Bei ${kuh.name} wurde die Klauenpflege durchgeführt?`
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
    if (trockenstellDatum && kuh.kontroll_status === 'positiv' && showInfo.includes('trockenstell_datum')) {
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
    if (kalbeDatum && showInfo.includes('kalbe_datum')) {
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
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2">
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
          {/* Besamungsversuche */}
          {showInfo?.includes('besamung_versuche') && (
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Besamungsversuche: {kuh.besamung_versuche || 0}</span>
            </div>
          )}

          {/* Alter für Kalbinnen */}
          {!kuh.abgekalbt_am && kuh.geburtsdatum && showInfo?.includes('brunst') && (
            <div className="text-sm text-gray-600">
              <span>Alter: {getAlterInMonaten(parseDate(kuh.geburtsdatum)!)} Monate</span>
            </div>
          )}

          {/* Tage seit Abkalben */}
          {kuh.abgekalbt_am && showInfo?.includes('brunst') && (
            <div className="text-sm text-gray-600">
              <span>Abgekalbt vor: {getDaysSince(parseDate(kuh.abgekalbt_am)!)} Tagen</span>
            </div>
          )}

          {/* Brunst-Datum für "Brunst nächste 5 Tage" */}
          {showInfo?.includes('brunst_datum') && nextBrunst && (
            <div className="bg-cyan-50 p-3 rounded-xl">
              <div className="text-cyan-700 font-semibold text-center">
                Brunst erwartet: {formatDate(nextBrunst)}
              </div>
              <div className="text-cyan-600 text-sm text-center mt-1">
                (in {getDaysUntil(nextBrunst)} Tagen)
              </div>
            </div>
          )}

          {/* Kontrolle */}
          {showInfo?.includes('kontrolle') && kontrollDatum && (
            <div className="bg-orange-50 p-3 rounded-xl border-2 border-orange-200">
              <div className="font-bold text-center text-orange-800 text-sm">
                Besamt: {kuh.besamung_datum ? formatDate(parseDate(kuh.besamung_datum)!) : '-'}
              </div>
              <div className="font-bold text-center text-orange-800 text-base mt-1">
                Kontrolle: {formatDate(kontrollDatum)}
              </div>
            </div>
          )}

          {/* Trockenstellen */}
          {showInfo?.includes('trockenstell_datum') && trockenstellDatum && (
            <div className="bg-purple-50 p-3 rounded-xl">
              <div className="text-purple-700 font-semibold text-center">
                Trockenstellen: {formatDate(trockenstellDatum)}
              </div>
              <div className="text-purple-600 text-sm text-center mt-1">
                (in {getDaysUntil(trockenstellDatum)} Tagen)
              </div>
            </div>
          )}

          {/* Kalben */}
          {showInfo?.includes('kalbe_datum') && kalbeDatum && (
            <div className="bg-green-50 p-3 rounded-xl">
              <div className="text-green-700 font-semibold text-center">
                Abkalben: {formatDate(kalbeDatum)}
              </div>
              <div className="text-green-600 text-sm text-center mt-1">
                (in {getDaysUntil(kalbeDatum)} Tagen)
              </div>
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