'use client';

import { useState } from 'react';
import { TrendingUp, Users, ChevronDown, ChevronRight } from 'lucide-react';

interface WochenBestand {
  woche: string;
  melkend: number;
}

interface MonatsBestand {
  monat: string;
  melkend: number;
  wochen: WochenBestand[];
}

interface BestandsChartProps {
  bestand: MonatsBestand[];
  aktiveKuehe: number;
}

export default function BestandsChart({ bestand, aktiveKuehe }: BestandsChartProps) {
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());

  const maxMelkend = Math.max(
    ...bestand.map(m => m.melkend),
    ...bestand.flatMap(m => m.wochen.map(w => w.melkend))
  );
  
  const durchschnitt = Math.round(
    bestand.reduce((sum, m) => sum + m.melkend, 0) / bestand.length
  );

  const toggleMonth = (index: number) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedMonths(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Statistik-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-500" />
            <span className="text-gray-600 font-medium">Aktuell im Bestand</span>
          </div>
          <div className="text-4xl font-bold text-gray-800">{aktiveKuehe}</div>
          <div className="text-sm text-gray-500 mt-1">Aktive Tiere</div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <span className="text-gray-600 font-medium">Ø Melkende</span>
          </div>
          <div className="text-4xl font-bold text-gray-800">{durchschnitt}</div>
          <div className="text-sm text-gray-500 mt-1">Nächste 4 Monate</div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📈</span>
            <span className="text-gray-600 font-medium">Maximum</span>
          </div>
          <div className="text-4xl font-bold text-gray-800">{maxMelkend}</div>
          <div className="text-sm text-gray-500 mt-1">Höchste Anzahl</div>
        </div>
      </div>

      {/* Monats-Diagramm (aufklappbar) */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          Melkende Kühe - Nächste 4 Monate (Prognose)
        </h3>
        <div className="space-y-2">
          {bestand.map((monat, index) => {
            const prozent = (monat.melkend / maxMelkend) * 100;
            const istNiedrig = monat.melkend < durchschnitt - 2;
            const istHoch = monat.melkend > durchschnitt + 2;
            const isExpanded = expandedMonths.has(index);
            
            return (
              <div key={index} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                {/* Monatszeile */}
                <button
                  onClick={() => toggleMonth(index)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                  
                  <div className="w-24 text-left font-bold text-gray-800">
                    {monat.monat}
                  </div>
                  
                  <div className="flex-1 bg-gray-200 rounded-full h-10 relative overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        istNiedrig 
                          ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                          : istHoch
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
                  
                  <div className="w-24 text-left">
                    {istNiedrig && (
                      <span className="text-orange-600 text-sm font-semibold">⚠️ Niedrig</span>
                    )}
                    {istHoch && (
                      <span className="text-green-600 text-sm font-semibold">✓ Optimal</span>
                    )}
                  </div>
                </button>

                {/* Wochen-Details (aufgeklappt) */}
                {isExpanded && (
                  <div className="bg-gray-50 p-4 space-y-2 border-t-2 border-gray-200">
                    <div className="text-sm font-semibold text-gray-600 mb-3 ml-9">
                      Wöchentliche Aufschlüsselung:
                    </div>
                    {monat.wochen.map((woche, wIndex) => {
                      const wocheProzent = (woche.melkend / maxMelkend) * 100;
                      return (
                        <div key={wIndex} className="flex items-center gap-4 ml-9">
                          <div className="w-20 text-right text-sm text-gray-600">
                            {woche.woche}
                          </div>
                          <div className="flex-1 bg-gray-300 rounded-full h-6 relative overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-300 to-blue-400 rounded-full transition-all duration-500"
                              style={{ width: `${wocheProzent}%` }}
                            >
                              <div className="absolute inset-0 flex items-center justify-end pr-2">
                                <span className="text-white text-sm font-semibold drop-shadow">
                                  {woche.melkend}
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
      </div>

      {/* Hinweise */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-bold text-blue-900 text-lg mb-2">Hinweis zur Planung</h4>
            <ul className="space-y-1 text-blue-800">
              <li>• Trockengestellte Kühe sind <strong>nicht</strong> eingerechnet</li>
              <li>• Kalbinnen werden ab Abkalbung als melkend gezählt</li>
              <li>• Orange = Unter Durchschnitt (evtl. mehr Tiere einplanen)</li>
              <li>• Grün = Über Durchschnitt (gute Auslastung)</li>
              <li>• <strong>Klick auf Monat</strong> zeigt wöchentliche Aufschlüsselung</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}