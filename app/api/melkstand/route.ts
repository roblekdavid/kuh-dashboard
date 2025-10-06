// ============================================
// OPTIONAL: MELKSTAND-KOMMUNIKATION API
// ============================================
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Aktuelle Session abrufen
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'current';
    
    const positionen = await prisma.melkstandPosition.findMany({
      where: { sessionId },
      orderBy: { position: 'asc' }
    });
    
    return NextResponse.json(positionen);
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

// Position setzen/aktualisieren
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { position, kuhId, sessionId } = body;
    
    // Kuh-Daten abrufen
    let kuhName = null;
    let kuhNummer = null;
    
    if (kuhId) {
      const kuh = await prisma.kuh.findUnique({
        where: { id: kuhId }
      });
      kuhName = kuh?.name || null;
      kuhNummer = kuh?.tiernummer || null;
    }
    
    // Existierende Position aktualisieren oder neu erstellen
    const existingPosition = await prisma.melkstandPosition.findFirst({
      where: { position, sessionId }
    });
    
    if (existingPosition) {
      await prisma.melkstandPosition.update({
        where: { id: existingPosition.id },
        data: {
          kuhId,
          kuhName,
          kuhNummer,
          zeitstempel: new Date()
        }
      });
    } else {
      await prisma.melkstandPosition.create({
        data: {
          position,
          kuhId,
          kuhName,
          kuhNummer,
          sessionId,
          zeitstempel: new Date()
        }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
  }
}

// Session zurücksetzen
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'current';
    
    await prisma.melkstandPosition.deleteMany({
      where: { sessionId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
  }
}