'use client';

import { X, Delete, ArrowBigUp } from 'lucide-react';
import { useState } from 'react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onClose: () => void;
  type: 'text' | 'numeric';
}

export default function VirtualKeyboard({ onKeyPress, onClose, type }: VirtualKeyboardProps) {
  const [uppercase, setUppercase] = useState(true);

  const numericKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['⌫', '0', '✓']
  ];

  const textKeys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Z', 'U', 'I', 'O', 'P', 'Ü'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ö', 'Ä'],
    ['⇧', 'Y', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
    ['LEER', '✓']
  ];

  const handleKeyClick = (key: string) => {
    if (key === '✓') {
      onClose();
    } else if (key === '⌫') {
      onKeyPress('Backspace');
    } else if (key === 'LEER') {
      onKeyPress(' ');
      setUppercase(true); // Nach Leerzeichen wieder Großbuchstaben
    } else if (key === '⇧') {
      setUppercase(!uppercase);
    } else {
      // Wende Groß-/Kleinschreibung an
      const finalKey = uppercase ? key : key.toLowerCase();
      onKeyPress(finalKey);
      
      // Nach jedem Buchstaben automatisch auf Kleinbuchstaben
      if (key.match(/[A-ZÄÖÜa-zäöü]/)) {
        setUppercase(false);
      }
    }
  };

  const keys = type === 'numeric' ? numericKeys : textKeys;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-800 to-gray-900 shadow-2xl z-[9999] p-3 border-t-4 border-blue-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-bold text-base">
          {type === 'numeric' ? '🔢 Zahlen' : '⌨️ Text'}
        </h3>
        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 p-2 rounded-lg text-white transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tastatur */}
      <div className="flex flex-col gap-2 max-w-5xl mx-auto">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 justify-center">
            {row.map((key) => {
              const isSpecial = key === '✓' || key === '⌫' || key === 'LEER' || key === '⇧';
              const isConfirm = key === '✓';
              const isDelete = key === '⌫';
              const isSpace = key === 'LEER';
              const isShift = key === '⇧';
              const displayKey = uppercase ? key : key.toLowerCase();
              
              return (
                <button
                  key={key}
                  onClick={() => handleKeyClick(key)}
                  className={`
                    flex items-center justify-center
                    rounded-lg font-bold text-lg
                    transition-all active:scale-95 shadow-md
                    min-w-[50px] min-h-[50px]
                    ${isSpace ? 'flex-grow min-w-[200px]' : ''}
                    ${isConfirm ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white' : ''}
                    ${isDelete ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white' : ''}
                    ${isSpace ? 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white' : ''}
                    ${isShift ? `${uppercase ? 'bg-blue-600' : 'bg-gray-600'} hover:bg-blue-700 active:bg-blue-800 text-white` : ''}
                    ${!isSpecial ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white border-2 border-gray-600' : ''}
                  `}
                >
                  {isDelete ? <Delete className="w-5 h-5" /> : 
                   isShift ? <ArrowBigUp className="w-5 h-5" /> : 
                   displayKey}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}