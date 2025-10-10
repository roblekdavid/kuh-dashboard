'use client';

import { Trash2 } from 'lucide-react';
import { Kuh } from '@/app/lib/types';

interface AbgangDialogProps {
  isOpen: boolean;
  onClose: () => void;
  kuh: Kuh | null;
  onConfirm: () => void;
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
        <div className="text-center mb-6">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Bist du dir sicher?
          </h3>
          <p className="text-lg text-gray-600">
            <span className="font-semibold">{kuh.name}</span> (Nr. {kuh.tiernummer}) wird endgültig aus dem System entfernt.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:shadow-lg transition-all active:scale-95 touch-manipulation"
          >
            Ja, entfernen
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-4 px-6 rounded-xl font-semibold text-lg transition-all active:scale-95 touch-manipulation"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}