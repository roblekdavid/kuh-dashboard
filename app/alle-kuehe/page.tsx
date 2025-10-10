'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Filter, ArrowLeft, Settings, Save } from 'lucide-react';
import Link from 'next/link';
import { Kuh, Grenzwerte } from '@/app/lib/types';
import { formatDate, parseDate, getDaysUntil, getAlterInMonaten } from '@/app/lib/dateUtils';
import NeueKuhDialog from '@/app/components/dialogs/NeueKuhDialog';
import AbgangDialog from '@/app/components/dialogs/AbgangDialog';
import DatePickerDialog from '@/app/components/dialogs/DatePickerDialog';
import ConfirmDialog from '@/app/components/dialogs/ConfirmDialog';
import SuccessToast from '@/app/components/dialogs/SuccessToast';

export default function AlleKuehePage() {
  const [kuehe, setKuehe] = useState<Kuh[]>([]);
  const [filteredKuehe, setFilteredKuehe] = useState<Kuh[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('alle');
  const [showNeueKuh, setShowNeueKuh] = useState(false);
  const [showAbgang, setShowAbgang] = useState(false);
  const [selectedKuh, setSelectedKuh] = useState<Kuh | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerConfig, setDatePickerConfig] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showGrenzwerte, setShowGrenzwerte] = useState(false);
  const [grenzwerte, setGrenzwerte] = useState<Grenzwerte>({ ideal: 60, min: 50, max: 70 });
  const [showFehlgeburt, setShowFehlgeburt] = useState(false);

  useEffect(() => {
    loadKuehe();
    loadGrenzwerte();
  }, []);

  useEffect(() => {
    filterAndSortKuehe();
  }, [kuehe, searchTerm, statusFilter]);

  const loadKuehe = async () => {
    try {
      const res = await fetch('/api/kuehe?aktiv=true');
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
        if (statusFilter === 'kalbin') return !k.abgekalbt_am;
        if (statusFilter === 'klauenpflege') return k.klauenpflege;
        //return k.status === statusFilter;
      });
    }

    // SORTIERUNG: Tiere bei denen am längsten keine Brunst beobachtet wurde zuerst
    filtered.sort((a, b) => {
      // Kalbinnen: Älteste zuerst
      if (!a.abgekalbt_am && !b.abgekalbt_am) {
        if (a.geburtsdatum && b.geburtsdatum) {
          return parseDate(a.geburtsdatum)!.getTime() - parseDate(b.geburtsdatum)!.getTime();
        }
        return 0;
      }
      
      // Kühe: Diejenigen bei denen Abkalben am längsten zurück liegt zuerst
      if (a.abgekalbt_am && b.abgekalbt_am) {
        const aAbkalben = a.abgekalbt_am ? parseDate(a.abgekalbt_am)!.getTime() : 0;
        const bAbkalben = b.abgekalbt_am ? parseDate(b.abgekalbt_am)!.getTime() : 0;
        return aAbkalben - bAbkalben;
      }
      
      // Kühe vor Kalbinnen
      return !a.abgekalbt_am ? 1 : -1;
    });

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

  const handleFehlgeburt = async () => {
    if (!selectedKuh) return;
    
    // Fehlgeburt verhält sich wie Abkalben: Setzt Datum und löscht andere Status
    await handleStatusChange(selectedKuh.id, {
      abgekalbt: true,
      abgekalbt_am: new Date().toISOString(),
      status: 'abgekalbt',
      besamung_datum: null,
      letzte_brunst: null,
      belegt: null,
      kontrolle: null,
      kontroll_status: null,
      trockengestellt: false,
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
    { value: 'brunst_beobachten', label: 'Brunst beobachten', color: 'bg-blue-500' },
    { value: 'besamt', label: 'Besamt', color: 'bg-green-500' },
    { value: 'trocken', label: 'Trockengestellt', color: 'bg-indigo-500' },
    { value: 'abgekalbt', label: 'Abgekalbt', color: 'bg-emerald-500' },
    { value: 'klauenpflege', label: 'Klauenpflege', color: 'bg-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-4 md:p-8">
      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-3xl shadow-2xl p-6 md:p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <button className="bg-white/20 hover:bg-white/30 p-3 rounded-2xl transition-all active:scale-95">
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </Link>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold mb-2">📋 Alle Kühe</h1>
                <p className="text-xl md:text-2xl opacity-90">
                  {filteredKuehe.length} von {kuehe.length} Tieren
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowGrenzwerte(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-2xl font-semibold text-lg flex items-center gap-2 transition-all active:scale-95 touch-manipulation"
              >
                <Settings className="w-6 h-6" />
                <span className="hidden md:inline">Grenzwerte</span>
              </button>
              
              <button
                onClick={() => setShowNeueKuh(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-2xl font-semibold text-lg flex items-center gap-2 transition-all active:scale-95 touch-manipulation"
              >
                <Plus className="w-6 h-6" />
                Neue Kuh
              </button>
            </div>
          </div>
        </div>

        {/* Grenzwerte-Panel */}
        {showGrenzwerte && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Bestandsziele (für Belegungsplan)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Anzahl
                </label>
                <input
                  type="number"
                  value={grenzwerte.min}
                  onChange={(e) => setGrenzwerte({ ...grenzwerte, min: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ideal Anzahl
                </label>
                <input
                  type="number"
                  value={grenzwerte.ideal}
                  onChange={(e) => setGrenzwerte({ ...grenzwerte, ideal: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Maximum Anzahl
                </label>
                <input
                  type="number"
                  value={grenzwerte.max}
                  onChange={(e) => setGrenzwerte({ ...grenzwerte, max: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveGrenzwerte}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-semibold text-lg transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Speichern
              </button>
              <button
                onClick={() => setShowGrenzwerte(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-6 rounded-xl font-semibold text-lg transition-all active:scale-95 touch-manipulation"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Suche & Filter */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Suche */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Suche nach Name oder Nummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Status-Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Kühe-Liste */}
        <div className="space-y-4">
          {filteredKuehe.map((kuh) => {
            const tageAbkalben = kuh.abgekalbt_am 
              ? Math.abs(Math.floor((new Date().getTime() - parseDate(kuh.abgekalbt_am)!.getTime()) / (1000 * 60 * 60 * 24)))
              : null;
            
            const alterMonate = kuh.geburtsdatum 
              ? getAlterInMonaten(parseDate(kuh.geburtsdatum)!)
              : null;

            return (
              <div key={kuh.id} className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-2 ${
                !kuh.abgekalbt_am ? 'border-pink-300' : 'border-transparent'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`text-4xl ${!kuh.abgekalbt_am ? 'bg-pink-100' : 'bg-blue-100'} w-16 h-16 rounded-xl flex items-center justify-center`}>
                      {!kuh.abgekalbt_am ? '🐄' : '🐮'}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold text-gray-800">{kuh.name}</h3>
                        {!kuh.abgekalbt_am && (
                          <span className="bg-pink-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                            Kalbin
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-lg">Nr. {kuh.tiernummer}</p>
                      {!kuh.abgekalbt_am && alterMonate !== null && (
                        <p className="text-gray-500 text-sm mt-1">
                          Alter: {alterMonate} Monate
                        </p>
                      )}
                      {kuh.abgekalbt_am && tageAbkalben !== null && (
                        <p className="text-gray-500 text-sm mt-1">
                          Abgekalbt vor {tageAbkalben} Tagen
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedKuh(kuh);
                      setShowAbgang(true);
                    }}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-xl font-semibold transition-all active:scale-95"
                  >
                    Abmelden
                  </button>
                </div>

                {/* Aktionen */}
                <div className="flex flex-wrap gap-3">
                  {/* Brunst beobachtet */}
                  <button
                    onClick={() => handleDateAction(kuh, {
                      title: 'Brunst beobachtet',
                      message: `Wann wurde bei ${kuh.name} die Brunst beobachtet?`,
                      action: async (date: Date) => {
                        await handleStatusChange(kuh.id, {
                          letzte_brunst: date.toISOString(),
                          status: 'brunst_beobachten'
                        });
                      }
                    })}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95"
                  >
                    Brunst beobachtet
                  </button>

                  {/* Besamt */}
                  <button
                    onClick={() => handleDateAction(kuh, {
                      title: 'Besamt',
                      message: `Wann wurde ${kuh.name} besamt?`,
                      action: async (date: Date) => {
                        await handleStatusChange(kuh.id, {
                          besamung_datum: date.toISOString(),
                          letzte_brunst: date.toISOString(),
                          belegt: date.toISOString(),
                          besamung_versuche: (kuh.besamung_versuche || 0) + 1,
                          status: 'besamt'
                        });
                      }
                    })}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95"
                  >
                    Besamt
                  </button>

                  {/* Klauenpflege */}
                  <button
                    onClick={() => handleStatusChange(kuh.id, {
                      klauenpflege: !kuh.klauenpflege
                    })}
                    className={`${
                      kuh.klauenpflege 
                        ? 'bg-gray-500 hover:bg-gray-600' 
                        : 'bg-orange-500 hover:bg-orange-600'
                    } text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95`}
                  >
                    {kuh.klauenpflege ? 'Klauenpflege erledigt' : 'Klauenpflege nötig'}
                  </button>

                  {/* Fehlgeburt */}
                  <button
                    onClick={() => {
                      setSelectedKuh(kuh);
                      setShowFehlgeburt(true);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95"
                  >
                    Fehlgeburt
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialoge */}
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
        isOpen={showAbgang}
        onClose={() => setShowAbgang(false)}
        kuh={selectedKuh}
        onConfirm={(grund) => {
          if (selectedKuh) {
            handleStatusChange(selectedKuh.id, {
              aktiv: false,
              abgangsdatum: new Date().toISOString(),
              abgangsgrund: grund,
              status: 'abgegangen'
            });
            setShowAbgang(false);
            setSuccessMessage('✅ Tier erfolgreich abgemeldet!');
            setShowSuccess(true);
          }
        }}
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
    </div>
  );
}