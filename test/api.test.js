import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execSync } from 'node:child_process';

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9WQAAAAASUVORK5CYII=';
const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lovememory-next-test-'));
const dbFile = path.join(rootDir, 'db.sqlite');
const uploadDir = path.join(rootDir, 'uploads');
const projectRoot = path.resolve(import.meta.dirname, '..');

await fs.mkdir(uploadDir, { recursive: true });
await fs.mkdir(path.join(uploadDir, 'thumbs'), { recursive: true });

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = `file:${dbFile}`;
process.env.UPLOAD_DIR = uploadDir;

// Create SQLite database with schema tables
execSync(`npx prisma db push --force-reset --skip-generate`, {
  env: {
    ...process.env,
    DATABASE_URL: `file:${dbFile}`,
    PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'yes'
  },
  cwd: projectRoot,
  stdio: 'pipe'
});

const salt = `${Date.now()}-${Math.random()}`;
const dataRoute = await import(new URL(`../app/api/data/route.ts?${salt}`, import.meta.url).href);
const uploadRoute = await import(new URL(`../app/api/upload/route.ts?${salt}`, import.meta.url).href);
const healthRoute = await import(new URL(`../app/api/health/route.ts?${salt}`, import.meta.url).href);

// Get the shared prisma client to clean up between tests
const prismaModule = await import(new URL(`../app/lib/prisma.ts?${salt}`, import.meta.url).href);
const prisma = prismaModule.prisma;

async function resetDb() {
  // Delete all data from tables (order matters for foreign keys)
  await prisma.$executeRawUnsafe('DELETE FROM expenses');
  await prisma.$executeRawUnsafe('DELETE FROM photos');
  await prisma.$executeRawUnsafe('DELETE FROM events');
  await prisma.$executeRawUnsafe('DELETE FROM settings');
  await prisma.$executeRawUnsafe('DELETE FROM love_quotes');
  await prisma.$executeRawUnsafe('DELETE FROM wishes');
  await prisma.$executeRawUnsafe('DELETE FROM capsules');
}

async function createTestContext() {
  await resetDb();
  await fs.rm(uploadDir, { recursive: true, force: true });
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.mkdir(path.join(uploadDir, 'thumbs'), { recursive: true });

  return {
    dbFile,
    uploadDir,
    dataRoute,
    uploadRoute,
    healthRoute,
    async cleanup() {
      await resetDb();
      await fs.rm(uploadDir, { recursive: true, force: true });
    }
  };
}

test('GET /api/health returns ok payload', async () => {
  const ctx = await createTestContext();

  try {
    const response = await ctx.healthRoute.GET();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.status, 'ok');
    assert.equal(body.storageDriver, 'sqlite');
  } finally {
    await ctx.cleanup();
  }
});

test('GET /api/data returns default payload for a fresh database', async () => {
  const ctx = await createTestContext();

  try {
    const response = await ctx.dataRoute.GET();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.startDate, '');
    assert.equal(body.heroImage, '');
    assert.deepEqual(body.events, []);
    assert.deepEqual(body.photos, []);
    assert.deepEqual(body.expenses, []);
    assert.ok(Array.isArray(body.loveQuotes));
  } finally {
    await ctx.cleanup();
  }
});

test('POST /api/data updates only settings fields', async () => {
  const ctx = await createTestContext();

  try {
    await prisma.event.create({ data: { id: 'evt-1', title: 'First Date', date: '2020-01-02', description: 'Cafe' } });

    const first = await ctx.dataRoute.POST(
      new Request('http://localhost/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: '2020-01-01', heroImage: '/hero.jpg' })
      })
    );
    assert.equal(first.status, 200);

    const second = await ctx.dataRoute.POST(
      new Request('http://localhost/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroImage: '/updated-hero.jpg' })
      })
    );
    const body = await second.json();

    assert.equal(second.status, 200);
    assert.equal(body.data.startDate, '2020-01-01');
    assert.equal(body.data.heroImage, '/updated-hero.jpg');
    assert.equal(body.data.events.length, 1);
  } finally {
    await ctx.cleanup();
  }
});

