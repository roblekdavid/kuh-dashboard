'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { List, Maximize } from 'lucide-react';
import { Kuh, Dashboard } from '@/app/lib/types';
import { 
  parseDate,
  getTrockenstellDatum, 
  getKalbeDatum,
  getNextBrunstForKuh,
  getDaysSince,
  getNaechsteBrunst,
  KONTROLLE_NACH_TAGEN,
  getAlterInMonaten
} from '@/app/lib/dateUtils';
import KuhCard from '@/app/components/dashboard/KuhCard';
import BelegungsplanChart from '@/app/components/dashboard/BelegungsplanChart';
import DashboardHeader from '@/app/components/dashboard/DashboardHeader';
import SuccessToast from '@/app/components/dialogs/SuccessToast';

export default function KuhDashboard() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [kuehe, setKuehe] = useState<Kuh[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isStale, setIsStale] = useState(false);

  const loadKuehe = async () => {
    try {
      const res = await fetch('/api/kuehe');
      const data = await res.json();
      setKuehe(data);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKuehe();
  }, []);

  useEffect(() => {
    if (isAutoPlay) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % dashboards.length);
      }, 10000); // 10 Sekunden pro Slide
      return () => clearInterval(interval);
    }
  }, [isAutoPlay]);
  useEffect(() => {
  const timer = setTimeout(() => {
    setIsAutoPlay(true);
  }, 30 * 60 * 1000); // 30 Minuten

  return () => clearTimeout(timer);
}, []);
// Pause bei Klick/Touch in die App
useEffect(() => {
  const handleInteraction = () => {
    if (isAutoPlay) {
      setIsAutoPlay(false);
    }
  };

  document.addEventListener('click', handleInteraction);
  document.addEventListener('touchstart', handleInteraction);

  return () => {
    document.removeEventListener('click', handleInteraction);
    document.removeEventListener('touchstart', handleInteraction);
  };
}, [isAutoPlay]);

  const handleUpdate = () => {
    loadKuehe();
    setSuccessMessage('✅ Erfolgreich gespeichert!');
    setShowSuccess(true);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  // Swipe-Gesten
useEffect(() => {
  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Nach links wischen = nächstes Dashboard
      setCurrentSlide((prev) => (prev + 1) % dashboards.length);
    }
    if (isRightSwipe) {
      // Nach rechts wischen = vorheriges Dashboard
      setCurrentSlide((prev) => (prev - 1 + dashboards.length) % dashboards.length);
    }
  };

  document.addEventListener('touchstart', onTouchStart);
  document.addEventListener('touchmove', onTouchMove);
  document.addEventListener('touchend', onTouchEnd);

  return () => {
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  };
}, [touchStart, touchEnd, currentSlide]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  // 1. Automatischer Refresh um 03:00 Uhr
useEffect(() => {
  const checkAndRefresh = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    if (hours === 3 && minutes === 0) {
      console.log('🕒 Automatischer Refresh um 03:00 Uhr');
      loadKuehe();
      setLastActivity(Date.now());
      setIsStale(false);
    }
  };
  
  const interval = setInterval(checkAndRefresh, 60000);
  return () => clearInterval(interval);
}, []);

// 2. Markiere als "stale" nach 30 Minuten Inaktivität
useEffect(() => {
  const checkStale = () => {
    const inactiveMinutes = (Date.now() - lastActivity) / (1000 * 60);
    if (inactiveMinutes > 30 && !isStale) {
      console.log('⏱️ App als "stale" markiert nach 30 Min Inaktivität');
      setIsStale(true);
    }
  };
  
  const interval = setInterval(checkStale, 60000);
  return () => clearInterval(interval);
}, [lastActivity, isStale]);

// 3. Reload bei Interaktion wenn stale
useEffect(() => {
  const handleActivity = () => {
    if (isStale) {
      console.log('🔄 Lade neue Daten nach Inaktivität');
      loadKuehe();
      setIsStale(false);
    }
    setLastActivity(Date.now());
  };
  
  window.addEventListener('click', handleActivity);
  window.addEventListener('touchstart', handleActivity);
  window.addEventListener('keydown', handleActivity);
  
  return () => {
    window.removeEventListener('click', handleActivity);
    window.removeEventListener('touchstart', handleActivity);
    window.removeEventListener('keydown', handleActivity);
  };
}, [isStale]);

