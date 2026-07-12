import { NextResponse } from 'next/server.js';
import { readAppData, updateEvent, deleteEvent } from '../../../lib/app-data.ts';
import { checkRequestAuth } from '../../../lib/auth.ts';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await readAppData();
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
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    const { id } = await params;
    const body = await request.json();
    await updateEvent(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    const { id } = await params;
    await deleteEvent(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
