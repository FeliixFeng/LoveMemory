import { NextResponse } from 'next/server.js';
import { readAppDataWithPrisma, readAppDataFromJson, createEventWithPrisma } from '../../lib/app-data.ts';
import { getStorageDriver, getPin } from '../../lib/env.ts';
import { verifyToken } from '../../lib/auth.ts';

export async function GET() {
  try {
    const data = getStorageDriver() === 'mysql'
      ? await readAppDataWithPrisma()
      : await readAppDataFromJson();
    return NextResponse.json({ events: data.events });
  } catch (error) {
    console.error('Read events error:', error);
    return NextResponse.json({ events: [] });
  }
}

export async function POST(request: Request) {
  if (getPin()) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: '需要验证 PIN 码' }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const id = body.id || String(Date.now());
    const event = await createEventWithPrisma({
      id,
      title: body.title || '',
      date: body.date || '',
      desc: body.desc || body.description || '',
      icon: body.icon || 'heart',
      location: body.location || '',
      mood: body.mood || '',
      coverPhoto: body.coverPhoto || ''
    });
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