// 4. Reload bei Tab-Wechsel zurück nach Inaktivität
useEffect(() => {
  let lastVisibilityChange = Date.now();
  
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      const inactiveMinutes = (Date.now() - lastVisibilityChange) / (1000 * 60);
      
      if (inactiveMinutes > 30) {
        console.log('🔄 Lade neue Daten nach Tab-Wechsel');
        loadKuehe();
        setLastActivity(Date.now());
        setIsStale(false);
      }
    }
    lastVisibilityChange = Date.now();
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
  };

  // ==================== DASHBOARD-DEFINITIONEN (7 gemäß Projektziel) ====================
  const dashboards: Dashboard[] = [
    // 1. BRUNST BEOBACHTEN (Stieren)
    {
      title: 'Brunst beobachten',
      icon: '👁️',
      color: 'from-blue-500 to-blue-600',
      filter: (k: Kuh) => {
        // Aussortierte Kühe nicht anzeigen (außer sie sind trächtig)
        if (k.aussortiert) return false;
        //Keine trächtigen Kühe
        if (k.kontroll_status === 'positiv') return false;
        // Kalbinnen älter als 14 Monate ohne bekannte Brunst
        if (!k.abgekalbt_am && k.geburtsdatum && !k.letzte_brunst) {
          const alterMonate = getAlterInMonaten(parseDate(k.geburtsdatum)!);
          return alterMonate >= 14;
        }  
        // Kühe ohne letzte_brunst und abgekalbt > 19 Tage
        if (k.abgekalbt_am && !k.letzte_brunst) {
          const daysSince = getDaysSince(parseDate(k.abgekalbt_am)!);
          return daysSince > 19;
        }
        
        return false;
      },
      showInfo: ['brunst', 'besamung_versuche']
    },
    
    // 2. BRUNST NÄCHSTEN 5 TAGE
    {
      title: 'Brunst nächste 5 Tage',
      icon: '📅',
      color: 'from-cyan-500 to-cyan-600',
      filter: (k: Kuh) => {
        if (k.aussortiert) return false;
        if (k.kontroll_status === 'positiv') return false;
        
        const nextBrunst = getNextBrunstForKuh(k);
        if (!nextBrunst) return false;
        
        const heute = new Date();
        heute.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((nextBrunst.getTime() - heute.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= -2 && diffDays <= 5;
      },
      showInfo: ['brunst', 'brunst_datum', 'besamung_versuche', 'letztes_besamung_datum']
    },
    
    // 3. KONTROLLE
    {
      title: 'Kontrolle',
      icon: '🔍',
      color: 'from-orange-500 to-orange-600',
      filter: (k: Kuh) => {
        if (!k.besamung_datum || k.kontroll_status) return false;
        
        const daysSince = getDaysSince(parseDate(k.besamung_datum)!);
        return daysSince >= KONTROLLE_NACH_TAGEN;
      },
      showInfo: ['kontrolle']
    },
    
    // 4. TROCKENSTELLEN
    {
      title: 'Trockenstellen',
      icon: '🥛',
      color: 'from-purple-500 to-purple-600',
      filter: (k: Kuh) => {
        return k.abgekalbt_am !== null && 
               k.kontroll_status === 'positiv' && 
               !k.trockengestellt_am &&
               k.besamung_datum !== null;
      },
      showInfo: ['trockenstell_datum']
    },
    
    // 5. ABKALBEN
    {
      title: 'Abkalben',
      icon: '🐮',
      color: 'from-green-500 to-green-600',
      filter: (k: Kuh) => {
        return k.besamung_datum !== null && 
               k.kontroll_status === 'positiv';
      },
      showInfo: ['kalbe_datum']
    },
    
    // 6. KLAUENPFLEGE BENÖTIGT
    {
      title: 'Klauenpflege benötigt',
      icon: '🦶',
      color: 'from-yellow-600 to-yellow-700',
      filter: (k: Kuh) => k.klauenpflege === true,
      showInfo: []
    },
    // 7. AUSSORTIERT
    {
      title: 'Aussortiert',
      icon: '⚠️',
      color: 'from-red-500 to-red-600',
      filter: (k: Kuh) => k.aussortiert === true,
      showInfo: []
    },
    
    // 8. BELEGUNGSPLAN (6 Monate)
    {
      title: 'Belegungsplan',
      icon: '📆',
      color: 'from-violet-500 to-violet-600',
      isSpecial: true
    }
  ];

  const currentDashboard = dashboards[currentSlide];
  let filteredKuehe = currentDashboard.filter 
    ? kuehe.filter(currentDashboard.filter)
    : kuehe;

  // Sortierung für Trockenstellen und Abkalben Dashboards
  if (currentDashboard.title === 'Brunst nächste 5 Tage') {
    filteredKuehe = filteredKuehe.sort((a, b) => {
      const aBrunst = getNextBrunstForKuh(a);
      const bBrunst = getNextBrunstForKuh(b);
      
      if (!aBrunst && !bBrunst) return 0;
      if (!aBrunst) return 1;
      if (!bBrunst) return -1;
      
      return aBrunst.getTime() - bBrunst.getTime();
    });
  } else if (currentDashboard.title === 'Kontrolle') {
    filteredKuehe = filteredKuehe.sort((a, b) => {
      if (!a.besamung_datum && !b.besamung_datum) return 0;
      if (!a.besamung_datum) return 1;
      if (!b.besamung_datum) return -1;
      
      return parseDate(a.besamung_datum)!.getTime() - parseDate(b.besamung_datum)!.getTime();
    });
  } else if (currentDashboard.title === 'Trockenstellen') {
    filteredKuehe = filteredKuehe.sort((a, b) => {
      const aTrocken = a.besamung_datum ? getTrockenstellDatum(parseDate(a.besamung_datum)!) : null;
      const bTrocken = b.besamung_datum ? getTrockenstellDatum(parseDate(b.besamung_datum)!) : null;
      
      if (!aTrocken && !bTrocken) return 0;
      if (!aTrocken) return 1;
      if (!bTrocken) return -1;
      
      return aTrocken.getTime() - bTrocken.getTime();
    });
  } else if (currentDashboard.title === 'Abkalben') {
    filteredKuehe = filteredKuehe.sort((a, b) => {
      const aKalben = a.besamung_datum ? getKalbeDatum(parseDate(a.besamung_datum)!) : null;
      const bKalben = b.besamung_datum ? getKalbeDatum(parseDate(b.besamung_datum)!) : null;
      
      if (!aKalben && !bKalben) return 0;
      if (!aKalben) return 1;
      if (!bKalben) return -1;
      
      return aKalben.getTime() - bKalben.getTime();
    });
  } else if (currentDashboard.title === 'Brunst beobachten') {
    filteredKuehe = filteredKuehe.sort((a, b) => {
      // Kalbinnen nach Alter
      if (!a.abgekalbt_am && !b.abgekalbt_am) {
        if (!a.geburtsdatum || !b.geburtsdatum) return 0;
        return parseDate(a.geburtsdatum)!.getTime() - parseDate(b.geburtsdatum)!.getTime();
      }
      
      // Kühe nach Tagen seit Abkalben
      if (a.abgekalbt_am && b.abgekalbt_am) {
        return parseDate(a.abgekalbt_am)!.getTime() - parseDate(b.abgekalbt_am)!.getTime();
      }
      
      return a.abgekalbt_am ? -1 : 1;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-3xl font-bold text-gray-600">Lade Daten...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 md:p-8">
    <div className="max-w-[1920px] mx-auto relative">
      {/* Top Navigation */}
      {/* Top Navigation - Schwebende Buttons */}
      <div className="absolute top-4 right-4 z-10 flex gap-3">
        <Link href="/alle-kuehe">
          <button className="bg-white/95 hover:bg-white backdrop-blur-sm p-3 md:p-4 rounded-2xl shadow-xl border-2 border-gray-300 transition-all active:scale-95 touch-manipulation flex items-center gap-2 font-bold">
            <List className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
            <span className="hidden md:inline text-gray-800">Alle Kühe</span>
          </button>
        </Link>

        <button
          onClick={toggleFullscreen}
          className="hidden md:block bg-white/95 hover:bg-white backdrop-blur-sm p-3 md:p-4 rounded-2xl shadow-xl border-2 border-gray-300 transition-all active:scale-95 touch-manipulation font-bold text-gray-700"
          title={isFullscreen ? "Fullscreen beenden (ESC)" : "Fullscreen aktivieren"}
        >
          <Maximize className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

        {/* Dashboard Header */}
        <DashboardHeader
          currentDashboard={currentDashboard}
          filteredCount={filteredKuehe.length}
          onPrev={() => setCurrentSlide((prev) => (prev - 1 + dashboards.length) % dashboards.length)}
          onNext={() => setCurrentSlide((prev) => (prev + 1) % dashboards.length)}
          isAutoPlay={isAutoPlay}
          onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)}
        />

        {/* Dashboard-Inhalt */}
        {currentDashboard.isSpecial ? (
          <BelegungsplanChart kuehe={kuehe} />
        ) : (
          <>
            {filteredKuehe.length > 0 ? (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 ${isFullscreen ? 'mb-4' : 'mb-8'}`}>
                {filteredKuehe.map((kuh) => (
                  <KuhCard
                    key={kuh.id}
                    kuh={kuh}
                    showInfo={currentDashboard.showInfo || []}
                    onUpdate={handleUpdate}
                    showKlauenpflege={currentDashboard.title === 'Klauenpflege benötigt'}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 text-center shadow-xl">
                <div className="text-6xl mb-4">✨</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Alles erledigt!</h2>
                <p className="text-xl text-gray-600">Keine Kühe in dieser Kategorie</p>
              </div>
            )}
          </>
        )}

        {/* Slide-Indikatoren */}
        <div className="flex justify-center gap-3 mt-8 flex-wrap">
          {dashboards.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 rounded-full transition-all touch-manipulation ${
                index === currentSlide
                  ? `w-12 bg-gradient-to-r ${currentDashboard.color}`
                  : 'w-3 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Gehe zu Dashboard ${index + 1}`}
            />
          ))}
        </div>

        {/* Success Toast */}
        <SuccessToast
          message={successMessage}
          isVisible={showSuccess}
          onClose={() => setShowSuccess(false)}
        />
      </div>
    </div>
  );
}