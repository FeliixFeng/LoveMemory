import { NextResponse } from 'next/server.js';
import { readAppDataWithPrisma, readAppDataFromJson, updateEventWithPrisma, deleteEventWithPrisma } from '../../../lib/app-data.ts';
import { getStorageDriver, getPin } from '../../../lib/env.ts';
import { verifyToken } from '../../../lib/auth.ts';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = getStorageDriver() === 'mysql'
      ? await readAppDataWithPrisma()
      : await readAppDataFromJson();
    const event = data.events.find(e => String(e.id) === id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    const eventPhotos = data.photos.filter(p => p.eventId === id);
    const eventExpenses = data.expenses.filter(e => e.eventId === id);
    return NextResponse.json({ event, photos: eventPhotos, expenses: eventExpenses });
  } catch (error) {
    console.error('Read event error:', error);
    return NextResponse.json({ error: 'Failed to read event' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (getPin()) {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: '需要验证 PIN 码' }, { status: 401 });
    }
  }

  try {
    const { id } = await params;
    const body = await request.json();
    await updateEventWithPrisma(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (getPin()) {
    const authHeader = _request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: '需要验证 PIN 码' }, { status: 401 });
    }
  }

  try {
    const { id } = await params;
    await deleteEventWithPrisma(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
