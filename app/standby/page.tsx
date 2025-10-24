'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StandbyPage() {
  const router = useRouter();

  useEffect(() => {
  const handleWakeup = async () => {
    // Monitor hell machen
    await fetch('/api/brightness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brightness: 100 })
    });

    // Zur App navigieren
    router.push('/?wakeup=true');
  };

  // Sofort beim ersten Touch starten
  const handleTouch = (e: TouchEvent | MouseEvent) => {
    handleWakeup();
  };

  window.addEventListener('click', handleTouch);
  window.addEventListener('touchstart', handleTouch);
  window.addEventListener('mousedown', handleTouch); // Für Touch-als-Mouse

  return () => {
    window.removeEventListener('click', handleTouch);
    window.removeEventListener('touchstart', handleTouch);
    window.removeEventListener('mousedown', handleTouch);
  };
}, [router]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000',
      cursor: 'none'
    }} />
  );
}