test('POST /api/data rejects events/photos payloads with 400 and keeps data intact', async () => {
  const ctx = await createTestContext();

  try {
    await prisma.event.create({ data: { id: 'evt-keep', title: 'Keep Me', date: '2021-01-01', description: '' } });
    await prisma.photo.create({ data: { url: '/uploads/keep.jpg', displayUrl: '/uploads/keep.jpg', thumbUrl: '/uploads/keep.jpg', uploadedAt: '2026-01-01T00:00:00.000Z', eventId: 'evt-keep' } });

    for (const payload of [{ events: [] }, { photos: [] }, { expenses: [] }, { wishes: [] }, { capsules: [] }, { milestones: [] }]) {
      const res = await ctx.dataRoute.POST(
        new Request('http://localhost/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      );
      assert.equal(res.status, 400, `expected 400 for ${JSON.stringify(payload)}`);
    }

    assert.equal(await prisma.event.count(), 1);
    assert.equal(await prisma.photo.count(), 1);
  } finally {
    await ctx.cleanup();
  }
});

test('PUT /api/photos/order reorders photos without deleting any', async () => {
  const ctx = await createTestContext();
  const orderRoute = await import(new URL(`../app/api/photos/order/route.ts?${Date.now()}`, import.meta.url).href);

  try {
    await prisma.event.create({ data: { id: 'evt-2', title: 'Trip', date: '2022-05-01', description: '' } });
    for (const url of ['/uploads/a.jpg', '/uploads/b.jpg']) {
      await prisma.photo.create({ data: { url, displayUrl: url, thumbUrl: url, uploadedAt: '2026-01-01T00:00:00.000Z', eventId: 'evt-2', sortOrder: url === '/uploads/a.jpg' ? 0 : 1 } });
    }

    const res = await orderRoute.PUT(
      new Request('http://localhost/api/photos/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: 'evt-2', urls: ['/uploads/b.jpg', '/uploads/a.jpg'] })
      })
    );
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.updated, 2);
    assert.equal(await prisma.photo.count(), 2);
    const b = await prisma.photo.findUnique({ where: { url: '/uploads/b.jpg' } });
    const a = await prisma.photo.findUnique({ where: { url: '/uploads/a.jpg' } });
    assert.equal(b.sortOrder, 0);
    assert.equal(a.sortOrder, 1);
  } finally {
    await ctx.cleanup();
  }
});

test('upload and delete route handlers manage original and thumbnail files', async () => {
  const ctx = await createTestContext();

  try {
    const formData = new FormData();
    const buffer = Buffer.from(PNG_BASE64, 'base64');
    formData.append('image', new Blob([buffer], { type: 'image/png' }), 'tiny.png');

    const uploadResponse = await ctx.uploadRoute.POST(
      new Request('http://localhost/api/upload', {
        method: 'POST',
        body: formData
      })
    );
    const uploadBody = await uploadResponse.json();

    assert.equal(uploadResponse.status, 200);
    assert.equal(uploadBody.success, true);
    assert.equal(uploadBody.displayUrl, uploadBody.url);
    assert.notEqual(uploadBody.thumbUrl, uploadBody.displayUrl);

    const uploadedFile = path.join(ctx.uploadDir, uploadBody.filename);
    const thumbFile = path.join(ctx.uploadDir, path.basename(uploadBody.thumbUrl));
    await fs.access(uploadedFile);
    await fs.access(thumbFile);

    const deleteResponse = await ctx.uploadRoute.DELETE(
      new Request('http://localhost/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: uploadBody.url })
      })
    );
    const deleteBody = await deleteResponse.json();

    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteBody.success, true);
    await assert.rejects(() => fs.access(uploadedFile));
    await assert.rejects(() => fs.access(thumbFile));
  } finally {
    await ctx.cleanup();
  }
});

test('concurrent settings patches of different fields both persist', async () => {
  const ctx = await createTestContext();

  try {
    const post = payload => ctx.dataRoute.POST(
      new Request('http://localhost/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    );

    const [a, b] = await Promise.all([
      post({ startDate: '2022-02-02' }),
      post({ heroImage: '/hero-concurrent.jpg' })
    ]);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);

    const res = await ctx.dataRoute.GET(new Request('http://localhost/api/data'));
    const body = await res.json();
    assert.equal(body.startDate, '2022-02-02');
    assert.equal(body.heroImage, '/hero-concurrent.jpg');
  } finally {
    await ctx.cleanup();
  }
});

test('deleting an event keeps settings and photos, cascades expenses', async () => {
  const ctx = await createTestContext();
  const eventsRoute = await import(new URL(`../app/api/events/[id]/route.ts?${Date.now()}`, import.meta.url).href);

  try {
    await ctx.dataRoute.POST(
      new Request('http://localhost/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: '2021-06-06', heroImage: '/hero-keep.jpg' })
      })
    );
    await prisma.event.create({ data: { id: 'evt-del', title: 'Doomed', date: '2021-06-06', description: '' } });
    await prisma.photo.create({ data: { url: '/uploads/orphan.jpg', displayUrl: '/uploads/orphan.jpg', thumbUrl: '/uploads/orphan.jpg', uploadedAt: '2026-01-01T00:00:00.000Z', eventId: 'evt-del' } });
    await prisma.expense.create({ data: { amount: 99, category: '餐饮', note: '', eventId: 'evt-del' } });

    const res = await eventsRoute.DELETE(
      new Request('http://localhost/api/events/evt-del', { method: 'DELETE' }),
      { params: Promise.resolve({ id: 'evt-del' }) }
    );
    assert.equal(res.status, 200);

    assert.equal(await prisma.event.count(), 0);
    assert.equal(await prisma.expense.count(), 0);
    assert.equal(await prisma.photo.count(), 1);
    const photo = await prisma.photo.findFirst();
    assert.equal(photo.eventId, null);

    const read = await ctx.dataRoute.GET(new Request('http://localhost/api/data'));
    const body = await read.json();
    assert.equal(body.startDate, '2021-06-06');
    assert.equal(body.heroImage, '/hero-keep.jpg');
  } finally {
    await ctx.cleanup();
  }
});
