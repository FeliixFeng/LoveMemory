import { randomInt } from 'node:crypto';
import fs from 'fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { NextResponse } from 'next/server';
import env from '../../../src/config/env.js';

const uploadDir = env.UPLOAD_DIR || path.join(process.cwd(), 'public/uploads');

function buildFilename(originalName: string) {
  const extension = path.extname(originalName) || '.jpg';
  return `${Date.now()}_${randomInt(1000, 9999)}${extension}`;
}

function buildThumbFilename(filename: string) {
  const extension = path.extname(filename);
  const name = filename.slice(0, filename.length - extension.length);
  return `${name}_thumb${extension}`;
}

async function ensureUploadDir() {
  await fs.mkdir(uploadDir, { recursive: true });
}

export async function POST(request: Request) {
  try {
    await ensureUploadDir();
    const formData = await request.formData();
    const file = formData.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '请选择要上传的图片' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '仅支持 JPG/PNG/GIF/WEBP 格式的图片' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = buildFilename(file.name);
    const filePath = path.join(uploadDir, filename);
    const thumbFilename = buildThumbFilename(filename);
    const thumbPath = path.join(uploadDir, thumbFilename);

    await fs.writeFile(filePath, buffer);
    await sharp(buffer)
      .resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true })
      .toFile(thumbPath);

    const url = `/uploads/${filename}`;
    const displayUrl = url;
    const thumbUrl = `/uploads/${thumbFilename}`;

    return NextResponse.json({
      success: true,
      url,
      displayUrl,
      thumbUrl,
      filename,
      mimeType: file.type,
      size: file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process uploaded image' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureUploadDir();
    const { url } = (await request.json()) as { url?: string };
    if (!url || typeof url !== 'string' || !url.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'Invalid photo url' }, { status: 400 });
    }

    const filename = path.basename(url);
    const filePath = path.join(uploadDir, filename);
    const thumbPath = path.join(uploadDir, buildThumbFilename(filename));

    await fs.unlink(filePath).catch((error) => {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    });
    await fs.unlink(thumbPath).catch((error) => {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    });

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error('Delete upload error:', error);
    return NextResponse.json({ error: 'Failed to delete photo file' }, { status: 500 });
  }
}
