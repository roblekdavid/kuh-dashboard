import { NextResponse } from 'next/server';

// In-Memory Speicher für die Plätze
let melkstandPlaetze: Array<{ platz: number; kuh: any | null }> = Array.from({ length: 7 }, (_, i) => ({
  platz: i + 1,
  kuh: null
}));

// Speicher für bereits gemolkene Kühe
let bereitsGemolkeneKuehe: number[] = [];

// Timestamp wann die Liste erstellt wurde
let listeErstelltAm: number | null = null;

// Timer Referenz
let cleanupTimer: NodeJS.Timeout | null = null;

let lastUpdate = Date.now();

// Funktion zum Prüfen ob Liste abgelaufen ist
function checkAndCleanupList() {
  if (listeErstelltAm && Date.now() - listeErstelltAm > 6 * 60 * 60 * 1000) {
    // Liste ist älter als 6 Stunden - leeren
    bereitsGemolkeneKuehe = [];
    listeErstelltAm = null;
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }
  }
}

// Funktion zum Starten des Auto-Cleanup Timers
function startCleanupTimer() {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
  }
  
  cleanupTimer = setTimeout(() => {
    bereitsGemolkeneKuehe = [];
    listeErstelltAm = null;
    cleanupTimer = null;
  }, 6 * 60 * 60 * 1000); // 6 Stunden
}

export async function GET() {
  checkAndCleanupList();
  return NextResponse.json({ 
    plaetze: melkstandPlaetze, 
    bereitsGemolkeneKuehe: bereitsGemolkeneKuehe,
    lastUpdate 
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  checkAndCleanupList();
  
  if (body.action === 'set') {
  const { platz, kuh } = body;
  const index = melkstandPlaetze.findIndex(p => p.platz === platz);
  if (index !== -1) {
    const previousKuh = melkstandPlaetze[index].kuh;
    melkstandPlaetze[index].kuh = kuh;
    
    // Wenn eine Kuh hinzugefügt wird
    if (kuh && !bereitsGemolkeneKuehe.includes(kuh.id)) {
      // Wenn erste Kuh hinzugefügt wird, Timer starten
      if (bereitsGemolkeneKuehe.length === 0) {
        listeErstelltAm = Date.now();
        startCleanupTimer();
      }
      
      bereitsGemolkeneKuehe.push(kuh.id);
    }
    
    // Wenn eine Kuh einzeln entfernt wird (null gesetzt), aus "bereits gemolken" Liste entfernen
    if (!kuh && previousKuh) {
      bereitsGemolkeneKuehe = bereitsGemolkeneKuehe.filter(id => id !== previousKuh.id);
      
      // Wenn Liste leer wird, Timer stoppen
      if (bereitsGemolkeneKuehe.length === 0) {
        listeErstelltAm = null;
        if (cleanupTimer) {
          clearTimeout(cleanupTimer);
          cleanupTimer = null;
        }
      }
    }
    
    lastUpdate = Date.now();
  }
  } else if (body.action === 'clear') {
    // Nur Plätze leeren, "bereits gemolken" Liste bleibt bestehen
    melkstandPlaetze = Array.from({ length: 7 }, (_, i) => ({
      platz: i + 1,
      kuh: null
    }));
    lastUpdate = Date.now();
  } else if (body.action === 'clearHistory') {
    // Speicher komplett leeren
    bereitsGemolkeneKuehe = [];
    listeErstelltAm = null;
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }
    lastUpdate = Date.now();
  }
  
  return NextResponse.json({ 
    success: true, 
    plaetze: melkstandPlaetze, 
    bereitsGemolkeneKuehe: bereitsGemolkeneKuehe,
    lastUpdate 
  });
}