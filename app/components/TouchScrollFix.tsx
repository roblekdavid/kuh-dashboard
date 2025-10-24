'use client';

import { useEffect } from 'react';

export default function TouchScrollFix() {
  useEffect(() => {
    let isMouseDown = false;
    let startY = 0;
    let scrollTop = 0;
    let isScrolling = false;

    const handleMouseDown = (e: MouseEvent) => {
      // Nur wenn nicht auf Input/Button geklickt
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'SELECT' ||
          target.tagName === 'BUTTON' ||
          target.closest('button')) {
        return;
      }

      isMouseDown = true;
      startY = e.clientY;
      scrollTop = window.scrollY;
      isScrolling = false;
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;

      const diff = startY - e.clientY;
      
      if (Math.abs(diff) > 5) {
        isScrolling = true;
        window.scrollTo(0, scrollTop + diff);
      }

      if (isScrolling) {
        e.preventDefault();
      }
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      isScrolling = false;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return null;
}