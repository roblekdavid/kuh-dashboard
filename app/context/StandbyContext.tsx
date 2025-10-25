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
      const isOperating = isOperatingHours();

      if (!isOperating && !isStandby) {
        // Außerhalb Betriebszeit → Standby
        setIsStandby(true);
      } else if (!isOperating && isStandby) {
        // Im Standby → nach 15 Min Inaktivität wieder Standby
        const inactive = Date.now() - lastActivity;
        if (inactive > 15 * 60 * 1000 && !isStandby) {
          setIsStandby(true);
        }
      }
    };

    const interval = setInterval(checkStandby, 30000);
    checkStandby();

    return () => clearInterval(interval);
  }, [isStandby, lastActivity]);

  return (
    <StandbyContext.Provider value={{ isStandby, setStandby: setIsStandby }}>
      {children}
      
      {/* Globaler Standby-Overlay */}
      {isStandby && (
        <div 
    className="fixed inset-0 bg-black z-[10000] cursor-none"
    onClick={(e) => {
      console.log('🖱️ OVERLAY CLICKED');  // ← HINZUFÜGEN
      e.stopPropagation();
      setIsStandby(false);
    }}
    onTouchStart={(e) => {
      console.log('👆 OVERLAY TOUCHED');  // ← HINZUFÜGEN
      e.stopPropagation();
      setIsStandby(false);
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