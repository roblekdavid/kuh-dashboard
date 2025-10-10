import { NextResponse } from 'next/server';

// In-Memory Speicher für die Plätze (im Produktivbetrieb würde man Redis oder ähnliches nutzen)
let melkstandPlaetze: Array<{ platz: number; kuh: any | null }> = Array.from({ length: 7 }, (_, i) => ({
  platz: i + 1,
  kuh: null
}));

let lastUpdate = Date.now();

export async function GET() {
  return NextResponse.json({ plaetze: melkstandPlaetze, lastUpdate });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  if (body.action === 'set') {
    const { platz, kuh } = body;
    const index = melkstandPlaetze.findIndex(p => p.platz === platz);
    if (index !== -1) {
      melkstandPlaetze[index].kuh = kuh;
      lastUpdate = Date.now();
    }
  } else if (body.action === 'clear') {
    melkstandPlaetze = Array.from({ length: 7 }, (_, i) => ({
      platz: i + 1,
      kuh: null
    }));
    lastUpdate = Date.now();
  }
  
  return NextResponse.json({ success: true, plaetze: melkstandPlaetze, lastUpdate });
}