import { NextResponse } from 'next/server.js';
import { readAppData, writeAppData } from '../../../src/storage/index.js';
import { DEFAULT_DATA } from '../../../src/storage/jsonStorage.js';

export async function GET() {
  try {
    const data = await readAppData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Read data error:', error);
    return NextResponse.json(DEFAULT_DATA);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const nextData = await writeAppData(payload && typeof payload === 'object' ? payload : {});
    return NextResponse.json({ success: true, data: nextData });
  } catch (error) {
    console.error('Save data error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
