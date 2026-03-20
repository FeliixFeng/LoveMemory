import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9WQAAAAASUVORK5CYII=';
const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lovememory-next-test-'));
const dataFile = path.join(rootDir, 'db.json');
const uploadDir = path.join(rootDir, 'uploads');

await fs.mkdir(uploadDir, { recursive: true });

process.env.NODE_ENV = 'test';
process.env.STORAGE_DRIVER = 'json';
process.env.DATA_FILE = dataFile;
process.env.UPLOAD_DIR = uploadDir;

const salt = `${Date.now()}-${Math.random()}`;
const dataRoute = await import(new URL(`../app/api/data/route.ts?${salt}`, import.meta.url).href);
const uploadRoute = await import(new URL(`../app/api/upload/route.ts?${salt}`, import.meta.url).href);
const healthRoute = await import(new URL(`../app/api/health/route.ts?${salt}`, import.meta.url).href);

async function createTestContext() {
  await fs.rm(dataFile, { force: true });
  await fs.rm(uploadDir, { recursive: true, force: true });
  await fs.mkdir(uploadDir, { recursive: true });

  return {
    dataFile,
    uploadDir,
    dataRoute,
    uploadRoute,
    healthRoute,
    async cleanup() {
      await fs.rm(dataFile, { force: true });
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
    assert.equal(body.storageDriver, 'json');
  } finally {
    await ctx.cleanup();
  }
});

test('GET /api/data returns default payload for a fresh data file', async () => {
  const ctx = await createTestContext();

  try {
    const response = await ctx.dataRoute.GET();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, {
      startDate: '',
      heroImage: '',
      milestones: [],
      photos: []
    });
  } finally {
    await ctx.cleanup();
  }
});

test('POST /api/data merges updates without losing untouched fields', async () => {
  const ctx = await createTestContext();

  try {
    const initialPayload = {
      startDate: '2020-01-01',
      heroImage: '/hero.jpg',
      milestones: [{ id: 1, date: '2020-01-02', title: 'First Date', desc: 'Cafe', icon: 'ph-heart' }],
      photos: [{ url: '/uploads/test.jpg', displayUrl: '/uploads/test.jpg', thumbUrl: '/uploads/test.jpg', uploadedAt: '2026-03-19T00:00:00.000Z' }]
    };

    await ctx.dataRoute.POST(
      new Request('http://localhost/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialPayload)
      })
    );

    const response = await ctx.dataRoute.POST(
      new Request('http://localhost/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroImage: '/updated-hero.jpg' })
      })
    );
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.startDate, '2020-01-01');
    assert.equal(body.data.heroImage, '/updated-hero.jpg');
    assert.equal(body.data.milestones.length, 1);
    assert.equal(body.data.photos.length, 1);
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
