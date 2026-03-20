import { NextResponse } from 'next/server.js';
import { DEFAULT_APP_DATA, readAppDataWithPrisma, writeAppDataWithPrisma } from '../../lib/app-data.ts';
import env from '../../../src/config/env.js';
import { readAppData, writeAppData } from '../../../src/storage/index.js';

export async function GET() {
  try {
    const data = env.STORAGE_DRIVER === 'mysql'
      ? await readAppDataWithPrisma()
      : await readAppData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Read data error:', error);
    return NextResponse.json(DEFAULT_APP_DATA);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const normalizedPayload = payload && typeof payload === 'object' ? payload : {};
    const nextData = env.STORAGE_DRIVER === 'mysql'
      ? await writeAppDataWithPrisma(normalizedPayload)
      : await writeAppData(normalizedPayload);
    return NextResponse.json({ success: true, data: nextData });
  } catch (error) {
    console.error('Save data error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
