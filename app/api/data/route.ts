import { NextResponse } from 'next/server.js';
import {
  DEFAULT_APP_DATA,
  readAppDataFromJson,
  readAppDataWithPrisma,
  writeAppDataToJson,
  writeAppDataWithPrisma
} from '../../lib/app-data.ts';
import { getStorageDriver, getPin } from '../../lib/env.ts';
import { verifyToken } from '../../lib/auth.ts';

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
    if (getPin()) {
      const authHeader = request.headers.get('authorization') || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (!token || !verifyToken(token)) {
        return NextResponse.json({ error: '需要验证 PIN 码' }, { status: 401 });
      }
    }

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
