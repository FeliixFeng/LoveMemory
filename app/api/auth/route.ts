import { NextResponse } from 'next/server.js';
import { getPin } from '../../lib/env.ts';
import { verifyPin, generateToken, pinRateLimitStatus, recordPinFailure, resetPinFailures } from '../../lib/auth.ts';

function clientKey(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
  const configured = getPin();
  if (!configured) {
    return NextResponse.json({ error: '认证未启用' }, { status: 403 });
  }

  const key = clientKey(request);
  const status = pinRateLimitStatus(key);
  if (status.locked) {
    return NextResponse.json(
      { error: '尝试次数过多，请稍后再试' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(status.retryAfterMs / 1000)) } }
    );
  }

  try {
    const { pin } = (await request.json()) as { pin?: string };

    if (!pin || typeof pin !== 'string' || !verifyPin(pin)) {
      recordPinFailure(key);
      return NextResponse.json({ error: 'PIN 码错误' }, { status: 401 });
    }

    resetPinFailures(key);
    const token = generateToken(pin);
    return NextResponse.json({ success: true, token });
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }
}
