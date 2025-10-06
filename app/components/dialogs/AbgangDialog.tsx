'use client';

import { Kuh } from '@/app/lib/types';

interface AbgangDialogProps {
  isOpen: boolean;
  onClose: () => void;
  kuh: Kuh | null;
  onConfirm: (grund: string) => void;
}

export default function AbgangDialog({ 
  isOpen, 
  onClose, 
  kuh, 
  onConfirm 
}: AbgangDialogProps) {
  if (!isOpen || !kuh) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8" 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Tier abmelden</h3>
        <p className="text-lg text-gray-600 mb-6">
          {kuh.name} (Nr. {kuh.tiernummer}) aus dem Bestand nehmen?
        </p>
        <div className="space-y-3">
          <button
            onClick={() => onConfirm('verkauft')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all active:scale-95 touch-manipulation"
          >
            📦 Verkauft
          </button>
          <button
            onClick={() => onConfirm('geschlachtet')}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all active:scale-95 touch-manipulation"
          >
            🥩 Geschlachtet
          </button>
          <button
            onClick={() => onConfirm('verendet')}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all active:scale-95 touch-manipulation"
          >
            💀 Verendet
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 px-6 rounded-xl font-semibold text-lg transition-all active:scale-95 touch-manipulation"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}