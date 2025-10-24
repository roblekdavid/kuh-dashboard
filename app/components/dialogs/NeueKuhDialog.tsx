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
  const [geburtsdatum, setGeburtsdatum] = useState('');
  const [abgekalbtAm, setAbgekalbtAm] = useState('');
  const [besamungDatum, setBesamungDatum] = useState('');
  const [istTraechtig, setIstTraechtig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validierung
    if (!name.trim() || !tiernummer.trim()) {
      setError('Name, Tiernummer und Geburtsdatum sind Pflichtfelder!');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const data: any = {
        name: name.trim(),
        tiernummer: tiernummer.trim(),
        geburtsdatum: new Date(geburtsdatum).toISOString(),
        besamung_versuche: 0,
        klauenpflege: false
      };

      // Wenn Abkalbe-Datum gesetzt = Kuh
      if (abgekalbtAm) {
        data.abgekalbt_am = new Date(abgekalbtAm).toISOString();
      }
      
      // Wenn Besamung gesetzt
      if (besamungDatum) {
        data.besamung_datum = new Date(besamungDatum).toISOString();
        data.letzte_brunst = new Date(besamungDatum).toISOString();
        data.besamung_versuche = 1;
        
        // Wenn als trächtig markiert
        if (istTraechtig) {
          data.kontroll_status = 'positiv';
        }
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
      setGeburtsdatum('');
      setAbgekalbtAm('');
      setBesamungDatum('');
      setIstTraechtig(false);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Fehler beim Speichern. Tiernummer evtl. schon vergeben?');
    } finally {
      setIsSaving(false);
    }
  };
  const handleClose = () => {
    setName('');
    setTiernummer('');
    setGeburtsdatum('');
    setAbgekalbtAm('');
    setBesamungDatum('');
    setIstTraechtig(false);
    setError('');
    onClose();
  };
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 p-6 sm:p-8 max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Neue Kuh anlegen</h3>
          <button
            onClick={handleClose}
            className="bg-gray-200 hover:bg-gray-300 p-2 rounded-xl transition-all"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        
        {/* Pflichtfelder */}
        <div className="space-y-4 mb-6">
          <h4 className="font-semibold text-gray-700">Pflichtfelder</h4>
          
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder="Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-xl text-gray-700 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder="Tiernummer *"
            value={tiernummer}
            onChange={(e) => setTiernummer(e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-xl text-gray-700 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Geburtsdatum *
            </label>
            <input
              type="date"
              value={geburtsdatum}
              onChange={(e) => setGeburtsdatum(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-xl text-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Optionale Felder */}
        <div className="space-y-4 mb-6 pt-4 border-t">
          <h4 className="font-semibold text-gray-700">Optionale Angaben</h4>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Abgekalbt am (leer = Kalbin)
            </label>
            <input
              type="date"
              value={abgekalbtAm}
              onChange={(e) => setAbgekalbtAm(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-xl text-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Besamung Datum
            </label>
            <input
              type="date"
              value={besamungDatum}
              onChange={(e) => setBesamungDatum(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-xl text-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          {besamungDatum && (
            <label className="flex items-center gap-3 cursor-pointer bg-green-50 p-3 rounded-xl">
              <input
                type="checkbox"
                checked={istTraechtig}
                onChange={(e) => setIstTraechtig(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-gray-700 font-semibold">Trächtig (Kontrollstatus positiv)</span>
            </label>
          )}
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Speichern...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Kuh anlegen
              </span>
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}