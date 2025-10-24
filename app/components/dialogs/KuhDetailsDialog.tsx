'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Kuh } from '@/app/lib/types';
import { formatDate, parseDate, getDaysSince, getAlterInMonaten } from '@/app/lib/dateUtils';

interface KuhDetailsDialogProps {
  kuh: Kuh;
  onClose: () => void;
  onUpdate: () => void;
}

export default function KuhDetailsDialog({ kuh, onClose, onUpdate }: KuhDetailsDialogProps) {
  const [name, setName] = useState(kuh.name);
  const [tiernummer, setTiernummer] = useState(kuh.tiernummer);
  const [geburtsdatum, setGeburtsdatum] = useState(
    kuh.geburtsdatum ? formatDate(parseDate(kuh.geburtsdatum)!) : ''
  );

  const handleSave = async () => {
    try {
      await fetch(`/api/kuehe/${kuh.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tiernummer,
          geburtsdatum: geburtsdatum ? new Date(geburtsdatum.split('.').reverse().join('-')).toISOString() : null
        })
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Fehler:', error);
      alert('Fehler beim Speichern');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-3xl flex justify-between items-center">
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
          {/* Bearbeitbare Felder */}
          <div className="bg-blue-50 p-4 rounded-xl space-y-3">
            <h3 className="font-bold text-lg text-blue-800 mb-3">Stammdaten (bearbeitbar)</h3>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-lg"
                inputMode="text"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tiernummer</label>
              <input
                type="text"
                value={tiernummer}
                onChange={(e) => setTiernummer(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-lg"
                inputMode="text"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Geburtsdatum</label>
              <input
                type="date"
                value={geburtsdatum ? geburtsdatum.split('.').reverse().join('-') : ''}
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  setGeburtsdatum(formatDate(date));
                }}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-lg"
              />
            </div>
          </div>

          {/* Nicht bearbeitbare Felder */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-3">
            <h3 className="font-bold text-lg text-gray-800 mb-3">Zuchtdaten (schreibgeschützt)</h3>
            
            {kuh.geburtsdatum && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Alter:</span>
                <span className="text-gray-900">{getAlterInMonaten(parseDate(kuh.geburtsdatum)!)} Monate</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Letzte Brunst:</span>
              <span className="text-gray-900">
                {kuh.letzte_brunst ? formatDate(parseDate(kuh.letzte_brunst)!) : 'Keine'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Letzte Besamung:</span>
              <span className="text-gray-900">
                {kuh.besamung_datum ? formatDate(parseDate(kuh.besamung_datum)!) : 'Nicht besamt'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Besamungsversuche:</span>
              <span className="text-gray-900">{kuh.besamung_versuche || 0}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-semibold text-gray-600">Kontrollstatus:</span>
              <span className="text-gray-900">
                {kuh.kontroll_status === 'positiv' ? '✅ Trächtig' : 
                 kuh.kontroll_status === 'negativ' ? '❌ Nicht trächtig' :
                 kuh.kontroll_status === 'unsicher' ? '❓ Unsicher' : '-'}
              </span>
            </div>

            {kuh.trockengestellt_am && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Trockengestellt am:</span>
                <span className="text-gray-900">{formatDate(parseDate(kuh.trockengestellt_am)!)}</span>
              </div>
            )}

            {kuh.abgekalbt_am && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Abgekalbt am:</span>
                <span className="text-gray-900">
                  {formatDate(parseDate(kuh.abgekalbt_am)!)} (vor {getDaysSince(parseDate(kuh.abgekalbt_am)!)} Tagen)
                </span>
              </div>
            )}

            {kuh.klauenpflege && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Klauenpflege:</span>
                <span className="text-orange-600 font-bold">⚠️ Fällig</span>
              </div>
            )}
          </div>

          {/* Notizen */}
          {kuh.notizen && (
            <div className="bg-yellow-50 p-4 rounded-xl">
              <h3 className="font-bold text-gray-800 mb-2">Notizen</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{kuh.notizen}</p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-white border-t-2 p-6 flex gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-gray-800 transition-colors text-lg"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg text-lg"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}