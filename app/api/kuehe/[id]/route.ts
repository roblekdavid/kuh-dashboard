import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const kuh = await prisma.kuh.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!kuh) {
      return NextResponse.json(
        { error: 'Kuh nicht gefunden' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(kuh);
  } catch (error) {
    console.error('Fehler beim Laden der Kuh:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const kuh = await prisma.kuh.update({
      where: { id: parseInt(id) },
      data: body
    });
    
    return NextResponse.json(kuh);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Kuh:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.kuh.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Löschen der Kuh:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen' }, 
      { status: 500 }
    );
  }
}