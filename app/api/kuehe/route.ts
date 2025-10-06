import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nurAktive = searchParams.get('aktiv') === 'true';
    
    const kuehe = await prisma.kuh.findMany({
      where: nurAktive ? { aktiv: true } : undefined,
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(kuehe);
  } catch (error) {
    console.error('Fehler beim Laden der Kühe:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Daten' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const kuh = await prisma.kuh.create({
      data: body
    });
    
    return NextResponse.json(kuh);
  } catch (error) {
    console.error('Fehler beim Erstellen der Kuh:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen' }, 
      { status: 500 }
    );
  }
}