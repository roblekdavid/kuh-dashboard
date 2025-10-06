export interface Kuh {
  id: number;
  name: string;
  tiernummer: string;
  ist_kalbin: boolean;
  erstes_kalben: string | null;
  status: string;
  
  // ERWEITERT
  letzte_brunst: string | null;
  besamung_datum: string | null;
  besamung_versuche: number;
  
  belegt: string | null;
  kontrolle: string | null;
  kontroll_status: string | null;
  
  trockengestellt_am: string | null;
  abgekalbt_am: string | null;
  trockengestellt: boolean;
  abgekalbt: boolean;
  klauenpflege: boolean;
  aktiv: boolean;
  abgangsdatum: string | null;
  abgangsgrund: string | null;
  notizen: string | null;
}

export interface BestandsMonat {
  monat: string;
  melkend: number;
}

export interface Dashboard {
  title: string;
  icon: string;
  color: string;
  filter?: (kuh: Kuh) => boolean;
  showInfo?: string[];
  isSpecial?: string;
}