export interface Kuh {
  id: number;
  name: string;
  tiernummer: string;
  geburtsdatum: string | null;
  
  letzte_brunst: string | null;
  besamung_datum: string | null;
  besamung_versuche: number;
  
  kontroll_status: string | null;
  
  trockengestellt_am: string | null;
  abgekalbt_am: string | null;
  klauenpflege: boolean;
  aktiv: boolean;
  abgangsdatum: string | null;
  abgangsgrund: string | null;
  notizen: string | null;
}

export interface BelegungsMonat {
  monat: string;
  melkend: number;
  wochen: BelegungsWoche[];
}

export interface BelegungsWoche {
  woche: string;
  melkend: number;
  tage: BelegungsTag[];
}

export interface BelegungsTag {
  tag: string;
  melkend: number;
}

export interface Dashboard {
  title: string;
  icon: string;
  color: string;
  filter?: (kuh: Kuh) => boolean;
  showInfo?: string[];
  isSpecial?: boolean;
}

// Grenzwerte für Bestandsplanung (können auf "Alle Kühe" Seite geändert werden)
export interface Grenzwerte {
  ideal: number;
  min: number;
  max: number;
}