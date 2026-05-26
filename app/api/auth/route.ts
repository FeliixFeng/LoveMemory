import { NextResponse } from 'next/server.js';
import { getPin } from '../../lib/env.ts';
import { verifyPin, generateToken } from '../../lib/auth.ts';

export async function POST(request: Request) {
  const configured = getPin();
  if (!configured) {
    return NextResponse.json({ error: '认证未启用' }, { status: 403 });
  }

  try {
    const { pin } = (await request.json()) as { pin?: string };

    if (!pin || typeof pin !== 'string' || !verifyPin(pin)) {
      return NextResponse.json({ error: 'PIN 码错误' }, { status: 401 });
    }

    const token = generateToken(pin);
    return NextResponse.json({ success: true, token });
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }
}
