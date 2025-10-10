'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MilchmessungMonitorPage() {
  const [plaetze, setPlaetze] = useState<Array<{ platz: number; kuh: any | null }>>([]);

  useEffect(() => {
    loadPlaetze();
    
    // Polling jede Sekunde für schnelle Updates
    const interval = setInterval(loadPlaetze, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadPlaetze = async () => {
    const res = await fetch('/api/milchmessung');
    const data = await res.json();
    setPlaetze(data.plaetze);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/milchmessung">
                <button className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-all">
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold">🥛 Milchmessung</h1>
                <p className="text-base sm:text-xl md:text-2xl text-blue-100 mt-1 sm:mt-2">Melkstand Übersicht</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm sm:text-base md:text-xl opacity-75">
                {new Date().toLocaleTimeString('de-DE')}
              </div>
            </div>
          </div>
        </div>

        {/* Melkstand Plätze - Große Ansicht */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 sm:gap-4 md:gap-6">
          {plaetze.map((platz) => (
            <div
              key={platz.platz}
              className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl transition-all ${
                platz.kuh 
                  ? 'bg-gradient-to-br from-green-400 to-green-500' 
                  : 'bg-gradient-to-br from-gray-600 to-gray-700'
              }`}
            >
              <div className="text-center text-white">
                <div className="text-3xl sm:text-4xl md:text-6xl font-bold mb-2 sm:mb-3 md:mb-4">
                  {platz.platz}
                </div>
                {platz.kuh ? (
                  <>
                    <div className="text-4xl sm:text-5xl md:text-7xl mb-2 sm:mb-3 md:mb-4">🐮</div>
                    <div className="text-lg sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{platz.kuh.name}</div>
                    <div className="text-sm sm:text-xl md:text-2xl opacity-90">Nr. {platz.kuh.tiernummer}</div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl sm:text-5xl md:text-7xl mb-2 sm:mb-3 md:mb-4 opacity-30">🐮</div>
                    <div className="text-base sm:text-xl md:text-2xl opacity-50">Leer</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}