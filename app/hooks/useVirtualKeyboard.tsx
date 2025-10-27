'use client';

import { useState, useEffect, useRef } from 'react';

export function useVirtualKeyboard() {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardType, setKeyboardType] = useState<'text' | 'numeric'>('text');
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const input = target as HTMLInputElement | HTMLTextAreaElement;
        setActiveInput(input);
        
        // Bestimme Tastatur-Typ basierend auf inputMode
        const inputMode = input.getAttribute('inputMode');
        if (inputMode === 'numeric') {
          setKeyboardType('numeric');
        } else {
          setKeyboardType('text');
        }
        
        setShowKeyboard(true);
      }
    };

    document.addEventListener('focusin', handleFocus);
    
    return () => {
      document.removeEventListener('focusin', handleFocus);
    };
  }, []);
  // Tastatur schließen bei Klick außerhalb
useEffect(() => {
  if (!showKeyboard) return;

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Prüfe ob auf Input/Textarea geklickt wurde
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return; // Tastatur bleibt offen, wechselt nur den Fokus
    }
    
    // Prüfe ob auf Tastatur selbst geklickt wurde
    const keyboard = document.querySelector('[class*="fixed bottom-0"]');
    if (keyboard && keyboard.contains(target)) {
      return; // Klick auf Tastatur selbst - nicht schließen
    }
    
    // Klick außerhalb - Tastatur schließen
    closeKeyboard();
  };

  // Kleiner Delay damit Fokus-Event zuerst verarbeitet wird
  setTimeout(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as any);
  }, 100);
  
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('touchstart', handleClickOutside as any);
  };
}, [showKeyboard]);

const handleKeyPress = (key: string) => {
    if (!activeInput) return;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    const start = activeInput.selectionStart || 0;
    const end = activeInput.selectionEnd || 0;
    const value = activeInput.value;

    let newValue = value;
    let newCursorPos = start;

    if (key === 'Backspace') {
      if (start > 0) {
        newValue = value.slice(0, start - 1) + value.slice(end);
        newCursorPos = start - 1;
      }
    } else {
      newValue = value.slice(0, start) + key + value.slice(end);
      newCursorPos = start + key.length;
    }

    // Setze Wert mit nativem Setter
    if (activeInput instanceof HTMLInputElement && nativeInputValueSetter) {
      nativeInputValueSetter.call(activeInput, newValue);
    } else if (activeInput instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
      nativeTextAreaValueSetter.call(activeInput, newValue);
    }

    // Trigger React Events
    const inputEvent = new Event('input', { bubbles: true });
    activeInput.dispatchEvent(inputEvent);

    // WICHTIG: Setze Cursor-Position NACH dem Event
    requestAnimationFrame(() => {
      activeInput.focus();
      activeInput.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  const closeKeyboard = () => {
    setShowKeyboard(false);
    setActiveInput(null);
  };

  return {
    showKeyboard,
    keyboardType,
    handleKeyPress,
    closeKeyboard
  };
}