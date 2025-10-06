'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Kuh } from '@/app/lib/types';
import { formatDate, parseDate, getDaysUntil } from '@/app/lib/dateUtils';
import NeueKuhDialog from '@/app/components/dialogs/NeueKuhDialog';
import AbgangDialog from '@/app/components/dialogs/AbgangDialog';
import DatePickerDialog from '@/app/components/dialogs/DatePickerDialog';
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

  useEffect(() => {
    loadKuehe();
  }, []);

  useEffect(() => {
    filterKuehe();
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

  const filterKuehe = () => {
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
        if (statusFilter === 'kalbin') return k.ist_kalbin;
        if (statusFilter === 'klauenpflege') return k.klauenpflege;
        return k.status === statusFilter;
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
    { value: 'traechtig', label: 'Trächtig', color: 'bg-purple-500' },
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
            
            <button
              onClick={() => setShowNeueKuh(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-2xl font-semibold text-lg flex items-center gap-2 transition-all active:scale-95 touch-manipulation"
            >
              <Plus className="w-6 h-6" />
              Neue Kuh
            </button>
          </div>
        </div>

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
          {filteredKuehe.map((kuh) => (
            <div key={kuh.id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`${
                    kuh.ist_kalbin 
                      ? 'bg-gradient-to-br from-pink-500 to-pink-600' 
                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  } text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg`}>
                    #{kuh.tiernummer}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold text-gray-800">{kuh.name}</h3>
                      {kuh.ist_kalbin && (
                        <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">KALBIN</span>
                      )}
                      {kuh.klauenpflege && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">🦶 Klauenpflege</span>
                      )}
                    </div>
                    <p className="text-lg text-gray-600">
                      Status: <span className="font-semibold">{kuh.status}</span>
                      {kuh.besamung_versuche > 0 && (
                        <span className="ml-2 text-sm">({kuh.besamung_versuche}x besamt)</span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedKuh(kuh);
                    setShowAbgang(true);
                  }}
                  className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-xl font-semibold transition-all"
                >
                  Abmelden
                </button>
              </div>

              {/* Schnell-Aktionen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => handleDateAction(kuh, {
                    title: 'Brunst beobachtet',
                    message: `Wann wurde die Brunst bei ${kuh.name} beobachtet?`,
                    action: async (date: Date) => {
                      await handleStatusChange(kuh.id, {
                        letzte_brunst: date.toISOString(),
                        status: 'brunst_beobachten',
                        abgekalbt: false
                      });
                    }
                  })}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-all active:scale-95 touch-manipulation"
                >
                  📝 Brunst
                </button>

                <button
                  onClick={() => handleDateAction(kuh, {
                    title: 'Besamung',
                    message: `Wann wurde ${kuh.name} besamt?`,
                    action: async (date: Date) => {
                      const neueVersuche = (kuh.besamung_versuche || 0) + 1;
                      const kontrollDatum = new Date(date);
                      kontrollDatum.setDate(kontrollDatum.getDate() + 45);
                      
                      await handleStatusChange(kuh.id, {
                        besamung_datum: date.toISOString(),
                        letzte_brunst: date.toISOString(),
                        besamung_versuche: neueVersuche,
                        kontrolle: kontrollDatum.toISOString(),
                        status: 'besamt',
                        kontroll_status: null
                      });
                    }
                  })}
                  className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-semibold transition-all active:scale-95 touch-manipulation"
                >
                  ✅ Besamt
                </button>

                <button
                  onClick={() => handleStatusChange(kuh.id, {
                    status: 'traechtig',
                    kontroll_status: 'positiv',
                    belegt: kuh.besamung_datum,
                    kontrolle: null
                  })}
                  className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold transition-all active:scale-95 touch-manipulation"
                >
                  🤰 Trächtig
                </button>

                <button
                  onClick={() => handleDateAction(kuh, {
                    title: 'Abkalbung',
                    message: `Wann hat ${kuh.name} abgekalbt?`,
                    action: async (date: Date) => {
                      await handleStatusChange(kuh.id, {
                        abgekalbt: true,
                        abgekalbt_am: date.toISOString(),
                        trockengestellt: false,
                        trockengestellt_am: null,
                        status: 'abgekalbt'
                      });
                    }
                  })}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-xl font-semibold transition-all active:scale-95 touch-manipulation"
                >
                  🐮 Abgekalbt
                </button>

                <button
                  onClick={() => handleStatusChange(kuh.id, {
                    klauenpflege: !kuh.klauenpflege
                  })}
                  className={`${
                    kuh.klauenpflege 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white py-3 px-4 rounded-xl font-semibold transition-all active:scale-95 touch-manipulation`}
                >
                  {kuh.klauenpflege ? '✅ Klauen OK' : '🦶 Klauen'}
                </button>

                <button
                  onClick={() => {
                    // Verwurf - zurück zu Brunst
                    const naechsteBrunst = new Date();
                    naechsteBrunst.setDate(naechsteBrunst.getDate() + 21);
                    
                    handleStatusChange(kuh.id, {
                      status: 'brunst_beobachten',
                      belegt: null,
                      kontrolle: null,
                      kontroll_status: 'negativ',
                      trockengestellt: false,
                      letzte_brunst: naechsteBrunst.toISOString()
                    });
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-semibold transition-all active:scale-95 touch-manipulation"
                >
                  ⚠️ Verwurf
                </button>

                <button
                  onClick={() => handleStatusChange(kuh.id, {
                    trockengestellt: !kuh.trockengestellt,
                    trockengestellt_am: kuh.trockengestellt ? null : new Date().toISOString(),
                    status: kuh.trockengestellt ? 'traechtig' : 'trocken'
                  })}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold transition-all active:scale-95 touch-manipulation"
                >
                  {kuh.trockengestellt ? '🔄 Wieder melken' : '💤 Trocken'}
                </button>

                <button
                  onClick={() => {
                    const notiz = prompt(`Notiz für ${kuh.name}:`, kuh.notizen || '');
                    if (notiz !== null) {
                      handleStatusChange(kuh.id, { notizen: notiz || null });
                    }
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-semibold transition-all active:scale-95 touch-manipulation"
                >
                  📝 Notiz
                </button>
              </div>

              {/* Notizen anzeigen */}
              {kuh.notizen && (
                <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Notiz:</strong> {kuh.notizen}
                  </p>
                </div>
              )}
            </div>
          ))}

          {filteredKuehe.length === 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 text-center shadow-xl">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Keine Kühe gefunden</h2>
              <p className="text-lg text-gray-600">Passe deine Such- oder Filterkriterien an</p>
            </div>
          )}
        </div>
      </div>

      <NeueKuhDialog
        isOpen={showNeueKuh}
        onClose={() => setShowNeueKuh(false)}
        onSuccess={() => {
          loadKuehe();
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

      <SuccessToast
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}