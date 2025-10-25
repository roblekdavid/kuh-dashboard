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
  const [wakeUpTime, setWakeUpTime] = useState<number | null>(null);
  
  // Prüfe ob wir auf dem Touch-Monitor sind
  const isTouchMonitor = process.env.NEXT_PUBLIC_IS_TOUCH_MONITOR === 'true';

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

  // Activity Handler
  useEffect(() => {
    const handleActivity = () => {
      console.log('🔥 ACTIVITY DETECTED, isStandby:', isStandby);
      setLastActivity(Date.now());
      if (isStandby) {
        console.log('✅ WAKING UP FROM STANDBY');
        setIsStandby(false);
        setWakeUpTime(Date.now());
      }
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [isStandby]);

  // Standby Check
  useEffect(() => {
    const checkStandby = () => {
      // Nur auf Touch-Monitor aktiv
      if (!isTouchMonitor) {
        console.log('ℹ️ Nicht auf Touch-Monitor - Standby deaktiviert');
        return;
      }
      
      const isOperating = isOperatingHours();

      if (!isOperating && !isStandby) {
        // Wenn aufgewacht → 10 Min Grace Period
        if (wakeUpTime) {
          const timeSinceWakeup = Date.now() - wakeUpTime;
          if (timeSinceWakeup < 10 * 60 * 1000) {
            console.log('⏳ Grace Period:', Math.round((10 * 60 * 1000 - timeSinceWakeup) / 1000), 'Sekunden verbleibend');
            return;
          }
        }
        
        // Grace Period vorbei → Standby
        console.log('💤 Gehe in Standby');
        setIsStandby(true);
        setWakeUpTime(null);
      }
    };

    const interval = setInterval(checkStandby, 30000);
    checkStandby();

    return () => clearInterval(interval);
  }, [isStandby, wakeUpTime, isTouchMonitor]);

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
            setWakeUpTime(Date.now());
          }}
          onTouchStart={(e) => {
            console.log('👆 OVERLAY TOUCHED');
            e.stopPropagation();
            e.preventDefault();
            setIsStandby(false);
            setLastActivity(Date.now());
            setWakeUpTime(Date.now());
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