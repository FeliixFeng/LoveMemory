import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9WQAAAAASUVORK5CYII=';
const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'lovememory-test-'));
const dataFile = path.join(testRoot, 'db.json');
const uploadDir = path.join(testRoot, 'uploads');

await fs.mkdir(uploadDir, { recursive: true });

process.env.NODE_ENV = 'test';
process.env.STORAGE_DRIVER = 'json';
process.env.DATA_FILE = dataFile;
process.env.UPLOAD_DIR = uploadDir;
process.env.PORT = '0';

const appModuleUrl = new URL(`../src/app.js?test=${Date.now()}`, import.meta.url);
const { startServer } = await import(appModuleUrl);

async function createTestServer() {
  await fs.rm(dataFile, { force: true });
  await fs.mkdir(uploadDir, { recursive: true });
  const server = startServer(0);

  await new Promise((resolve) => server.once('listening', resolve));

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    dataFile,
    uploadDir,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      await fs.rm(dataFile, { force: true });
      await fs.rm(uploadDir, { recursive: true, force: true });
    }
  };
}

test('GET /api/data returns default payload for a fresh data file', async () => {
  const ctx = await createTestServer();

  try {
    const response = await fetch(`${ctx.baseUrl}/api/data`);
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(data, {
      startDate: '',
      heroImage: '',
      milestones: [],
      photos: []
    });
  } finally {
    await ctx.close();
  }
});

test('POST /api/data merges updates without losing untouched fields', async () => {
  const ctx = await createTestServer();

  try {
    const initialPayload = {
      startDate: '2020-01-01',
      heroImage: '/hero.jpg',
      milestones: [{ id: 1, date: '2020-01-02', title: 'First Date', desc: 'Cafe', icon: 'ph-heart' }],
      photos: [{ url: '/uploads/test.jpg', uploadedAt: '2026-03-19T00:00:00.000Z' }]
    };

    await fetch(`${ctx.baseUrl}/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialPayload)
    });

    const response = await fetch(`${ctx.baseUrl}/api/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heroImage: '/updated-hero.jpg' })
    });
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.data.startDate, '2020-01-01');
    assert.equal(result.data.heroImage, '/updated-hero.jpg');
    assert.equal(result.data.milestones.length, 1);
    assert.equal(result.data.photos.length, 1);
  } finally {
    await ctx.close();
  }
});

test('upload and delete endpoints manage files and metadata', async () => {
  const ctx = await createTestServer();

  try {
    const formData = new FormData();
    const buffer = Buffer.from(PNG_BASE64, 'base64');
    formData.append('image', new Blob([buffer], { type: 'image/png' }), 'tiny.png');

    const uploadResponse = await fetch(`${ctx.baseUrl}/api/upload`, {
      method: 'POST',
      body: formData
    });
    const uploadData = await uploadResponse.json();

    assert.equal(uploadResponse.status, 200);
    assert.equal(uploadData.success, true);
    assert.equal(uploadData.mimeType, 'image/png');
    assert.equal(uploadData.size > 0, true);

    const uploadedFile = path.join(ctx.uploadDir, uploadData.filename);
    await fs.access(uploadedFile);

    const deleteResponse = await fetch(`${ctx.baseUrl}/api/upload`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: uploadData.url })
    });
    const deleteData = await deleteResponse.json();

    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteData.success, true);
    await assert.rejects(() => fs.access(uploadedFile));
  } finally {
    await ctx.close();
  }
});
