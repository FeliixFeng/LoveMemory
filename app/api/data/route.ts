import { NextResponse } from 'next/server.js';
import {
  DEFAULT_APP_DATA,
  readAppData,
  writeAppData
} from '../../lib/app-data.ts';
import { checkRequestAuth } from '../../lib/auth.ts';

export async function GET() {
  try {
    const data = await readAppData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Read data error:', error);
    return NextResponse.json(DEFAULT_APP_DATA);
  }
}

export async function POST(request: Request) {
  try {
    const authErr = checkRequestAuth(request);
    if (authErr) return authErr;

    const payload = await request.json();
    const normalizedPayload = payload && typeof payload === 'object' ? payload : {};

    // Backward compat: accept milestones key as events
    if (normalizedPayload.milestones && !normalizedPayload.events) {
      normalizedPayload.events = normalizedPayload.milestones;
    }
    delete normalizedPayload.milestones;

    const nextData = await writeAppData(normalizedPayload);
    return NextResponse.json({ success: true, data: nextData });
  } catch (error) {
    console.error('Save data error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
