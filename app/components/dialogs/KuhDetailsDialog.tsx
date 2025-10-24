'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Kuh } from '@/app/lib/types';
import { formatDate, parseDate, getDaysSince, getAlterInMonaten } from '@/app/lib/dateUtils';

interface KuhDetailsDialogProps {
  kuh: Kuh;
  onClose: () => void;
  onUpdate: () => void;
}

export default function KuhDetailsDialog({ kuh, onClose, onUpdate }: KuhDetailsDialogProps) {
  // Bearbeitbare Zuchtdaten
  const [letzteBrunst, setLetzteBrunst] = useState(
    kuh.letzte_brunst ? parseDate(kuh.letzte_brunst)?.toISOString().split('T')[0] : ''
  );
  const [besamungDatum, setBesamungDatum] = useState(
    kuh.besamung_datum ? parseDate(kuh.besamung_datum)?.toISOString().split('T')[0] : ''
  );
  const [besamungVersuche, setBesamungVersuche] = useState(kuh.besamung_versuche?.toString() || '0');
  const [kontrollStatus, setKontrollStatus] = useState(kuh.kontroll_status || '');
  const [trockengestelltAm, setTrockengestelltAm] = useState(
    kuh.trockengestellt_am ? parseDate(kuh.trockengestellt_am)?.toISOString().split('T')[0] : ''
  );
  const [abgekalbtAm, setAbgekalbtAm] = useState(
    kuh.abgekalbt_am ? parseDate(kuh.abgekalbt_am)?.toISOString().split('T')[0] : ''
  );
  const [klauenpflege, setKlauenpflege] = useState(kuh.klauenpflege || false);
  const [notizen, setNotizen] = useState(kuh.notizen || '');

  const handleSave = async () => {
    try {
      await fetch(`/api/kuehe/${kuh.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letzte_brunst: letzteBrunst ? new Date(letzteBrunst).toISOString() : null,
          besamung_datum: besamungDatum ? new Date(besamungDatum).toISOString() : null,
          besamung_versuche: parseInt(besamungVersuche) || 0,
          kontroll_status: kontrollStatus || null,
          trockengestellt_am: trockengestelltAm ? new Date(trockengestelltAm).toISOString() : null,
          abgekalbt_am: abgekalbtAm ? new Date(abgekalbtAm).toISOString() : null,
          klauenpflege: klauenpflege,
          notizen: notizen
        })
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Speichern');
    }
  };

  const handleReset = () => {
    if (confirm('Möchtest du wirklich alle Zuchtdaten zurücksetzen?')) {
      setLetzteBrunst('');
      setBesamungDatum('');
      setBesamungVersuche('0');
      setKontrollStatus('');
      setTrockengestelltAm('');
      setAbgekalbtAm('');
      setKlauenpflege(false);
    }
  };

  return (
    <div 
  className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  onClick={(e) => {
    // Nur schließen wenn auf Overlay geklickt, nicht auf Dialog
    if (e.target === e.currentTarget) {
      onClose();
    }
  }}
>
      <div 
  className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
  onClick={(e) => e.stopPropagation()}
  onMouseDown={(e) => e.stopPropagation()}
  style={{ touchAction: 'pan-y' }}
>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-3xl flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold">Details: {kuh.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Stammdaten (schreibgeschützt) */}
          <div className="bg-gray-100 p-4 rounded-xl space-y-3 border-2 border-gray-300">
            <h3 className="font-bold text-lg text-gray-800 mb-3">📋 Stammdaten (schreibgeschützt)</h3>
            
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Name:</span>
              <span className="text-gray-900 font-bold text-lg">{kuh.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Tiernummer:</span>
              <span className="text-gray-900 font-bold text-lg">{kuh.tiernummer}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Geburtsdatum:</span>
              <span className="text-gray-900 font-bold text-lg">
                {kuh.geburtsdatum ? formatDate(parseDate(kuh.geburtsdatum)!) : '-'}
              </span>
            </div>

            {kuh.geburtsdatum && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Alter:</span>
                <span className="text-gray-900">{getAlterInMonaten(parseDate(kuh.geburtsdatum)!)} Monate</span>
              </div>
            )}
          </div>

          {/* Zuchtdaten (bearbeitbar) */}
          <div className="bg-green-50 p-4 rounded-xl space-y-4 border-2 border-green-300">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-green-800">✏️ Zuchtdaten (bearbeitbar)</h3>
              <button
                onClick={handleReset}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold"
              >
                Zurücksetzen
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Letzte Brunst</label>
              <input
                type="date"
                value={letzteBrunst}
                onChange={(e) => setLetzteBrunst(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-green-300 focus:border-green-500 focus:outline-none text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Besamungsdatum</label>
              <input
                type="date"
                value={besamungDatum}
                onChange={(e) => setBesamungDatum(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-green-300 focus:border-green-500 focus:outline-none text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Besamungsversuche</label>
              <input
                type="number"
                value={besamungVersuche}
                onChange={(e) => setBesamungVersuche(e.target.value)}
                min="0"
                className="w-full px-4 py-3 rounded-xl border-2 border-green-300 focus:border-green-500 focus:outline-none text-lg"
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kontrollstatus</label>
              <select
                value={kontrollStatus}
                onChange={(e) => setKontrollStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-green-300 focus:border-green-500 focus:outline-none text-lg"
              >
                <option value="">-- Kein Status --</option>
                <option value="positiv">✅ Trächtig</option>
                <option value="negativ">❌ Nicht trächtig</option>
                <option value="unsicher">❓ Unsicher</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Trockengestellt am</label>
              <input
                type="date"
                value={trockengestelltAm}
                onChange={(e) => setTrockengestelltAm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-green-300 focus:border-green-500 focus:outline-none text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Abgekalbt am</label>
              <input
                type="date"
                value={abgekalbtAm}
                onChange={(e) => setAbgekalbtAm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-green-300 focus:border-green-500 focus:outline-none text-lg"
              />
            </div>

            <div className="flex items-center gap-3 bg-white p-3 rounded-xl">
              <input
                type="checkbox"
                id="klauenpflege"
                checked={klauenpflege}
                onChange={(e) => setKlauenpflege(e.target.checked)}
                className="w-6 h-6"
              />
              <label htmlFor="klauenpflege" className="font-semibold text-gray-700 text-lg">
                Klauenpflege fällig
              </label>
            </div>
          </div>

          {/* Notizen (bearbeitbar) */}
          <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300">
            <label className="block font-bold text-gray-800 mb-2">📝 Notizen</label>
            <textarea
              value={notizen}
              onChange={(e) => setNotizen(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-yellow-300 focus:border-yellow-500 focus:outline-none text-lg min-h-[100px]"
              placeholder="Notizen zur Kuh..."
              inputMode="text"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-white border-t-2 p-6 flex gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-gray-300 hover:bg-gray-400 rounded-xl font-bold text-gray-800 transition-colors text-lg"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold transition-all shadow-lg text-lg flex items-center justify-center gap-2"
          >
            <Save size={24} />
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}