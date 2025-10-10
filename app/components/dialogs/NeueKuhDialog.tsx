'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface NeueKuhDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NeueKuhDialog({ isOpen, onClose, onSuccess }: NeueKuhDialogProps) {
  const [name, setName] = useState('');
  const [tiernummer, setTiernummer] = useState('');
  const [istKalbin, setIstKalbin] = useState(false);
  const [erstesKalben, setErstesKalben] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validierung
    if (!name.trim() || !tiernummer.trim()) {
      setError('Name und Tiernummer sind Pflichtfelder!');
      return;
    }

    if (istKalbin && !erstesKalben) {
      setError('Bei Kalbinnen muss ein erwartetes Kalbe-Datum angegeben werden!');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const data: any = {
        name: name.trim(),
        tiernummer: tiernummer.trim(),
        besamung_versuche: 0,
        klauenpflege: false,
        aktiv: true
      };

      if (istKalbin && erstesKalben) {
        const kalbeDatum = new Date(erstesKalben);
        data.erstes_kalben = kalbeDatum.toISOString();
        // Besamungsdatum zurückrechnen (280 Tage vor Kalben)
        const besamungsDatum = new Date(kalbeDatum);
        besamungsDatum.setDate(besamungsDatum.getDate() - 280);
        data.besamung_datum = besamungsDatum.toISOString();
        data.belegt = besamungsDatum.toISOString();
        data.besamung_versuche = 1;
      }

      const res = await fetch('/api/kuehe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        throw new Error('Fehler beim Erstellen');
      }

      // Reset
      setName('');
      setTiernummer('');
      setIstKalbin(false);
      setErstesKalben('');
      onSuccess();
      onClose();
    } catch (err) {
      setError('Fehler beim Speichern. Tiernummer evtl. schon vergeben?');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Plus className="w-7 h-7" />
            Neue Kuh anlegen
          </h3>
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 p-2 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              placeholder="z.B. Bella"
            />
          </div>

          {/* Tiernummer */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tiernummer *
            </label>
            <input
              type="text"
              value={tiernummer}
              onChange={(e) => setTiernummer(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              placeholder="z.B. 1234"
            />
          </div>

          {/* Kalbin Checkbox */}
          <div className="flex items-center gap-3 bg-pink-50 p-4 rounded-xl">
            <input
              type="checkbox"
              id="istKalbin"
              checked={istKalbin}
              onChange={(e) => setIstKalbin(e.target.checked)}
              className="w-6 h-6 text-pink-500 rounded focus:ring-pink-500"
            />
            <label htmlFor="istKalbin" className="text-lg font-semibold text-gray-800 cursor-pointer">
              Ist eine Kalbin (noch nie abgekalbt)
            </label>
          </div>

          {/* Erstes Kalben (nur wenn Kalbin) */}
          {istKalbin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Erwartetes erstes Kalbe-Datum *
              </label>
              <input
                type="date"
                value={erstesKalben}
                onChange={(e) => setErstesKalben(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transition-all active:scale-95 touch-manipulation disabled:opacity-50"
          >
            {isSaving ? 'Speichert...' : 'Anlegen'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-300 transition-all active:scale-95 touch-manipulation"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}