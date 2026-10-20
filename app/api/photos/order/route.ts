import { NextResponse } from 'next/server.js';
import { updatePhotoOrder } from '../../../lib/app-data.ts';
import { checkRequestAuth } from '../../../lib/auth.ts';
import { PhotoOrderSchema } from '../../../lib/schemas.ts';

export async function PUT(request: Request) {
  try {
    const authErr = checkRequestAuth(request);
    if (authErr) return authErr;

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: '请求体必须是 JSON' }, { status: 400 });
    }

    const parsed = PhotoOrderSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: '参数不合法：需要 eventId 与 urls 列表' }, { status: 400 });
    }

    const updated = await updatePhotoOrder(parsed.data.eventId, parsed.data.urls);
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Photo order error:', error);
    return NextResponse.json({ error: 'Failed to update photo order' }, { status: 500 });
  }
}
