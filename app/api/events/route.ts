import { NextResponse } from 'next/server.js';
import { readAppData, createEvent } from '../../lib/app-data.ts';
import { checkRequestAuth } from '../../lib/auth.ts';
import { CreateEventSchema } from '../../lib/schemas.ts';

export async function GET() {
  try {
    const data = await readAppData();
    return NextResponse.json({ events: data.events });
  } catch (error) {
    console.error('Read events error:', error);
    return NextResponse.json({ events: [] });
  }
}

export async function POST(request: Request) {
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const parsed = CreateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const id = body.id || String(Date.now());
    const event = await createEvent({ id, ...parsed.data, desc: parsed.data.desc });
    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
