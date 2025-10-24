'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Filter, ArrowLeft, Settings, Save, Trash2, Milk } from 'lucide-react';
import Link from 'next/link';
import { Kuh, Grenzwerte } from '@/app/lib/types';
import { formatDate, parseDate, getDaysSince, getAlterInMonaten } from '@/app/lib/dateUtils';
import NeueKuhDialog from '@/app/components/dialogs/NeueKuhDialog';
import AbgangDialog from '@/app/components/dialogs/AbgangDialog';
import DatePickerDialog from '@/app/components/dialogs/DatePickerDialog';
import ConfirmDialog from '@/app/components/dialogs/ConfirmDialog';
import SuccessToast from '@/app/components/dialogs/SuccessToast';
import KuhDetailsDialog from '@/app/components/dialogs/KuhDetailsDialog';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { useVirtualKeyboard } from '../hooks/useVirtualKeyboard';

export default function AlleKuehePage() {
  const [kuehe, setKuehe] = useState<Kuh[]>([]);
  const [filteredKuehe, setFilteredKuehe] = useState<Kuh[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('alle');
  const [showNeueKuh, setShowNeueKuh] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAbgang, setShowAbgang] = useState(false);
  const [selectedKuh, setSelectedKuh] = useState<Kuh | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerConfig, setDatePickerConfig] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showGrenzwerte, setShowGrenzwerte] = useState(false);
  const [grenzwerte, setGrenzwerte] = useState<Grenzwerte>({ ideal: 60, min: 50, max: 70 });
  const [showFehlgeburt, setShowFehlgeburt] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isStale, setIsStale] = useState(false);
  const [selectedKuhForDetails, setSelectedKuhForDetails] = useState<Kuh | null>(null);
  const { showKeyboard, keyboardType, handleKeyPress, closeKeyboard } = useVirtualKeyboard();
  
  useEffect(() => {
    loadKuehe();
    loadGrenzwerte();
  }, []);

  useEffect(() => {
    filterAndSortKuehe();
  }, [kuehe, searchTerm, statusFilter]);
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

  const loadKuehe = async () => {
    try {
      const res = await fetch('/api/kuehe');
      const data = await res.json();
      setKuehe(data);
    } catch (error) {
      console.error('Fehler:', error);
    }
  };

  const loadGrenzwerte = () => {
    const saved = localStorage.getItem('grenzwerte');
    if (saved) {
      setGrenzwerte(JSON.parse(saved));
    }
  };

  const saveGrenzwerte = () => {
    localStorage.setItem('grenzwerte', JSON.stringify(grenzwerte));
    setShowGrenzwerte(false);
    setSuccessMessage('✅ Grenzwerte gespeichert!');
    setShowSuccess(true);
  };

  const filterAndSortKuehe = () => {
    let filtered = kuehe;

    // Suche
    if (searchTerm) {
      filtered = filtered.filter(k => 
        k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        k.tiernummer.includes(searchTerm)
      );
    }

    // Status-Filter
    if (statusFilter !== 'alle') {
      filtered = filtered.filter(k => {
        switch (statusFilter) {
          case 'kalbin': return !k.abgekalbt_am;
          case 'trocken': return k.trockengestellt_am !== null;
          case 'traechtig': return k.kontroll_status === 'positiv';
          case 'nicht_traechtig': {
            // Aussortierte Kühe nicht anzeigen
            if (k.aussortiert) return false;
            
            // Kühe die nicht trächtig sind
            if (k.abgekalbt_am) {
              return k.kontroll_status !== 'positiv';
            }
            // Kalbinnen über 16 Monate die nicht trächtig sind
            if (!k.abgekalbt_am && k.geburtsdatum) {
              const alterMonate = getAlterInMonaten(parseDate(k.geburtsdatum)!);
              return alterMonate > 16 && k.kontroll_status !== 'positiv';
            }
            return false;
          }
          case 'traechtige_kalbin': return !k.abgekalbt_am && k.kontroll_status === 'positiv';
          default: return true;
        }
      });
    }

    // SORTIERUNG
    if (statusFilter === 'nicht_traechtig') {
      // Spezielle Sortierung für "Nicht trächtig"
      filtered.sort((a, b) => {
        const aIstKalbin = !a.abgekalbt_am;
        const bIstKalbin = !b.abgekalbt_am;
        
        // Kalbinnen vor Kühen
        if (aIstKalbin && !bIstKalbin) return -1;
        if (!aIstKalbin && bIstKalbin) return 1;
        
        // Beide sind Kalbinnen: Älteste zuerst
        if (aIstKalbin && bIstKalbin) {
          if (!a.geburtsdatum || !b.geburtsdatum) return 0;
          return parseDate(a.geburtsdatum)!.getTime() - parseDate(b.geburtsdatum)!.getTime();
        }
        
        // Beide sind Kühe: Längste Zeit seit Abkalbung zuerst
        if (!aIstKalbin && !bIstKalbin) {
          if (!a.abgekalbt_am || !b.abgekalbt_am) return 0;
          return parseDate(a.abgekalbt_am)!.getTime() - parseDate(b.abgekalbt_am)!.getTime();
        }
        
        return 0;
      });
    } else {
      // Standard-Sortierung für andere Filter
      filtered.sort((a, b) => {
        // Kalbinnen nach Alter sortieren
        if (!a.abgekalbt_am && !b.abgekalbt_am) {
          if (!a.geburtsdatum || !b.geburtsdatum) return 0;
          return parseDate(b.geburtsdatum)!.getTime() - parseDate(a.geburtsdatum)!.getTime();
        }
        
        // Kühe nach Tagen seit Abkalben
        if (a.abgekalbt_am && b.abgekalbt_am) {
          return parseDate(b.abgekalbt_am)!.getTime() - parseDate(a.abgekalbt_am)!.getTime();
        }
        
        // Kühe vor Kalbinnen
        return a.abgekalbt_am ? -1 : 1;
      });
    }

    setFilteredKuehe(filtered);
  };

  const handleStatusChange = async (kuhId: number, updates: any) => {
    try {
      await fetch(`/api/kuehe/${kuhId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      loadKuehe();
      setSuccessMessage('✅ Status erfolgreich aktualisiert!');
      setShowSuccess(true);
    } catch (error) {
      console.error('Fehler:', error);
    }
  };
  const handleDelete = async () => {
    if (!selectedKuh) return;
    
    try {
      await fetch(`/api/kuehe/${selectedKuh.id}`, {
        method: 'DELETE'
      });
      loadKuehe();
      setSelectedKuh(null);
      setShowDelete(false);
      setSuccessMessage('✅ Kuh erfolgreich entfernt!');
      setShowSuccess(true);
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
    }
  };

  const handleFehlgeburt = async () => {
    if (!selectedKuh) return;
    
    // Fehlgeburt verhält sich wie Abkalben: Setzt Datum und löscht andere Status
    await handleStatusChange(selectedKuh.id, {
      abgekalbt_am: new Date().toISOString(),
      besamung_datum: null,
      letzte_brunst: null,
      kontroll_status: null,
      trockengestellt_am: null,
      besamung_versuche: 0
    });
    
    setShowFehlgeburt(false);
    setSelectedKuh(null);
    setSuccessMessage('✅ Fehlgeburt dokumentiert');
    setShowSuccess(true);
  };

  const handleDateAction = (kuh: Kuh, config: any) => {
    setSelectedKuh(kuh);
    setDatePickerConfig(config);
    setShowDatePicker(true);
  };

  const statusOptions = [
    { value: 'alle', label: 'Alle Kühe', color: 'bg-gray-500' },
    { value: 'kalbin', label: 'Kalbinnen', color: 'bg-pink-500' },
    { value: 'traechtige_kalbin', label: 'Trächtige Kalbinnen', color: 'bg-purple-500' },
    { value: 'nicht_traechtig', label: 'Nicht trächtig', color: 'bg-purple-500'},
    { value: 'traechtig', label: 'Trächtig', color: 'bg-green-500' },
    { value: 'trocken', label: 'Trockengestellt', color: 'bg-indigo-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-2 sm:p-4 md:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-3xl shadow-2xl p-6 md:p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <button className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-all">
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold">Alle Kühe</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowGrenzwerte(!showGrenzwerte)}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-all"
                title="Grenzwerte einstellen"
              >
                <Settings className="w-6 h-6" />
              </button>
              <Link href="/milchmessung">
                <button className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all text-white">
                  <Milk className="w-5 h-5" />
                  <span className="hidden md:inline">Milchmessung</span>
                </button>
              </Link>
              <button
                onClick={() => setShowNeueKuh(true)}
                className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">Neue Kuh</span>
              </button>
            </div>
          </div>

          {/* Grenzwerte */}
          {showGrenzwerte && (
            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <h3 className="font-semibold mb-3">Bestandsgrenzwerte</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm opacity-80">Minimum</label>
                  <input
                    type="number"
                    value={grenzwerte.min}
                    onChange={(e) => setGrenzwerte({...grenzwerte, min: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-sm opacity-80">Ideal</label>
                  <input
                    type="number"
                    value={grenzwerte.ideal}
                    onChange={(e) => setGrenzwerte({...grenzwerte, ideal: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-sm opacity-80">Maximum</label>
                  <input
                    type="number"
                    value={grenzwerte.max}
                    onChange={(e) => setGrenzwerte({...grenzwerte, max: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-white/20 rounded-lg text-white"
                  />
                </div>
              </div>
              <button
                onClick={saveGrenzwerte}
                className="mt-3 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Speichern
              </button>
            </div>
          )}

          {/* Suche & Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="Suche nach Name oder Nummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/80 backdrop-blur-sm rounded-xl text-white placeholder-white/80 focus:bg-gray-800/90 transition-all font-semibold text-lg border-2 border-white/20"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-4 py-3 rounded-xl font-bold transition-all text-lg ${
                    statusFilter === option.value 
                      ? `${option.color} !text-white shadow-lg` 
                      : 'bg-white !text-black hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-4 text-lg">
            Gesamt: <span className="font-bold">{kuehe.length}</span> | 
            Angezeigt: <span className="font-bold">{filteredKuehe.length}</span>
          </div>
        </div>

        {/* Kühe-Liste */}
        <div className="grid gap-4 px-2 sm:px-4">
          {filteredKuehe.map((kuh) => {
            const istKalbin = !kuh.abgekalbt_am;
            const alterMonate = kuh.geburtsdatum ? getAlterInMonaten(parseDate(kuh.geburtsdatum)!) : 0;
            const tageSeitAbkalben = kuh.abgekalbt_am ? getDaysSince(parseDate(kuh.abgekalbt_am)!) : 0;

            return (
              <div key={kuh.id} onClick={() => setSelectedKuhForDetails(kuh)} className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`text-4xl ${istKalbin ? 'bg-pink-100' : 'bg-blue-100'} w-14 h-14 rounded-xl flex items-center justify-center`}>
                      {istKalbin ? '🐄' : '🐮'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-800">{kuh.name}</h3>
                        {istKalbin && (
                          <span className="bg-pink-500 text-white px-2 py-0.5 rounded text-xs font-semibold">
                            Kalbin
                          </span>
                        )}
                        {kuh.kontroll_status === 'positiv' && (
                          <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs font-semibold">
                            Trächtig
                          </span>
                        )}
                        {kuh.aussortiert && (
                          <span className="bg-gray-700 text-white px-2 py-0.5 rounded text-xs font-semibold">
                            Aussortiert
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">Nr. {kuh.tiernummer}</p>
                      {istKalbin && kuh.geburtsdatum && (
                        <p className="text-sm text-gray-500">Alter: {alterMonate} Monate</p>
                      )}
                      {!istKalbin && kuh.abgekalbt_am && (
                        <p className="text-sm text-gray-500">Abgekalbt vor: {tageSeitAbkalben} Tagen</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap justify-end">
                    {/* Status-Aktionen basierend auf aktuellem Zustand */}
                    {!kuh.letzte_brunst && !kuh.kontroll_status && (
                      <button
                        onClick={() => handleDateAction(kuh, {
                          title: 'Brunst beobachtet',
                          message: 'Wann wurde die Brunst beobachtet?',
                          action: async (date: Date) => {
                            await handleStatusChange(kuh.id, { letzte_brunst: date.toISOString() });
                          }
                        })}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95"
                      >
                        Brunst beobachtet
                      </button>
                    )}
                    
                    {!kuh.besamung_datum && !kuh.kontroll_status && (
                      <button
                        onClick={() => handleDateAction(kuh, {
                          title: 'Besamung',
                          message: 'Wann wurde die Kuh besamt?',
                          action: async (date: Date) => {
                            await handleStatusChange(kuh.id, { 
                              besamung_datum: date.toISOString(),
                              letzte_brunst: date.toISOString(),
                              besamung_versuche: kuh.besamung_versuche + 1
                            });
                          }
                        })}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95"
                      >
                        Besamt
                      </button>
                    )}

                    {/* Klauenpflege Toggle */}
                    <button
                      onClick={() => handleStatusChange(kuh.id, { klauenpflege: !kuh.klauenpflege })}
                      className={`${
                        kuh.klauenpflege 
                          ? 'bg-gray-500 hover:bg-gray-600' 
                          : 'bg-orange-500 hover:bg-orange-600'
                      } text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95`}
                    >
                      {kuh.klauenpflege ? 'Klauenpflege erledigt' : 'Klauenpflege nötig'}
                    </button>


                    {/* Fehlgeburt */}
                    {kuh.besamung_datum && (
                      <button
                        onClick={() => {
                          setSelectedKuh(kuh);
                          setShowFehlgeburt(true);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95"
                      >
                        Fehlgeburt
                      </button>
                    )}
                    {/* Aussortiert Toggle */}
                    <button
                      onClick={() => handleStatusChange(kuh.id, { aussortiert: !kuh.aussortiert })}
                      className={`${
                        kuh.aussortiert 
                          ? 'bg-gray-700 hover:bg-gray-800' 
                          : 'bg-yellow-500 hover:bg-yellow-600'
                      } text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95`}
                    >
                      {kuh.aussortiert ? '✓ Aussortiert' : 'Aussortieren'}
                    </button>

                    {/* Abmelden */}
                    <button
                      onClick={() => {
                        setSelectedKuh(kuh);
                        setShowDelete(true);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Abmelden
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialoge */}
      {selectedKuhForDetails && (
        <KuhDetailsDialog
          kuh={selectedKuhForDetails}
          onClose={() => setSelectedKuhForDetails(null)}
          onUpdate={() => {
            loadKuehe();
            setSelectedKuhForDetails(null);
          }}
        />
      )}
      <NeueKuhDialog
        isOpen={showNeueKuh}
        onClose={() => setShowNeueKuh(false)}
        onSuccess={() => {
          loadKuehe();
          setShowNeueKuh(false);
          setSuccessMessage('✅ Neue Kuh erfolgreich angelegt!');
          setShowSuccess(true);
        }}
      />

      <AbgangDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        kuh={selectedKuh}
        onConfirm={handleDelete}
      />

      <DatePickerDialog
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onConfirm={async (date: Date) => {
          if (datePickerConfig && selectedKuh) {
            await datePickerConfig.action(date);
          }
          setShowDatePicker(false);
        }}
        title={datePickerConfig?.title || ''}
        message={datePickerConfig?.message || ''}
      />

      <ConfirmDialog
        isOpen={showFehlgeburt}
        onClose={() => setShowFehlgeburt(false)}
        onConfirm={handleFehlgeburt}
        title="Fehlgeburt dokumentieren"
        message={`Fehlgeburt bei ${selectedKuh?.name} dokumentieren? Das Tier wird wie nach dem Abkalben behandelt und die Brunstbeobachtung beginnt von vorne.`}
        confirmText="Bestätigen"
        cancelText="Abbrechen"
        isDanger={false}
      />

      <SuccessToast
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
            {/* Virtuelle Tastatur */}
            {showKeyboard && (
              <VirtualKeyboard
                type={keyboardType}
                onKeyPress={handleKeyPress}
                onClose={closeKeyboard}
              />
            )}
    </div>
  );
}