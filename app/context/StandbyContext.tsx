'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StandbyContextType {
  isStandby: boolean;
  setStandby: (value: boolean) => void;
}

const StandbyContext = createContext<StandbyContextType | undefined>(undefined);

export function StandbyProvider({ children }: { children: ReactNode }) {
  const [isStandby, setIsStandby] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  // Prüfe ob wir auf dem Touch-Monitor sind
  const isTouchMonitor = process.env.NEXT_PUBLIC_IS_TOUCH_MONITOR === 'true';

  // Grace Period: Bei Seitenaufruf 15 Min ohne Standby
  const [pageLoadTime] = useState(Date.now());
  
  const isInGracePeriod = () => {
    const minutesSinceLoad = (Date.now() - pageLoadTime) / (1000 * 60);
    return minutesSinceLoad < 15; // 15 Minuten Grace Period
  };

  const isOperatingHours = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeMin = hour * 60 + minute;

    const morningStart = 5 * 60;
    const morningEnd = 9 * 60 + 30;
    const eveningStart = 16 * 60;
    const eveningEnd = 21 * 60;

    return (timeMin >= morningStart && timeMin < morningEnd) ||
           (timeMin >= eveningStart && timeMin < eveningEnd);
  };

  // Activity Handler - KRITISCH für Timer-Reset
  useEffect(() => {
    if (!isTouchMonitor) return;
    
    const handleActivity = () => {
      console.log('🔥 ACTIVITY DETECTED');
      setLastActivity(Date.now()); // ← WICHTIG: Timer zurücksetzen
      
      // Wenn im Standby → aufwachen
      if (isStandby) {
        console.log('✅ WAKING UP FROM STANDBY');
        setIsStandby(false);
      }
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousemove', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
    };
  }, [isStandby, isTouchMonitor]);

  // Standby Check - läuft kontinuierlich
  useEffect(() => {
    if (!isTouchMonitor) {
      console.log('ℹ️ Nicht auf Touch-Monitor - Standby deaktiviert');
      return;
    }
    
    const checkStandby = () => {
      const isOperating = isOperatingHours();
      const minutesSinceActivity = (Date.now() - lastActivity) / (1000 * 60);

      console.log(`🕐 Check: Betriebszeit=${isOperating}, InaktivMin=${minutesSinceActivity.toFixed(1)}, Standby=${isStandby}`);
      // Grace Period: Kein Standby in den ersten 15 Min nach Seitenaufruf
      if (isInGracePeriod() && !isStandby) {
        console.log('🛡️ Grace Period aktiv - kein Standby');
        return;
      }
      // FALL 1: Betriebszeit → Aus Standby aufwachen
      if (isOperating && isStandby) {
        console.log('⏰ Betriebszeit begonnen - Aufwachen aus Standby');
        setIsStandby(false);
        setLastActivity(Date.now());
        return;
      }

      // FALL 2: Außerhalb Betriebszeit UND 10 Min inaktiv → Standby
      if (!isOperating && !isStandby && minutesSinceActivity >= 10) {
        console.log('💤 10 Min inaktiv außerhalb Betriebszeit - Gehe in Standby');
        setIsStandby(true);
        return;
      }
    };

    // Prüfe alle 30 Sekunden
    const interval = setInterval(checkStandby, 30000);
    checkStandby(); // Initiales Check

    return () => clearInterval(interval);
  }, [isStandby, lastActivity, isTouchMonitor]);

  // Monitor-Helligkeit steuern (nur auf Touch-Monitor)
  useEffect(() => {
    if (!isTouchMonitor) return;

    const setBrightness = async (value: number) => {
      try {
        await fetch('/api/brightness', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brightness: value })
        });
        console.log(`💡 Helligkeit auf ${value}% gesetzt`);
      } catch (error) {
        console.error('Fehler beim Setzen der Helligkeit:', error);
      }
    };

    if (isStandby) {
      setBrightness(0);  // Standby → dunkel
    } else {
      setBrightness(100);  // Wach → hell
    }
  }, [isStandby, isTouchMonitor]);

  return (
    <StandbyContext.Provider value={{ isStandby, setStandby: setIsStandby }}>
      {children}
      
      {/* Globaler Standby-Overlay - nur auf Touch-Monitor */}
      {isStandby && isTouchMonitor && (
        <div 
          className="fixed inset-0 bg-black z-[10000] cursor-none"
          onClick={(e) => {
            console.log('🖱️ OVERLAY CLICKED');
            e.stopPropagation();
            e.preventDefault();
            setIsStandby(false);
            setLastActivity(Date.now());
          }}
          onTouchStart={(e) => {
            console.log('👆 OVERLAY TOUCHED');
            e.stopPropagation();
            e.preventDefault();
            setIsStandby(false);
            setLastActivity(Date.now());
          }}
        />
      )}
    </StandbyContext.Provider>
  );
}

export function useStandby() {
  const context = useContext(StandbyContext);
  if (!context) {
    throw new Error('useStandby must be used within StandbyProvider');
  }
  return context;
}