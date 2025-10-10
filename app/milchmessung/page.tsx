'use client';

import { useState, useEffect } from 'react';
import { Search, X, ArrowLeft, Trash2, Monitor } from 'lucide-react';
import Link from 'next/link';
import { Kuh } from '@/app/lib/types';
import SuccessToast from '@/app/components/dialogs/SuccessToast';

export default function MilchmessungPage() {
  const [kuehe, setKuehe] = useState<Kuh[]>([]);
  const [plaetze, setPlaetze] = useState<Array<{ platz: number; kuh: Kuh | null }>>([]);
  const [selectedPlatz, setSelectedPlatz] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadKuehe();
    loadPlaetze();
    
    // Polling alle 2 Sekunden für Synchronisation
    const interval = setInterval(loadPlaetze, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadKuehe = async () => {
  const res = await fetch('/api/kuehe');
  const data = await res.json();
  
  // Nur melkende Kühe (keine Kalbinnen, keine trockengestellten)
  const melkendeKuehe = data.filter((kuh: Kuh) => 
    kuh.abgekalbt_am !== null && // Keine Kalbinnen
    kuh.trockengestellt_am === null // Keine trockengestellten
  );
  
  setKuehe(melkendeKuehe);
};

  const loadPlaetze = async () => {
    const res = await fetch('/api/milchmessung');
    const data = await res.json();
    setPlaetze(data.plaetze);
  };

  const setKuhAufPlatz = async (platz: number, kuh: Kuh | null) => {
    await fetch('/api/milchmessung', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set', platz, kuh })
    });
    await loadPlaetze();
    
    // Visuelles Feedback
    if (kuh) {
      // Success Toast zeigen
      setSuccessMessage(`✅ ${kuh.name} → Platz ${platz}`);
      setShowSuccess(true);
      
      // Haptic Feedback (Vibration auf mobilen Geräten)
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // Kurze Verzögerung für visuelles Feedback
      setTimeout(() => {
        // Springe zum nächsten leeren Platz
        const nextEmpty = plaetze.findIndex((p, idx) => idx > platz - 1 && !p.kuh);
        if (nextEmpty !== -1) {
            setSelectedPlatz(nextEmpty + 1);
        } else {
            setSelectedPlatz(null);
            setSuccessMessage('✅ Alle Plätze belegt!');
        }
        }, 300);
    }
    setSearchTerm('');
  };

  const alleZuruecksetzen = async () => {
    await fetch('/api/milchmessung', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' })
    });
    await loadPlaetze();
    setSelectedPlatz(null);
    setSearchTerm('');
    
    // Success Feedback
    setSuccessMessage('🗑️ Alle Plätze geleert');
    setShowSuccess(true);
  };

  const filteredKuehe = kuehe.filter(k => 
    (k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.tiernummer.toString().includes(searchTerm))
  ).sort((a, b) => {
    // Bereits zugewiesene Kühe ans Ende sortieren
    const aZugewiesen = plaetze.some(p => p.kuh?.id === a.id);
    const bZugewiesen = plaetze.some(p => p.kuh?.id === b.id);
    if (aZugewiesen && !bZugewiesen) return 1;
    if (!aZugewiesen && bZugewiesen) return -1;
    return 0;
  });

  const selectKuh = (kuh: Kuh) => {
    if (selectedPlatz) {
      // Prüfe ob Kuh bereits zugewiesen ist
      const istBereitsZugewiesen = plaetze.some(p => p.kuh?.id === kuh.id);
      if (!istBereitsZugewiesen) {
        setKuhAufPlatz(selectedPlatz, kuh);
      }
    }
  };

  const openPlatzSearch = (platz: number) => {
    setSelectedPlatz(platz);
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl shadow-2xl p-4 mb-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/alle-kuehe">
                <button className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">🥛 Milchmessung</h1>
                <p className="text-xs text-blue-100">Melker-Ansicht</p>
              </div>
            </div>
            <Link href="/milchmessung/monitor">
              <button className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl font-semibold flex items-center gap-2 text-sm">
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">Monitor</span>
              </button>
            </Link>
          </div>

          {/* Suchfeld im Header - nur wenn Platz ausgewählt */}
          {selectedPlatz && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                placeholder={`Kuh für Platz ${selectedPlatz} suchen...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-10 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white placeholder-white/70 focus:bg-white/30 transition-all font-semibold border-2 border-white/30"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedPlatz(null);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Großer Löschen-Button */}
          <button
            onClick={alleZuruecksetzen}
            className="w-full bg-red-500 hover:bg-red-600 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg shadow-lg active:scale-95 transition-all"
          >
            <Trash2 className="w-6 h-6" />
            Alle Plätze leeren
          </button>
        </div>

        {/* Kuh-Liste - kompakt unter Header */}
        {selectedPlatz && filteredKuehe.length > 0 && (
          <div className="mb-4 bg-white rounded-2xl shadow-xl p-3 max-h-[40vh] overflow-y-auto">
            <div className="space-y-2">
              {filteredKuehe.map((kuh) => {
                const istBereitsZugewiesen = plaetze.some(p => p.kuh?.id === kuh.id);
                return (
                  <button
                    key={kuh.id}
                    onClick={() => !istBereitsZugewiesen && selectKuh(kuh)}
                    disabled={istBereitsZugewiesen}
                    className={`w-full p-3 rounded-xl transition-all flex items-center gap-3 text-left ${
                      istBereitsZugewiesen 
                        ? 'bg-gray-100 opacity-50 cursor-not-allowed' 
                        : 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200'
                    }`}
                  >
                    <div className="text-2xl">{istBereitsZugewiesen ? '✓' : '🐮'}</div>
                    <div className="flex-1">
                      <div className={`font-bold text-base ${istBereitsZugewiesen ? 'text-gray-500' : 'text-gray-800'}`}>
                        {kuh.name}
                      </div>
                      <div className={`text-sm ${istBereitsZugewiesen ? 'text-gray-400' : 'text-gray-600'}`}>
                        Nr. {kuh.tiernummer} {istBereitsZugewiesen && '(Bereits zugewiesen)'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Melkstand Plätze */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {plaetze.map((platz) => (
            <div
              key={platz.platz}
              id={`platz-${platz.platz}`}
              onClick={() => openPlatzSearch(platz.platz)}
              className={`bg-white rounded-2xl p-4 shadow-lg cursor-pointer transition-all duration-300 active:scale-95 ${
                selectedPlatz === platz.platz ? 'ring-4 ring-blue-500 shadow-2xl scale-105 animate-pulse' : ''
              } ${platz.kuh ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border-2 border-gray-200'}`}
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-800 mb-2">
                  {platz.platz}
                </div>
                {platz.kuh ? (
                  <>
                    <div className="text-3xl mb-2">🐮</div>
                    <div className="font-bold text-gray-800 text-base leading-tight mb-1">{platz.kuh.name}</div>
                    <div className="text-xs text-gray-600 mb-2">Nr. {platz.kuh.tiernummer}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setKuhAufPlatz(platz.platz, null);
                      }}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-semibold active:scale-95 transition-all"
                    >
                      Entfernen
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-3xl mb-2 opacity-30">🐮</div>
                    <div className="text-gray-400 text-sm font-semibold">Antippen</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Toast */}
      <SuccessToast
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}