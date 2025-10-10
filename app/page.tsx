'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { List, Maximize } from 'lucide-react';
import { Kuh, Dashboard } from '@/app/lib/types';
import { 
  parseDate, 
  isWithinRange, 
  getTrockenstellDatum, 
  getKalbeDatum,
  getNaechsteBrunst,
  getBrunstAnzeigeDatum,
  ZWEITE_BESAMUNG_ANZEIGE,
  KONTROLLE_NACH_TAGEN,
  getAlterInMonaten
} from '@/app/lib/dateUtils';
import KuhCard from '@/app/components/dashboard/KuhCard';
import BelegungsplanChart from '@/app/components/dashboard/BelegungsplanChart';
import DashboardHeader from '@/app/components/dashboard/DashboardHeader';
import SuccessToast from '@/app/components/dialogs/SuccessToast';

export default function KuhDashboard() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [kuehe, setKuehe] = useState<Kuh[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const loadKuehe = async () => {
    try {
      const res = await fetch('/api/kuehe?aktiv=true');
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
      icon: '🐄',
      color: 'from-blue-500 to-blue-600',
      filter: (k: Kuh) => {
        //Keine trächtigen Kühe
        if (k.kontroll_status === 'positiv') return false;
        // Kalbinnen älter als 14 Monate ohne bekannte Brunst
        if (!k.abgekalbt_am && k.geburtsdatum && !k.letzte_brunst) {
          const alterMonate = getAlterInMonaten(parseDate(k.geburtsdatum)!);
          if (alterMonate >= 14) {
            return true;
          }
        }  
        // Kühe ohne bekannte letzte Brunst
        if (k.abgekalbt_am && !k.letzte_brunst) {
          return true;
        }
        
        return false;
      },
      showInfo: ['brunst']
    },
    
    // 2. BRUNST NÄCHSTEN 2 TAGE
    {
      title: 'Brunst nächsten 2 Tage',
      icon: '📅',
      color: 'from-cyan-500 to-cyan-600',
      filter: (k: Kuh) => {
        // Keine trächtigen Kühe
        if (k.kontroll_status === 'positiv') return false;
        
        // Hat letzte Brunst
        if (k.letzte_brunst) {
          const letzteBrunst = parseDate(k.letzte_brunst)!;
          const naechsteBrunst = getNaechsteBrunst(letzteBrunst);
          const heute = new Date();
          heute.setHours(0, 0, 0, 0);
          
          // Zeige 2 Tage vor bis 2 Tage nach erwartetem Zyklus
          const diffTage = Math.floor((naechsteBrunst.getTime() - heute.getTime()) / (1000 * 60 * 60 * 24));
          return diffTage >= -2 && diffTage <= 2;
        }
        
        // Hat Abkalbe-Datum, berechne Zyklus von dort
        if (k.abgekalbt_am && !k.letzte_brunst) {
          const abgekalbDatum = parseDate(k.abgekalbt_am)!;
          const naechsteBrunst = getNaechsteBrunst(abgekalbDatum);
          const heute = new Date();
          heute.setHours(0, 0, 0, 0);
          
          const diffTage = Math.floor((naechsteBrunst.getTime() - heute.getTime()) / (1000 * 60 * 60 * 24));
          return diffTage >= -2 && diffTage <= 2;
        }
        
        return false;
      },
      showInfo: ['brunst']
    },
    
    // 3. KONTROLLE
    {
      title: 'Kontrolle',
      icon: '🔍',
      color: 'from-orange-500 to-orange-600',
      filter: (k: Kuh) => {
        // Alle Kühe die 45+ Tage nach Besamung kontrolliert werden müssen
        if (k.besamung_datum) {
          const besamungDatum = parseDate(k.besamung_datum)!;
          const tage = Math.abs(Math.floor((new Date().getTime() - besamungDatum.getTime()) / (1000 * 60 * 60 * 24)));
          return tage >= KONTROLLE_NACH_TAGEN;
        }
        
        // Kühe mit Status "Trächtigkeit unsicher" bleiben zur Kontrolle
        if (k.kontroll_status === 'unsicher') {
          return true;
        }
        
        return false;
      },
      showInfo: ['kontrolle']
    },
    
    // 4. TROCKENSTELLEN
    {
      title: 'Trockenstellen',
      icon: '🍼',
      color: 'from-purple-500 to-purple-600',
      filter: (k: Kuh) => {
        // Alle Kühe die ein Trockenstell-Datum haben und noch nicht trockengestellt sind
        if (k.kontroll_status === 'positiv' && k.abgekalbt_am) {
          return true;
        }
        return false;
      },
      showInfo: ['trockenstellen']
    },
    
    // 5. ABKALBEN
    {
      title: 'Abkalben',
      icon: '🐮',
      color: 'from-green-500 to-green-600',
      filter: (k: Kuh) => {
        // Kalbinnen mit erstem Kalben-Datum (noch nicht abgekalbt)
        /*if (k.ist_kalbin && k.erstes_kalben) {
          return true;
        }*/
        // Kühe mit Besamungsdatum (noch nicht abgekalbt)
        if (k.kontroll_status === 'positiv') {
          return true;
        }
        return false;
      },
      showInfo: ['kalben']
    },
    
    // 6. KLAUENPFLEGE BENÖTIGT
    {
      title: 'Klauenpflege benötigt',
      icon: '🦶',
      color: 'from-red-500 to-red-600',
      filter: (k: Kuh) => k.klauenpflege,
      showInfo: []
    },
    
    // 7. BELEGUNGSPLAN (6 Monate)
    {
      title: 'Belegungsplan',
      icon: '📆',
      color: 'from-violet-500 to-violet-600',
      isSpecial: true
    }
  ];

  const currentDashboard = dashboards[currentSlide];
  const filteredKuehe = currentDashboard.filter 
    ? kuehe.filter(currentDashboard.filter)
    : kuehe;

  // Sortierung für Trockenstellen und Abkalben Dashboards
  if (currentDashboard.title === 'Trockenstellen' && filteredKuehe.length > 0) {
    filteredKuehe.sort((a, b) => {
      const datumA = a.besamung_datum ? getTrockenstellDatum(parseDate(a.besamung_datum)!) : new Date(9999, 0, 1);
      const datumB = b.besamung_datum ? getTrockenstellDatum(parseDate(b.besamung_datum)!) : new Date(9999, 0, 1);
      return datumA.getTime() - datumB.getTime(); // Aufsteigend (nächstes zuerst)
    });
  }

  if (currentDashboard.title === 'Abkalben' && filteredKuehe.length > 0) {
    filteredKuehe.sort((a, b) => {
      const datumA = a.besamung_datum ? getKalbeDatum(parseDate(a.besamung_datum))! : new Date(9999, 0, 1);
      const datumB = b.besamung_datum ? getKalbeDatum(parseDate(b.besamung_datum))! : new Date(9999, 0, 1);
      return datumA.getTime() - datumB.getTime(); // Aufsteigend (nächstes zuerst)
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
      <div className="max-w-[1920px] mx-auto">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/alle-kuehe">
            <button className="bg-white hover:bg-gray-100 p-3 md:p-4 rounded-2xl shadow-lg transition-all active:scale-95 touch-manipulation flex items-center gap-2">
              <List className="w-5 h-5 md:w-6 md:h-6" />
              <span className="hidden md:inline font-semibold">Alle Kühe</span>
            </button>
          </Link>
          
          <button
            onClick={toggleFullscreen}
            className="bg-white hover:bg-gray-100 p-3 md:p-4 rounded-2xl shadow-lg transition-all active:scale-95 touch-manipulation"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
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