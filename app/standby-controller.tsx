'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

function StandbyControllerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isAwake, setIsAwake] = useState(false);

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

  useEffect(() => {
    // Wake-up State aus URL lesen
    const wakeup = searchParams.get('wakeup');
    if (wakeup === 'true' && !isAwake) {
      setIsAwake(true);
    }

    const checkStandby = () => {
      const isOperating = isOperatingHours();

      // Nur außerhalb Betriebszeit prüfen
      if (!isOperating) {
        // Wenn auf Standby-Seite → nichts tun
        if (pathname === '/standby') {
          return;
        }

        // Wenn aufgeweckt → nach 15 Min Inaktivität zu Standby
        if (isAwake) {
          const inactive = Date.now() - lastActivity;
          if (inactive > 15 * 60 * 1000) {
            setIsAwake(false);
            router.push('/standby');
          }
        } else {
          // Nicht aufgeweckt → zu Standby (nur von Hauptseite)
          if (pathname === '/') {
            router.push('/standby');
          }
        }
      }
    };

    const handleActivity = () => setLastActivity(Date.now());
    
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    const interval = setInterval(checkStandby, 30000);
    checkStandby();

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [lastActivity, router, searchParams, pathname, isAwake]);

  return null;
}

export default function StandbyController() {
  return (
    <Suspense fallback={null}>
      <StandbyControllerInner />
    </Suspense>
  );
}