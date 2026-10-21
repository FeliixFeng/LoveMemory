import { randomInt } from 'node:crypto';
import fs from 'fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { NextResponse } from 'next/server.js';
import { createPhoto, deletePhoto } from '../../lib/app-data.ts';
import { getUploadDir } from '../../lib/env.ts';
import { checkRequestAuth } from '../../lib/auth.ts';
import { uploadToOss, deleteFromOss, getOssClient } from '../../lib/oss.ts';

const uploadDir = getUploadDir();

function buildFilename(originalName: string) {
  const extension = path.extname(originalName) || '.jpg';
  return `${Date.now()}_${randomInt(1000, 9999)}${extension}`;
}

function buildThumbFilename(filename: string) {
  return `thumbs/${filename}`;
}

async function ensureUploadDir() {
  await fs.mkdir(path.join(uploadDir, 'photos'), { recursive: true });
  await fs.mkdir(path.join(uploadDir, 'thumbs'), { recursive: true });
}

// 服务端兜底：超过 2MB 的 JPEG/WebP 压到长边 2560 / 质量 80
// （客户端 browser-image-compression 已压过，但压缩失败会原样上传，这里保底）
async function capImageSize(buffer: Buffer, mimeType: string): Promise<Buffer> {
  const LIMIT = 2 * 1024 * 1024;
  if (buffer.length <= LIMIT) return buffer;
  const resized = sharp(buffer)
    .rotate()
    .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true });
  if (mimeType === 'image/jpeg') return resized.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  if (mimeType === 'image/webp') return resized.webp({ quality: 80 }).toBuffer();
  return buffer; // PNG/GIF 不重编码（避免改格式）
}

export async function POST(request: Request) {
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    await ensureUploadDir();
    const formData = await request.formData();
    const file = formData.get('image');
    const eventId = typeof formData.get('eventId') === 'string' ? formData.get('eventId') as string : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '请选择要上传的图片' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '仅支持 JPG/PNG/GIF/WEBP 格式的图片' }, { status: 400 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const buffer = await capImageSize(rawBuffer, file.type);
    const filename = buildFilename(file.name);
    const thumbFilename = buildThumbFilename(filename);

    const thumbBuffer = await sharp(buffer)
      .resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    let url: string;
    let thumbUrl: string;

    if (getOssClient()) {
      url = await uploadToOss(`photos/${filename}`, buffer, file.type);
      thumbUrl = await uploadToOss(thumbFilename, thumbBuffer, file.type);
    } else {
      const filePath = path.join(uploadDir, 'photos', filename);
      const thumbPath = path.join(uploadDir, thumbFilename);
      await fs.writeFile(filePath, buffer);
      await fs.writeFile(thumbPath, thumbBuffer);
      url = `/uploads/photos/${filename}`;
      thumbUrl = `/uploads/${thumbFilename}`;
    }

    const displayUrl = url;
    let uploadedPhoto;

    try {
      uploadedPhoto = await createPhoto({
        url,
        displayUrl,
        thumbUrl,
        filename,
        mimeType: file.type,
        size: file.size,
        eventId
      });
    } catch (dbError) {
      console.error('Database save error:', dbError);
      uploadedPhoto = {
        url,
        displayUrl,
        thumbUrl,
        filename,
        mimeType: file.type,
        size: file.size
      };
    }

    return NextResponse.json({
      success: true,
      ...uploadedPhoto
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process uploaded image' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authErr = checkRequestAuth(request);
  if (authErr) return authErr;

  try {
    await ensureUploadDir();
    const { url } = (await request.json()) as { url?: string };
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid photo url' }, { status: 400 });
    }

    const pathname = new URL(url, 'http://placeholder.local').pathname;
    const isLocalUrl = pathname.startsWith('/uploads/');
    const relativePath = isLocalUrl ? pathname.slice('/uploads/'.length) : pathname.slice(1);
    const baseName = path.posix.basename(relativePath);
    const thumbPath = path.posix.join('thumbs', baseName);

    if (isLocalUrl) {
      await fs.unlink(path.join(uploadDir, relativePath)).catch((error) => {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      });
      await fs.unlink(path.join(uploadDir, thumbPath)).catch((error) => {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      });
    } else if (getOssClient()) {
      await deleteFromOss(relativePath);
      await deleteFromOss(thumbPath);
    }

    await deletePhoto(url);

    return NextResponse.json({ success: true, filename: baseName });
  } catch (error) {
    console.error('Delete upload error:', error);
    return NextResponse.json({ error: 'Failed to delete photo file' }, { status: 500 });
  }
}
