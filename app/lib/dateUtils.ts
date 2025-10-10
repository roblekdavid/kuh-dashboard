import { Kuh, BelegungsMonat } from './types';

// ==================== ANPASSBARE KONSTANTEN ====================
// Diese Werte können hier im Code geändert werden
export const BRUNST_ZYKLUS_TAGE = 21;
export const BRUNST_VORLAUF_TAGE = 2;
export const KONTROLLE_NACH_TAGEN = 45;
export const ZWEITE_BESAMUNG_ANZEIGE = 19; // Tag an dem Kuh wieder auf "Stieren" Dashboard erscheint
export const TROCKENSTELLEN_NACH_TAGEN = 230;
export const KALBEN_NACH_TAGEN = 290;

// ==================== HILFSFUNKTIONEN ====================

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

export const getDaysSince = (date: Date): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};

export const getAlterInMonaten = (geburtsdatum: Date): number => {
  const heute = new Date();
  const monate = (heute.getFullYear() - geburtsdatum.getFullYear()) * 12 + 
                 (heute.getMonth() - geburtsdatum.getMonth());
  return monate;
};

// ==================== BERECHNUNGSFUNKTIONEN ====================

export const getNaechsteBrunst = (letzteBrunst: Date): Date => {
  return addDays(letzteBrunst, BRUNST_ZYKLUS_TAGE);
};

export const getBrunstAnzeigeDatum = (naechsteBrunst: Date): Date => {
  return addDays(naechsteBrunst, -BRUNST_VORLAUF_TAGE);
};

export const getKontrollDatum = (besamungDatum: Date): Date => {
  return addDays(besamungDatum, KONTROLLE_NACH_TAGEN);
};

export const getTrockenstellDatum = (besamungDatum: Date): Date => {
  return addDays(besamungDatum, TROCKENSTELLEN_NACH_TAGEN);
};

export const getKalbeDatum = (besamungDatum: Date | null): Date | null => {
  if (!besamungDatum) return null;
  return addDays(besamungDatum, KALBEN_NACH_TAGEN);
};
export const getNextBrunstForKuh = (kuh: Kuh): Date | null => {
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  
  let basisDatum: Date | null = null;
  
  if (kuh.letzte_brunst) {
    basisDatum = parseDate(kuh.letzte_brunst);
  } else if (kuh.abgekalbt_am) {
    basisDatum = parseDate(kuh.abgekalbt_am);
  }
  
  if (!basisDatum) return null;
  
  // Berechne nächste Brunst (in Zyklen von 21 Tagen)
  let nextBrunst = new Date(basisDatum);
  while (nextBrunst <= heute) {
    nextBrunst = getNaechsteBrunst(nextBrunst);
  }
  
  return nextBrunst;
};

// ==================== BELEGUNGSPLAN-BERECHNUNG ====================

export const berechneBelegung = (kuehe: Kuh[], monate: number = 6): BelegungsMonat[] => {
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  
  const result: BelegungsMonat[] = [];
  
  for (let m = 0; m < monate; m++) {
    const monatStart = new Date(heute.getFullYear(), heute.getMonth() + m, 1);
    const monatEnde = new Date(heute.getFullYear(), heute.getMonth() + m + 1, 0);
    const monatName = monatStart.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    
    // Wochen des Monats
    const wochen: any[] = [];
    let currentWeekStart = new Date(monatStart);
    
    while (currentWeekStart <= monatEnde) {
      const wochenName = `KW ${getWeekNumber(currentWeekStart)}`;
      
      // Tage der Woche
      const tage = [];
      for (let d = 0; d < 7; d++) {
        const tag = new Date(currentWeekStart);
        tag.setDate(tag.getDate() + d);
        
        if (tag <= monatEnde && tag >= monatStart) {
          const melkend = berechneMelkendeKuehe(tag, kuehe);
          tage.push({
            tag: tag.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
            melkend
          });
        }
      }
      
      if (tage.length > 0) {
        const wocheMelkend = Math.round(
          tage.reduce((sum: number, t: any) => sum + t.melkend, 0) / tage.length
        );
        
        wochen.push({
          woche: wochenName,
          melkend: wocheMelkend,
          tage
        });
      }
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    // Monatsdurchschnitt
    const monatMelkend = Math.round(
      wochen.reduce((sum, w) => sum + w.melkend, 0) / wochen.length
    );
    
    result.push({
      monat: monatName,
      melkend: monatMelkend,
      wochen
    });
  }
  
  return result;
};

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function berechneMelkendeKuehe(datum: Date, kuehe: Kuh[]): number {
  let melkend = 0;

  kuehe.forEach(kuh => {
    // Kalbin: Zählt nach erstem Kalben
    if (!kuh.abgekalbt_am) {
      if(kuh.besamung_datum){
        const besamungDatum = parseDate(kuh.besamung_datum)!;
        const kalbeDatum = getKalbeDatum(besamungDatum);
        if (kalbeDatum != null && kalbeDatum <= datum) {
          melkend++;
        }
      }
      return;
    }

    // Kuh: Besamungsdatum vorhanden
    if (kuh.besamung_datum) {
      const besamungDatum = parseDate(kuh.besamung_datum)!;
      const trockenDatum = getTrockenstellDatum(besamungDatum);
      const kalbeDatum = getKalbeDatum(besamungDatum);

      // Zwischen Besamung und Trockenstellen
      if (datum >= besamungDatum && datum < trockenDatum) {
        melkend++;
      }
      // Nach Kalben wieder melkend
      else if (kalbeDatum && datum >= kalbeDatum) {
        melkend++;
      }
    }
    // Kuh ohne Besamungsdatum aber abgekalbt
    else if (kuh.abgekalbt_am) {
      const abgekalbDatum = parseDate(kuh.abgekalbt_am)!;
      if (datum >= abgekalbDatum) {
        melkend++;
      }
    }
  });

  return melkend;
}