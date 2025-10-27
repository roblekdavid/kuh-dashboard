'use client';

import { useState } from 'react';
import { Calendar, X } from 'lucide-react';

interface DatePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  title: string;
  message: string;
  defaultDate?: Date;
}

export default function DatePickerDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  defaultDate
}: DatePickerDialogProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    defaultDate 
      ? defaultDate.toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(new Date(selectedDate));
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6 sm:p-8" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-4">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 break-words flex-1">{title}</h3>
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 p-2 rounded-xl transition-all flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-base sm:text-lg text-gray-600 mb-5 sm:mb-6 break-words">{message}</p>
        
        {/* Datumswahl */}
        <div className="mb-6 sm:mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Datum auswählen:
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              onFocus={(e) => e.target.blur()}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={handleConfirm}
            className="w-full sm:flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 sm:py-4 px-6 rounded-xl font-semibold text-base sm:text-lg hover:shadow-lg transition-all active:scale-95 touch-manipulation"
          >
            Bestätigen
          </button>
          <button
            onClick={onClose}
            className="w-full sm:flex-1 bg-gray-200 text-gray-800 py-3 sm:py-4 px-6 rounded-xl font-semibold text-base sm:text-lg hover:bg-gray-300 transition-all active:scale-95 touch-manipulation"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}