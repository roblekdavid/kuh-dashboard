'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { List } from 'lucide-react';
import { Kuh, Dashboard } from '@/app/lib/types';
import { 
  parseDate, 
  isWithinRange, 
  getTrockenstellDatum, 
  getKalbeDatum,
  getNaechsteBrunst,
  getBrunstAnzeigeDatum,
  berechneBestand,
  BRUNST_ZYKLUS_TAGE,
  ZWEITE_BESAMUNG_ANZEIGE
} from '@/app/lib/dateUtils';
import KuhCard from '@/app/components/dashboard/KuhCard';
import BestandsChart from '@/app/components/dashboard/BestandsChart';
import DashboardHeader from '@/app/components/dashboard/DashboardHeader';
import SuccessToast from '@/app/components/dialogs/SuccessToast';

export default function KuhDashboard() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [kuehe, setKuehe] = useState<Kuh[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleUpdate = () => {
    loadKuehe();
    setSuccessMessage('✅ Erfolgreich gespeichert!');
    setShowSuccess(true);
  };

  const bestand = berechneBestand(kuehe);

  // ==================== DASHBOARD-DEFINITIONEN ====================
  const dashboards: Dashboard[] = [
    {
      title: 'Bestandsplanung',
      icon: '📊',
      color: 'from-emerald-500 to-emerald-600',
      isSpecial: 'bestand'
    },
    {
      title: 'Stieren',
      icon: '🐄',
      color: 'from-blue-500 to-blue-600',
      filter: (k: Kuh) => {
        // Gerade abgekalbt
        if (k.status === 'abgekalbt') return true;
        
        // Nicht trächtig und nicht besamt
        if (k.status === 'brunst_beobachten' && !k.besamung_datum) return true;
        
        // Hat letzte Brunst, 2 Tage vor nächster Brunst
        if (k.letzte_brunst && k.status === 'brunst_beobachten') {
          const letzteBrunst = parseDate(k.letzte_brunst)!;
          const naechsteBrunst = getNaechsteBrunst(letzteBrunst);
          const anzeigeDatum = getBrunstAnzeigeDatum(naechsteBrunst);
          const heute = new Date();
          heute.setHours(0, 0, 0, 0);
          return heute >= anzeigeDatum;
        }
        
        // Bereits besamt, nach 19 Tagen wieder anzeigen
        if (k.besamung_datum && k.status === 'besamt') {
          const besamungDatum = parseDate(k.besamung_datum)!;
          const tage = Math.abs(Math.floor((new Date().getTime() - besamungDatum.getTime()) / (1000 * 60 * 60 * 24)));
          return tage >= ZWEITE_BESAMUNG_ANZEIGE && tage < 45;
        }
        
        return false;
      },
      showInfo: ['brunst']
    },
    {
      title: 'Kontrollieren',
      icon: '🔍',
      color: 'from-orange-500 to-orange-600',
      filter: (k: Kuh) => {
        // Kühe die 45 Tage nach Besamung kontrolliert werden müssen
        if (k.status === 'besamt' && k.kontrolle) {
          return true; // Alle besamten Kühe bleiben bis Status gesetzt
        }
        return false;
      },
      showInfo: ['kontrolle']
    },
    {
      title: 'Trockenstellen (14 Tage)',
      icon: '🍼',
      color: 'from-purple-500 to-purple-600',
      filter: (k: Kuh) => {
        if (k.ist_kalbin || !k.besamung_datum || k.trockengestellt) return false;
        const datum = getTrockenstellDatum(parseDate(k.besamung_datum)!);
        return isWithinRange(datum, 0, 14);
      },
      showInfo: ['trockenstellen']
    },
    {
      title: 'Abkalben (30 Tage)',
      icon: '🐮',
      color: 'from-green-500 to-green-600',
      filter: (k: Kuh) => {
        if (k.ist_kalbin && k.erstes_kalben) {
          return isWithinRange(parseDate(k.erstes_kalben)!, 0, 30);
        }
        if (!k.ist_kalbin && k.besamung_datum && !k.abgekalbt) {
          const kalbeDatum = getKalbeDatum(parseDate(k.besamung_datum));
          return kalbeDatum ? isWithinRange(kalbeDatum, 0, 30) : false;
        }
        return false;
      },
      showInfo: ['kalben']
    },
    {
      title: 'Aktuell trockengestellt',
      icon: '💤',
      color: 'from-indigo-500 to-indigo-600',
      filter: (k: Kuh) => k.trockengestellt && !k.abgekalbt,
      showInfo: ['trockenstellen', 'kalben']
    },
    {
      title: 'Abgekalbt (letzte 2 Monate)',
      icon: '✅',
      color: 'from-emerald-500 to-emerald-600',
      filter: (k: Kuh) => {
        if (!k.abgekalbt || !k.abgekalbt_am) return false;
        return isWithinRange(parseDate(k.abgekalbt_am)!, -60, 0);
      },
      showInfo: ['abgekalbt']
    },
    {
      title: 'Klauenpflege benötigt',
      icon: '🦶',
      color: 'from-red-500 to-red-600',
      filter: (k: Kuh) => k.klauenpflege,
      showInfo: []
    }
  ];

  const currentDashboard = dashboards[currentSlide];
  const filteredKuehe = currentDashboard.filter 
    ? kuehe.filter(currentDashboard.filter) 
    : [];

  // Auto-Slide
  useEffect(() => {
    if (!isAutoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % dashboards.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [isAutoPlay, dashboards.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % dashboards.length);
    setIsAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + dashboards.length) % dashboards.length);
    setIsAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🐄</div>
          <div className="text-2xl font-bold text-gray-700">Lädt Daten...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 md:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header mit Link zu "Alle Kühe" */}
        <div className="flex justify-end mb-4">
          <Link href="/alle-kuehe">
            <button className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all active:scale-95 touch-manipulation">
              <List className="w-5 h-5" />
              Alle Kühe verwalten
            </button>
          </Link>
        </div>

        {/* Dashboard Header */}
        <DashboardHeader
          currentDashboard={currentDashboard}
          filteredCount={filteredKuehe.length}
          onPrev={prevSlide}
          onNext={nextSlide}
          isAutoPlay={isAutoPlay}
          onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)}
        />

        {/* Content */}
        {currentDashboard.isSpecial === 'bestand' ? (
          <BestandsChart bestand={bestand} aktiveKuehe={kuehe.length} />
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
        <div className="flex justify-center gap-3 mt-8">
          {dashboards.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 rounded-full transition-all touch-manipulation ${
                index === currentSlide
                  ? `w-12 bg-gradient-to-r ${currentDashboard.color}`
                  : 'w-3 bg-gray-300 hover:bg-gray-400'
              }`}
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