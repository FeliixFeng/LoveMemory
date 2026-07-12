import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server.js';
import { getPin } from './env.ts';

const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const HMAC_ALGO = 'sha256';
const HMAC_KEY_PREFIX = 'lovememory-pin:';

function hmacSign(data: string, pin: string): string {
  return createHmac(HMAC_ALGO, HMAC_KEY_PREFIX + pin).update(data).digest('base64url');
}

export function verifyPin(pin: string): boolean {
  const configured = getPin();
  if (!configured) return false;

  if (pin.length !== configured.length) return false;
  return timingSafeEqual(Buffer.from(pin), Buffer.from(configured));
}

export function generateToken(pin: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = JSON.stringify({ exp });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = hmacSign(payloadB64, pin);
  return `${payloadB64}.${sig}`;
}

export function verifyToken(token: string): boolean {
  const configured = getPin();
  if (!configured) return false;

  const dot = token.lastIndexOf('.');
  if (dot < 0) return false;

  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expectedSig = hmacSign(payloadB64, configured);

  if (sig.length !== expectedSig.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Check request authentication. Returns null if auth passes, or a 401 NextResponse if it fails.
 */
export function checkRequestAuth(request: Request): NextResponse | null {
  if (!getPin()) return null;
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: '需要验证 PIN 码' }, { status: 401 });
  }
  return null;
}
