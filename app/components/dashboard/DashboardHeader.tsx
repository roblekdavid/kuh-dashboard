'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dashboard } from '@/app/lib/types';

interface DashboardHeaderProps {
  currentDashboard: Dashboard;
  filteredCount?: number;
  onPrev: () => void;
  onNext: () => void;
  isAutoPlay: boolean;
  onToggleAutoPlay: () => void;
}

export default function DashboardHeader({
  currentDashboard,
  filteredCount,
  onPrev,
  onNext,
  isAutoPlay,
  onToggleAutoPlay
}: DashboardHeaderProps) {
  return (
    <div className={`bg-gradient-to-r ${currentDashboard.color} rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 mb-8 text-white overflow-hidden`}>
      {/* Mobile Layout: Stack vertically */}
      <div className="flex flex-col gap-4">
        {/* Header mit Icon und Titel */}
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="text-4xl sm:text-5xl md:text-6xl flex-shrink-0">{currentDashboard.icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-1 sm:mb-2 break-words">
              {currentDashboard.title}
            </h1>
            <p className="text-base sm:text-xl md:text-2xl opacity-90">
              {currentDashboard.isSpecial 
                ? 'Melkende Kühe pro Monat' 
                : `${filteredCount} ${filteredCount === 1 ? 'Kuh' : 'Kühe'}`
              }
            </p>
          </div>
        </div>
        
        {/* Navigation Controls - Zentriert auf Mobile */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={onPrev}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl transition-all active:scale-95 touch-manipulation flex-shrink-0"
            aria-label="Vorheriges Dashboard"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </button>
          
          <button
            onClick={onToggleAutoPlay}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl transition-all active:scale-95 touch-manipulation font-semibold text-base sm:text-lg md:text-xl min-w-[100px] sm:min-w-[120px]"
            aria-label={isAutoPlay ? 'Automatisches Weiterschalten pausieren' : 'Automatisches Weiterschalten starten'}
          >
            {isAutoPlay ? '⏸ Pause' : '▶ Play'}
          </button>
          
          <button
            onClick={onNext}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl transition-all active:scale-95 touch-manipulation flex-shrink-0"
            aria-label="Nächstes Dashboard"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </button>
        </div>

        {/* Aktuelle Uhrzeit */}
        <div className="text-center sm:text-right text-xs sm:text-sm md:text-base opacity-75">
          {new Date().toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}