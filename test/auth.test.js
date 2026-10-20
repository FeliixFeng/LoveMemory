import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.APP_PIN = '123456';
delete process.env.APP_SECRET;

const salt = `${Date.now()}-${Math.random()}`;
const authRoute = await import(new URL(`../app/api/auth/route.ts?${salt}`, import.meta.url).href);
const auth = await import(new URL(`../app/lib/auth.ts?${salt}`, import.meta.url).href);

function pinRequest(pin, ip) {
  return new Request('http://localhost/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ pin })
  });
}

test('PIN rate limit: 5 wrong attempts lock the key for 5 minutes', async () => {
  const ip = '10.0.0.1';

  for (let i = 0; i < 5; i++) {
    const res = await authRoute.POST(pinRequest('000000', ip));
    assert.equal(res.status, 401, `attempt ${i + 1} should be 401`);
  }

  const locked = await authRoute.POST(pinRequest('123456', ip));
  assert.equal(locked.status, 429);
  assert.ok(Number(locked.headers.get('Retry-After')) > 0);

  const other = await authRoute.POST(pinRequest('123456', '10.0.0.2'));
  assert.equal(other.status, 200);
  const body = await other.json();
  assert.ok(body.token);
});

test('successful PIN resets failure counter', async () => {
  const ip = '10.0.0.3';

  for (let i = 0; i < 4; i++) {
    await authRoute.POST(pinRequest('000000', ip));
  }
  const ok = await authRoute.POST(pinRequest('123456', ip));
  assert.equal(ok.status, 200);

  for (let i = 0; i < 4; i++) {
    const res = await authRoute.POST(pinRequest('000000', ip));
    assert.equal(res.status, 401, `post-reset attempt ${i + 1} should still be 401, not locked`);
  }
});

test('token signed with APP_SECRET round-trips and dies when secret changes', async () => {
  process.env.APP_SECRET = 'test-secret-a';
  const token = auth.generateToken('123456');
  assert.equal(auth.verifyToken(token), true);
  assert.equal(auth.verifyToken('garbage.token'), false);

  process.env.APP_SECRET = 'test-secret-b';
  assert.equal(auth.verifyToken(token), false);
  delete process.env.APP_SECRET;
});

test('token falls back to APP_PIN as signing secret when APP_SECRET unset', async () => {
  delete process.env.APP_SECRET;
  const token = auth.generateToken('123456');
  assert.equal(auth.verifyToken(token), true);

  const tampered = token.slice(0, -3) + 'aaa';
  assert.equal(auth.verifyToken(tampered), false);
});
