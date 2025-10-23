'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function StandbyControllerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    const checkStandby = () => {
      const isOperating = isOperatingHours();
      const wakeup = searchParams.get('wakeup');

      if (!isOperating && !wakeup) {
        router.push('/standby');
      } else if (!isOperating && wakeup) {
        const inactive = Date.now() - lastActivity;
        if (inactive > 15 * 60 * 1000) {
          router.push('/standby');
        }
      }
    };

    const handleActivity = () => setLastActivity(Date.now());
    
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('mousemove', handleActivity);

    const interval = setInterval(checkStandby, 30000);
    checkStandby();

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
    };
  }, [lastActivity, router, searchParams]);

  return null;
}

export default function StandbyController() {
  return (
    <Suspense fallback={null}>
      <StandbyControllerInner />
    </Suspense>
  );
}
