import { NextResponse } from 'next/server.js';
import {
  DEFAULT_APP_DATA,
  readAppDataFromJson,
  readAppDataWithPrisma,
  writeAppDataToJson,
  writeAppDataWithPrisma
} from '../../lib/app-data.ts';
import { getStorageDriver } from '../../lib/env.ts';

export async function GET() {
  try {
    const data = getStorageDriver() === 'mysql'
      ? await readAppDataWithPrisma()
      : await readAppDataFromJson();
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
    const nextData = getStorageDriver() === 'mysql'
      ? await writeAppDataWithPrisma(normalizedPayload)
      : await writeAppDataToJson(normalizedPayload);
    return NextResponse.json({ success: true, data: nextData });
  } catch (error) {
    console.error('Save data error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
