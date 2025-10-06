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
  showKlauenpflege?: boolean; // Nur auf Klauenpflege-Dashboard
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
  
  const kalbeDatum = kuh.ist_kalbin && kuh.erstes_kalben 
    ? parseDate(kuh.erstes_kalben) 
    : (kuh.besamung_datum ? getKalbeDatum(parseDate(kuh.besamung_datum)) : null);

  const handleAction = async (
    action: () => Promise<void>, 
    title: string, 
    message: string, 
    isDanger = false
  ) => {
    setConfirmAction({ 
      title, 
      message, 
      action: async () => {
        await action();
        setShowConfirm(false);
        onUpdate();
      }, 
      isDanger
    });
    setShowConfirm(true);
  };

  const handleDateAction = (
    action: (date: Date) => Promise<void>,
    title: string,
    message: string
  ) => {
    setDatePickerConfig({ title, message, action });
    setShowDatePicker(true);
  };

  const handleAbgang = async (grund: string) => {
    try {
      await fetch(`/api/kuehe/${kuh.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aktiv: false,
          abgangsdatum: new Date().toISOString(),
          abgangsgrund: grund,
          status: 'abgegangen'
        })
      });
      setShowAbgang(false);
      onUpdate();
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const getAktionen = () => {
    const aktionen = [];
    const heute = new Date();

    // ==================== KLAUENPFLEGE DASHBOARD ====================
    if (showKlauenpflege) {
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
          `Klauenpflege bei ${kuh.name} wurde durchgeführt?`
        )
      });
      return aktionen;
    }

    // ==================== KALBIN - ERSTES KALBEN ====================
    if (kuh.ist_kalbin && kalbeDatum) {
      const diff = getDaysUntil(kalbeDatum);
      if (diff <= 30) {
        aktionen.push({
          label: '🐮 Erstmals abgekalbt',
          color: 'from-pink-500 to-pink-600',
          onClick: () => handleDateAction(
            async (date: Date) => {
              await fetch(`/api/kuehe/${kuh.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ist_kalbin: false,
                  abgekalbt: true,
                  abgekalbt_am: date.toISOString(),
                  status: 'abgekalbt'
                })
              });
              onUpdate();
            },
            'Erstmalige Abkalbung',
            `Wann hat ${kuh.name} (Kalbin) zum ersten Mal abgekalbt?`
          )
        });
      }
      return aktionen;
    }

    // ==================== BRUNST BEOBACHTEN ====================
    if (kuh.status === 'brunst_beobachten' || kuh.status === 'abgekalbt') {
      // Button: Brunst beobachtet
      aktionen.push({
        label: '📝 Brunst beobachtet',
        color: 'from-blue-500 to-blue-600',
        onClick: () => handleDateAction(
          async (date: Date) => {
            await fetch(`/api/kuehe/${kuh.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                letzte_brunst: date.toISOString(),
                status: 'brunst_beobachten',
                abgekalbt: false,
                abgekalbt_am: null
              })
            });
            onUpdate();
          },
          'Brunst beobachtet',
          `Wann wurde die Brunst bei ${kuh.name} beobachtet?`
        )
      });

      // Button: Besamt
      aktionen.push({
        label: '✅ Besamt',
        color: 'from-green-500 to-green-600',
        onClick: () => handleDateAction(
          async (date: Date) => {
            const neueVersuche = (kuh.besamung_versuche || 0) + 1;
            const kontrollDatum = getKontrollDatum(date);
            
            await fetch(`/api/kuehe/${kuh.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                besamung_datum: date.toISOString(),
                letzte_brunst: date.toISOString(),
                besamung_versuche: neueVersuche,
                kontrolle: kontrollDatum.toISOString(),
                kontroll_status: null,
                status: 'besamt',
                abgekalbt: false,
                abgekalbt_am: null
              })
            });
            onUpdate();
          },
          'Besamung durchgeführt',
          `Wann wurde ${kuh.name} besamt?`
        )
      });
    }

    // ==================== KONTROLLIEREN ====================
    if (kuh.status === 'besamt' && kuh.kontrolle) {
      const kontrollDatum = parseDate(kuh.kontrolle)!;
      const diffKontrolle = getDaysUntil(kontrollDatum);
      
      // Kontrolle fällig oder überfällig
      if (diffKontrolle <= 7) {
        aktionen.push({
          label: '✅ Trächtig',
          color: 'from-purple-500 to-purple-600',
          onClick: () => handleAction(
            async () => {
              const besamungDatum = parseDate(kuh.besamung_datum)!;
              await fetch(`/api/kuehe/${kuh.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: 'traechtig',
                  kontroll_status: 'positiv',
                  belegt: kuh.besamung_datum,
                  kontrolle: null
                })
              });
            },
            'Trächtigkeit bestätigen',
            `${kuh.name} ist trächtig?`
          )
        });

        aktionen.push({
          label: '❌ Nicht trächtig',
          color: 'from-orange-500 to-orange-600',
          onClick: () => handleAction(
            async () => {
              // Nächste Brunst berechnen (21 Tage nach letzter Besamung)
              const letzteBrunst = parseDate(kuh.besamung_datum)!;
              const naechsteBrunst = getNaechsteBrunst(letzteBrunst);
              
              await fetch(`/api/kuehe/${kuh.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: 'brunst_beobachten',
                  kontroll_status: 'negativ',
                  belegt: null,
                  kontrolle: null,
                  letzte_brunst: naechsteBrunst.toISOString()
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
                  // Status bleibt 'besamt', bleibt im Dashboard
                })
              });
            },
            'Kontrolle unsicher',
            `Kontrolle bei ${kuh.name} war nicht eindeutig? (Kuh bleibt zur erneuten Kontrolle)`
          )
        });
      }
    }

    // ==================== TROCKENSTELLEN ====================
    if (trockenstellDatum && !kuh.trockengestellt && kuh.belegt) {
      const diff = getDaysUntil(trockenstellDatum);
      if (diff <= 14) {
        aktionen.push({
          label: '💤 Trockengestellt',
          color: 'from-indigo-500 to-indigo-600',
          onClick: () => handleAction(
            async () => {
              await fetch(`/api/kuehe/${kuh.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  trockengestellt: true,
                  trockengestellt_am: heute.toISOString(),
                  status: 'trocken'
                })
              });
            },
            'Trockenstellen bestätigen',
            `${kuh.name} wurde heute trockengestellt?`
          )
        });
      }
    }

    // ==================== ABKALBEN ====================
    if (kalbeDatum && kuh.trockengestellt && !kuh.abgekalbt) {
      const diff = getDaysUntil(kalbeDatum);
      if (diff <= 30) {
        aktionen.push({
          label: '🐮 Abgekalbt',
          color: 'from-green-500 to-green-600',
          onClick: () => handleDateAction(
            async (date: Date) => {
              await fetch(`/api/kuehe/${kuh.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  abgekalbt: true,
                  abgekalbt_am: date.toISOString(),
                  trockengestellt: false,
                  trockengestellt_am: null,
                  status: 'abgekalbt'
                })
              });
              onUpdate();
            },
            'Abkalbung',
            `Wann hat ${kuh.name} abgekalbt?`
          )
        });
      }
    }

    return aktionen;
  };

  const aktionen = getAktionen();
  const isUeberfaellig = kuh.kontrolle && getDaysUntil(parseDate(kuh.kontrolle)!) < -7;

  // Info-Text für bereits besamte Kühe die wieder erscheinen
  const zeigeBesamtInfo = kuh.besamung_datum && kuh.besamung_versuche > 0 && 
    (kuh.status === 'brunst_beobachten' || kuh.status === 'abgekalbt');

  return (
    <>
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border ${
        isUeberfaellig 
          ? 'border-red-300 ring-2 ring-red-200' 
          : kuh.ist_kalbin 
          ? 'border-pink-300 ring-2 ring-pink-200' 
          : 'border-gray-100'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800">{kuh.name}</h3>
              {kuh.ist_kalbin && (
                <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  KALBIN
                </span>
              )}
            </div>
            <p className="text-lg md:text-xl text-gray-500">Nr. {kuh.tiernummer}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`${
              kuh.ist_kalbin 
                ? 'bg-gradient-to-br from-pink-500 to-pink-600' 
                : 'bg-gradient-to-br from-blue-500 to-blue-600'
            } text-white px-4 py-2 rounded-xl font-semibold shadow-md text-base md:text-lg`}>
              #{kuh.tiernummer}
            </div>
            {kuh.klauenpflege && !showKlauenpflege && (
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-semibold flex items-center gap-1">
                <span>🦶</span> Klauenpflege
              </div>
            )}
          </div>
        </div>

        {/* Besamungs-Info (bei erneuter Brunst) */}
        {zeigeBesamtInfo && (
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
            <p className="text-sm text-yellow-800">
              <strong>ℹ️ Bereits besamt:</strong> {formatDate(parseDate(kuh.besamung_datum))} 
              ({kuh.besamung_versuche}x versucht)
            </p>
          </div>
        )}
        
        {/* Informationen */}
        <div className="space-y-3 mb-4">
          {kuh.ist_kalbin && kuh.erstes_kalben && (
            <div className="flex items-center gap-3 text-gray-700 flex-wrap bg-pink-50 p-3 rounded-lg">
              <Calendar className="w-5 h-5 text-pink-500 flex-shrink-0" />
              <span className="font-bold">Erstes Kalben:</span>
              <span>{formatDate(parseDate(kuh.erstes_kalben))}</span>
              <span className="ml-auto text-sm bg-pink-200 text-pink-800 px-3 py-1 rounded-full whitespace-nowrap font-semibold">
                in {getDaysUntil(parseDate(kuh.erstes_kalben)!)} Tagen
              </span>
            </div>
          )}
          
          {showInfo.includes('brunst') && kuh.letzte_brunst && (
            <div className="flex items-center gap-3 text-gray-700 flex-wrap">
              <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="font-medium">Letzte Brunst:</span>
              <span>{formatDate(parseDate(kuh.letzte_brunst))}</span>
              <span className="ml-auto text-sm bg-blue-100 px-3 py-1 rounded-full whitespace-nowrap">
                vor {Math.abs(getDaysUntil(parseDate(kuh.letzte_brunst)!))} Tagen
              </span>
            </div>
          )}
          
          {showInfo.includes('kontrolle') && kuh.kontrolle && (
            <div className="flex items-center gap-3 text-gray-700 flex-wrap">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                isUeberfaellig ? 'text-red-500' : 'text-orange-500'
              }`} />
              <span className="font-medium">Kontrolle:</span>
              <span>{formatDate(parseDate(kuh.kontrolle))}</span>
              <span className={`ml-auto text-sm px-3 py-1 rounded-full whitespace-nowrap ${
                isUeberfaellig 
                  ? 'bg-red-100 text-red-700 font-bold' 
                  : 'bg-orange-100'
              }`}>
                {isUeberfaellig 
                  ? `${Math.abs(getDaysUntil(parseDate(kuh.kontrolle)!))} Tage überfällig!` 
                  : `in ${getDaysUntil(parseDate(kuh.kontrolle)!)} Tagen`
                }
              </span>
            </div>
          )}
          
          {showInfo.includes('trockenstellen') && trockenstellDatum && (
            <div className="flex items-center gap-3 text-gray-700 flex-wrap">
              <Milk className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <span className="font-medium">Trockenstellen:</span>
              <span>{formatDate(trockenstellDatum)}</span>
              <span className="ml-auto text-sm bg-purple-100 px-3 py-1 rounded-full whitespace-nowrap">
                in {getDaysUntil(trockenstellDatum)} Tagen
              </span>
            </div>
          )}
          
          {showInfo.includes('kalben') && kalbeDatum && (
            <div className="flex items-center gap-3 text-gray-700 flex-wrap">
              <Calendar className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="font-medium">Kalben:</span>
              <span>{formatDate(kalbeDatum)}</span>
              <span className="ml-auto text-sm bg-green-100 px-3 py-1 rounded-full whitespace-nowrap">
                in {getDaysUntil(kalbeDatum)} Tagen
              </span>
            </div>
          )}
          
          {showInfo.includes('abgekalbt') && kuh.abgekalbt_am && (
            <div className="flex items-center gap-3 text-gray-700 flex-wrap">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="font-medium">Abgekalbt:</span>
              <span>{formatDate(parseDate(kuh.abgekalbt_am))}</span>
              <span className="ml-auto text-sm bg-green-100 px-3 py-1 rounded-full whitespace-nowrap">
                vor {Math.abs(getDaysUntil(parseDate(kuh.abgekalbt_am)!))} Tagen
              </span>
            </div>
          )}
        </div>

        {/* Smart Action Buttons */}
        {aktionen.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-gray-200">
            {aktionen.map((aktion, index) => (
              <button
                key={index}
                onClick={aktion.onClick}
                className={`w-full bg-gradient-to-r ${aktion.color} text-white py-3 md:py-4 px-4 rounded-xl font-semibold text-base md:text-lg hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 touch-manipulation`}
              >
                {aktion.label}
              </button>
            ))}
          </div>
        )}

        {/* Abmelden Button (nur wenn NICHT Klauenpflege-Dashboard) */}
        {!showKlauenpflege && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowAbgang(true)}
              className="w-full bg-red-100 text-red-700 hover:bg-red-200 py-3 px-4 rounded-lg transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Tier abmelden
            </button>
          </div>
        )}
      </div>

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
        onConfirm={handleAbgang}
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