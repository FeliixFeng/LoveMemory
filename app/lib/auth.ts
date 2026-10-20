import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server.js';
import { getAppSecret, getPin } from './env.ts';

const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const HMAC_ALGO = 'sha256';

function hmacSign(data: string, secret: string): string {
  return createHmac(HMAC_ALGO, 'lovememory-token:' + secret).update(data).digest('base64url');
}

// --- PIN 失败限流：同 key 5 分钟内连续错 5 次即锁定 ---

const PIN_MAX_FAILURES = 5;
const PIN_LOCK_WINDOW_MS = 5 * 60 * 1000;

type PinFailureEntry = { count: number; lockedUntil: number; lastAt: number };
const pinFailures = new Map<string, PinFailureEntry>();

export function pinRateLimitStatus(key: string): { locked: boolean; retryAfterMs: number } {
  const entry = pinFailures.get(key);
  if (!entry) return { locked: false, retryAfterMs: 0 };
  if (entry.lockedUntil > Date.now()) return { locked: true, retryAfterMs: entry.lockedUntil - Date.now() };
  if (entry.lockedUntil > 0) pinFailures.delete(key);
  return { locked: false, retryAfterMs: 0 };
}

export function recordPinFailure(key: string): void {
  const now = Date.now();
  const entry = pinFailures.get(key);
  if (!entry || now - entry.lastAt > PIN_LOCK_WINDOW_MS) {
    pinFailures.set(key, { count: 1, lockedUntil: 0, lastAt: now });
    return;
  }
  entry.count += 1;
  entry.lastAt = now;
  if (entry.count >= PIN_MAX_FAILURES) {
    entry.lockedUntil = now + PIN_LOCK_WINDOW_MS;
  }
}

export function resetPinFailures(key: string): void {
  pinFailures.delete(key);
}

export function resetAllPinFailures(): void {
  pinFailures.clear();
}

export function verifyPin(pin: string): boolean {
  const configured = getPin();
  if (!configured) return false;

  if (pin.length !== configured.length) return false;
  return timingSafeEqual(Buffer.from(pin), Buffer.from(configured));
}

export function generateToken(pin: string): string {
  void pin;
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = JSON.stringify({ exp });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = hmacSign(payloadB64, getAppSecret());
  return `${payloadB64}.${sig}`;
}

export function verifyToken(token: string): boolean {
  const secret = getAppSecret();
  if (!secret) return false;

  const dot = token.lastIndexOf('.');
  if (dot < 0) return false;

  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expectedSig = hmacSign(payloadB64, secret);

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
