'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Kuh, Grenzwerte } from '@/app/lib/types';
import { berechneBelegung } from '@/app/lib/dateUtils';

interface BelegungsplanChartProps {
  kuehe: Kuh[];
}

export default function BelegungsplanChart({ kuehe }: BelegungsplanChartProps) {
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set([0]));
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [grenzwerte, setGrenzwerte] = useState<Grenzwerte>({ ideal: 60, min: 50, max: 70 });

  // Lade Grenzwerte aus localStorage (werden auf "Alle Kühe" Seite gesetzt)
  useEffect(() => {
    const saved = localStorage.getItem('grenzwerte');
    if (saved) {
      setGrenzwerte(JSON.parse(saved));
    }
  }, []);

  const monate = berechneBelegung(kuehe, 6); // 6 Monate
  const maxMelkend = Math.max(...monate.map(m => m.melkend), grenzwerte.max);

  const toggleMonth = (index: number) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMonths(newExpanded);
  };

  const toggleWeek = (key: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedWeeks(newExpanded);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Geplante Belegung für die nächsten 6 Monate
        </h2>
        <p className="text-gray-600">
          Durchschnittlich melkende Kühe pro Zeitraum
        </p>
        <div className="mt-4 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-400 rounded"></div>
            <span>Unter {grenzwerte.min} (Niedrig)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-400 rounded"></div>
            <span>{grenzwerte.min}-{grenzwerte.ideal} (Optimal)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span>Über {grenzwerte.ideal}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {monate.map((monat, mIndex) => {
          const isExpanded = expandedMonths.has(mIndex);
          const prozent = (monat.melkend / maxMelkend) * 100;
          const istNiedrig = monat.melkend < grenzwerte.min;
          const istOptimal = monat.melkend >= grenzwerte.min && monat.melkend <= grenzwerte.ideal;

          return (
            <div key={mIndex} className="border-2 border-gray-200 rounded-2xl overflow-hidden">
              {/* Monat */}
              <button
                onClick={() => toggleMonth(mIndex)}
                className="w-full p-6 hover:bg-gray-50 transition-colors flex items-center gap-4"
              >
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-6 h-6 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                
                <div className="w-32 text-left font-semibold text-gray-800">
                  {monat.monat}
                </div>
                
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      istNiedrig
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                        : istOptimal
                        ? 'bg-gradient-to-r from-green-400 to-green-500'
                        : 'bg-gradient-to-r from-blue-400 to-blue-500'
                    }`}
                    style={{ width: `${prozent}%` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-end pr-3">
                      <span className="text-white font-bold drop-shadow-lg">
                        {monat.melkend}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="w-28 text-left">
                  {istNiedrig && (
                    <span className="text-orange-600 text-sm font-semibold">⚠️ Niedrig</span>
                  )}
                  {istOptimal && (
                    <span className="text-green-600 text-sm font-semibold">✓ Optimal</span>
                  )}
                  {!istNiedrig && !istOptimal && (
                    <span className="text-blue-600 text-sm font-semibold">• Hoch</span>
                  )}
                </div>
              </button>

              {/* Wochen (aufgeklappt) */}
              {isExpanded && (
                <div className="bg-gray-50 p-4 space-y-3 border-t-2 border-gray-200">
                  {monat.wochen.map((woche: any, wIndex: number) => {
                    const weekKey = `${mIndex}-${wIndex}`;
                    const isWeekExpanded = expandedWeeks.has(weekKey);
                    const wocheProzent = (woche.melkend / maxMelkend) * 100;

                    return (
                      <div key={wIndex}>
                        <button
                          onClick={() => toggleWeek(weekKey)}
                          className="w-full flex items-center gap-4 ml-9 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {isWeekExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          
                          <div className="w-20 text-right text-sm text-gray-600 font-medium">
                            {woche.woche}
                          </div>
                          
                          <div className="flex-1 bg-gray-300 rounded-full h-6 relative overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-300 to-blue-400 rounded-full transition-all duration-500"
                              style={{ width: `${wocheProzent}%` }}
                            >
                              <div className="absolute inset-0 flex items-center justify-end pr-2">
                                <span className="text-white font-semibold text-sm drop-shadow">
                                  {woche.melkend}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Tage (aufgeklappt) */}
                        {isWeekExpanded && (
                          <div className="ml-20 mt-2 space-y-1">
                            {woche.tage.map((tag: any, tIndex: number) => {
                              const tagProzent = (tag.melkend / maxMelkend) * 100;
                              
                              return (
                                <div key={tIndex} className="flex items-center gap-4 p-1">
                                  <div className="w-16 text-right text-xs text-gray-500">
                                    {tag.tag}
                                  </div>
                                  
                                  <div className="flex-1 bg-gray-300 rounded-full h-4 relative overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-cyan-300 to-cyan-400 rounded-full"
                                      style={{ width: `${tagProzent}%` }}
                                    >
                                      <div className="absolute inset-0 flex items-center justify-end pr-2">
                                        <span className="text-white font-semibold text-xs drop-shadow">
                                          {tag.melkend}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}