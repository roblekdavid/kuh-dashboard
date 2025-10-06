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
    <div className={`bg-gradient-to-r ${currentDashboard.color} rounded-3xl shadow-2xl p-6 md:p-8 mb-8 text-white`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl md:text-6xl">{currentDashboard.icon}</span>
          <div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">
              {currentDashboard.title}
            </h1>
            <p className="text-xl md:text-2xl opacity-90">
              {currentDashboard.isSpecial === 'bestand' 
                ? 'Melkende Kühe pro Monat' 
                : `${filteredCount} ${filteredCount === 1 ? 'Kuh' : 'Kühe'}`
              }
            </p>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onPrev}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 md:p-4 rounded-2xl transition-all active:scale-95 touch-manipulation"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          
          <button
            onClick={onToggleAutoPlay}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 rounded-2xl transition-all active:scale-95 touch-manipulation font-semibold text-base md:text-lg"
          >
            {isAutoPlay ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={onNext}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 md:p-4 rounded-2xl transition-all active:scale-95 touch-manipulation"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>
      </div>

      {/* Aktuelle Uhrzeit */}
      <div className="text-right text-sm md:text-base opacity-75">
        {new Date().toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
}