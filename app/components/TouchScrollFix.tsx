'use client';

import { useEffect } from 'react';

export default function TouchScrollFix() {
  useEffect(() => {
    let isMouseDown = false;
    let startY = 0;
    let scrollTop = 0;
    let isScrolling = false;
    let scrollTarget: HTMLElement | Window | null = null;

    const findScrollableParent = (element: HTMLElement): HTMLElement | null => {
      let parent = element.parentElement;
      
      while (parent) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;
        
        // Prüfe ob Element scrollbar ist
        if ((overflowY === 'auto' || overflowY === 'scroll') && 
            parent.scrollHeight > parent.clientHeight) {
          return parent;
        }
        
        parent = parent.parentElement;
      }
      
      return null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Inputs, Buttons und interaktive Elemente nicht blockieren
      if (target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'SELECT' ||
          target.tagName === 'BUTTON' ||
          target.closest('button') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select') ||
          target.closest('[role="button"]')) {
          return;
      }

      // Finde scrollbaren Container (z.B. Dialog-Inhalt)
      const scrollableParent = findScrollableParent(target);
      
      if (scrollableParent) {
        // Wir sind in einem scrollbaren Container (z.B. Dialog)
        scrollTarget = scrollableParent;
        isMouseDown = true;
        startY = e.clientY;
        scrollTop = scrollableParent.scrollTop;
        isScrolling = false;
        e.preventDefault();
      } else {
        // Standard Window-Scrolling
        scrollTarget = window;
        isMouseDown = true;
        startY = e.clientY;
        scrollTop = window.scrollY;
        isScrolling = false;
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown || !scrollTarget) return;

      const diff = startY - e.clientY;
      
      if (Math.abs(diff) > 5) {
        isScrolling = true;
        
        if (scrollTarget === window) {
          window.scrollTo(0, scrollTop + diff);
        } else {
          (scrollTarget as HTMLElement).scrollTop = scrollTop + diff;
        }
      }

      if (isScrolling) {
        e.preventDefault();
      }
    };

    const handleMouseUp = () => {
      isMouseDown = false;
      isScrolling = false;
      scrollTarget = null;
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