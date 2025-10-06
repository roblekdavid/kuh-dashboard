import { Kuh } from './types';
// ==================== KONSTANTEN ====================
export const BRUNST_ZYKLUS_TAGE = 21;
export const BRUNST_VORLAUF_TAGE = 2;
export const KONTROLLE_NACH_TAGEN = 45;
export const ZWEITE_BESAMUNG_ANZEIGE = 19; // Tag an dem Kuh wieder erscheint
export const TROCKENSTELLEN_NACH_TAGEN = 220;
export const KALBEN_NACH_TAGEN = 280;

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const parseDate = (dateStr: string | null): Date | null => {
  return dateStr ? new Date(dateStr) : null;
};

export const isWithinRange = (date: Date, startDays: number, endDays: number): boolean => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = addDays(now, startDays);
  const end = addDays(now, endDays);
  return date >= start && date <= end;
};

export const getTrockenstellDatum = (besamungDatum: Date): Date => {
  return addDays(besamungDatum, TROCKENSTELLEN_NACH_TAGEN); // 220 Tage
};

export const getKalbeDatum = (besamungDatum: Date | null): Date | null => {
  if (!besamungDatum) return null;
  return addDays(besamungDatum, KALBEN_NACH_TAGEN); // 280 Tage
};

export const formatDate = (date: Date | null): string => {
  if (!date) return '-';
  return date.toLocaleDateString('de-DE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

export const getDaysUntil = (date: Date): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  return Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

// Berechne melkende Kühe pro Monat/Woche (4 Monate, aufklappbar)
export const berechneBestand = (kuehe: any[]): any[] => {
  const monate = [];
  const heute = new Date();
  
  for (let i = 0; i < 4; i++) { // Nur 4 Monate
    const monatStart = addDays(heute, i * 30);
    const monatName = monatStart.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    
    // Wochen innerhalb des Monats
    const wochen = [];
    for (let w = 0; w < 4; w++) {
      const wochenStart = addDays(monatStart, w * 7);
      const wochenName = `KW ${Math.ceil((wochenStart.getDate()) / 7)}`;
      
      let wocheMelkend = 0;
      
      kuehe.filter(k => k.aktiv).forEach(kuh => {
        if (kuh.ist_kalbin && kuh.erstes_kalben) {
          const kalbeDatum = parseDate(kuh.erstes_kalben);
          if (kalbeDatum && kalbeDatum <= wochenStart) {
            wocheMelkend++;
          }
        } else if (!kuh.ist_kalbin && kuh.besamung_datum) {
          const trockenDatum = getTrockenstellDatum(parseDate(kuh.besamung_datum)!);
          const kalbeDatum = getKalbeDatum(parseDate(kuh.besamung_datum));
          
          if (!(wochenStart >= trockenDatum && kalbeDatum && wochenStart <= kalbeDatum)) {
            wocheMelkend++;
          }
        } else if (!kuh.ist_kalbin && !kuh.trockengestellt) {
          wocheMelkend++;
        }
      });
      
      wochen.push({ woche: wochenName, melkend: wocheMelkend });
    }
    
    // Monatsdurchschnitt
    const monatMelkend = Math.round(wochen.reduce((sum, w) => sum + w.melkend, 0) / wochen.length);
    
    monate.push({ 
      monat: monatName, 
      melkend: monatMelkend,
      wochen 
    });
  }
  
  return monate;
};
// Nächste Brunst basierend auf letzter Brunst (21-Tage-Zyklus)
export const getNaechsteBrunst = (letzteBrunst: Date): Date => {
  return addDays(letzteBrunst, BRUNST_ZYKLUS_TAGE);
};

// Wann Kuh im Dashboard erscheint (2 Tage vor Brunst)
export const getBrunstAnzeigeDatum = (naechsteBrunst: Date): Date => {
  return addDays(naechsteBrunst, -BRUNST_VORLAUF_TAGE);
};

// Kontrolldatum berechnen (45 Tage nach Besamung)
export const getKontrollDatum = (besamungDatum: Date): Date => {
  return addDays(besamungDatum, KONTROLLE_NACH_TAGEN);
};