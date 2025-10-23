import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { brightness } = await request.json();
    
    // ddcutil im Hintergrund ausführen
    await execAsync(`ddcutil setvcp 10 ${brightness}`);
    
    return NextResponse.json({ success: true, brightness });
  } catch (error) {
    console.error('Brightness error:', error);
    return NextResponse.json({ error: 'Failed to set brightness' }, { status: 500 });
  }
}
