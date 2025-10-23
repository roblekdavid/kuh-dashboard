'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StandbyPage() {
  const router = useRouter();

  useEffect(() => {
    // Monitor dimmen beim Laden
    fetch('/api/brightness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brightness: 0 })
    });

    const handleWakeup = () => {
      // Monitor wieder hell beim Touch
      fetch('/api/brightness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brightness: 100 })
      }).then(() => {
        router.push('/?wakeup=true');
      });
    };

    window.addEventListener('click', handleWakeup);
    window.addEventListener('touchstart', handleWakeup);

    return () => {
      window.removeEventListener('click', handleWakeup);
      window.removeEventListener('touchstart', handleWakeup);
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
