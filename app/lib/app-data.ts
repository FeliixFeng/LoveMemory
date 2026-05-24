import { prisma } from './prisma.ts';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getDataFilePath } from './env.ts';

export type AppMilestone = {
  id: number | string;
  date: string;
  title: string;
  desc: string;
  icon: string;
};

export type AppPhoto = {
  url: string;
  displayUrl: string;
  thumbUrl: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

export type AppLoveQuote = {
  id: number;
  content: string;
};

export type AppData = {
  startDate: string;
  heroImage: string;
  milestones: AppMilestone[];
  photos: AppPhoto[];
  loveQuotes: AppLoveQuote[];
};

export const DEFAULT_APP_DATA: AppData = {
  startDate: '',
  heroImage: '',
  milestones: [],
  photos: [],
  loveQuotes: [
    { id: 1, content: '余生请多指教' },
    { id: 2, content: '你是我最美丽的意外' },
    { id: 3, content: '每天都是情人节' },
    { id: 4, content: '和你在一起，每天都很特别' },
    { id: 5, content: '你是我最好的选择' }
  ]
};

const dataFile = getDataFilePath();

function normalizeMilestoneId(id: string) {
  return /^\d+$/.test(id) ? Number(id) : id;
}

function normalizePhoto(photo: Partial<AppPhoto> & { url?: string }) {
  const url = photo.url || '';
  const displayUrl = photo.displayUrl || url;
  const thumbUrl = photo.thumbUrl || displayUrl;

  return {
    url,
    displayUrl,
    thumbUrl,
    filename: photo.filename || '',
    mimeType: photo.mimeType || '',
    size: Number(photo.size) || 0,
    uploadedAt: photo.uploadedAt || new Date().toISOString()
  };
}

export async function readAppDataWithPrisma(): Promise<AppData> {
  const [settings, milestones, photos, loveQuotes] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.milestone.findMany({ orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] }),
    prisma.photo.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }] }),
    prisma.loveQuote.findMany({ orderBy: { sortOrder: 'asc' } })
  ]);

  return {
    startDate: settings?.startDate || '',
    heroImage: settings?.heroImage || '',
    milestones: milestones.map((item: any) => ({
      id: normalizeMilestoneId(item.id),
      date: item.date,
      title: item.title,
      desc: item.description,
      icon: item.icon
    })),
    photos: photos.map((item: any) =>
      normalizePhoto({
        url: item.url,
        displayUrl: item.displayUrl,
        thumbUrl: item.thumbUrl,
        filename: item.filename,
        mimeType: item.mimeType,
        size: item.fileSize,
        uploadedAt: item.uploadedAt
      })
    ),
    loveQuotes: loveQuotes.map((item: any) => ({
      id: item.id,
      content: item.content
    }))
  };
}

async function ensureJsonDataFile() {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });

  try {
    await fs.access(dataFile);
    const content = await fs.readFile(dataFile, 'utf-8');
    if (!content.trim()) {
      throw new Error('Empty file');
    }
    JSON.parse(content);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(DEFAULT_APP_DATA, null, 2));
  }
}

export async function readAppDataFromJson(): Promise<AppData> {
  await ensureJsonDataFile();
  const content = await fs.readFile(dataFile, 'utf-8');
  const parsed = JSON.parse(content);

  return {
    ...DEFAULT_APP_DATA,
    ...parsed,
    milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
    photos: Array.isArray(parsed.photos) ? parsed.photos.map((photo: AppPhoto) => normalizePhoto(photo)) : [],
    loveQuotes: Array.isArray(parsed.loveQuotes) ? parsed.loveQuotes : DEFAULT_APP_DATA.loveQuotes
  };
}

export async function writeAppDataToJson(payload: Partial<AppData>): Promise<AppData> {
  const currentData = await readAppDataFromJson();
  const nextData: AppData = {
    ...DEFAULT_APP_DATA,
    ...currentData,
    ...payload,
    milestones: Array.isArray(payload.milestones) ? payload.milestones : currentData.milestones,
    photos: Array.isArray(payload.photos)
      ? payload.photos.map((photo) => normalizePhoto(photo))
      : currentData.photos,
    loveQuotes: Array.isArray(payload.loveQuotes) ? payload.loveQuotes : currentData.loveQuotes
  };

  await fs.writeFile(dataFile, JSON.stringify(nextData, null, 2));
  return nextData;
}

export async function writeAppDataWithPrisma(payload: Partial<AppData>): Promise<AppData> {
  const currentData = await readAppDataWithPrisma();
  const nextData: AppData = {
    ...DEFAULT_APP_DATA,
    ...currentData,
    ...payload,
    photos: Array.isArray(payload.photos)
      ? payload.photos.map((photo) => normalizePhoto(photo))
      : currentData.photos,
    milestones: Array.isArray(payload.milestones)
      ? payload.milestones
      : currentData.milestones,
    loveQuotes: Array.isArray(payload.loveQuotes)
      ? payload.loveQuotes
      : currentData.loveQuotes
  };

  await prisma.$transaction(async (tx: any) => {
    await tx.settings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        startDate: nextData.startDate || '',
        heroImage: nextData.heroImage || ''
      },
      update: {
        startDate: nextData.startDate || '',
        heroImage: nextData.heroImage || ''
      }
    });

    if (Array.isArray(payload.loveQuotes)) {
      const ids = nextData.loveQuotes.map((item) => item.id);

      if (ids.length > 0) {
        await tx.loveQuote.deleteMany({
          where: { id: { notIn: ids } }
        });
      } else {
        await tx.loveQuote.deleteMany();
      }

      for (let i = 0; i < nextData.loveQuotes.length; i++) {
        const quote = nextData.loveQuotes[i];
        await tx.loveQuote.upsert({
          where: { id: quote.id },
          create: {
            id: quote.id,
            content: quote.content,
            sortOrder: i
          },
          update: {
            content: quote.content,
            sortOrder: i
          }
        });
      }
    }

    if (Array.isArray(payload.milestones)) {
      const ids = nextData.milestones.map((item) => String(item.id));

      if (ids.length > 0) {
        await tx.milestone.deleteMany({
          where: { id: { notIn: ids } }
        });
      } else {
        await tx.milestone.deleteMany();
      }

      for (const milestone of nextData.milestones) {
        await tx.milestone.upsert({
          where: { id: String(milestone.id) },
          create: {
            id: String(milestone.id),
            date: milestone.date,
            title: milestone.title,
            description: milestone.desc,
            icon: milestone.icon || 'ph-heart'
          },
          update: {
            date: milestone.date,
            title: milestone.title,
            description: milestone.desc,
            icon: milestone.icon || 'ph-heart'
          }
        });
      }
    }

    if (Array.isArray(payload.photos)) {
      const urls = nextData.photos.map((photo) => photo.url);

      if (urls.length > 0) {
        await tx.photo.deleteMany({
          where: { url: { notIn: urls } }
        });
      } else {
        await tx.photo.deleteMany();
      }

      for (let i = 0; i < nextData.photos.length; i++) {
        const photo = nextData.photos[i];
        const existing = await tx.photo.findFirst({
          where: { url: photo.url },
          select: { id: true }
        });

        if (existing) {
          await tx.photo.update({
            where: { id: existing.id },
            data: {
              displayUrl: photo.displayUrl,
              thumbUrl: photo.thumbUrl,
              filename: photo.filename,
              mimeType: photo.mimeType,
              fileSize: photo.size,
              sortOrder: i,
              uploadedAt: photo.uploadedAt
            }
          });
          continue;
        }

        await tx.photo.create({
          data: {
            url: photo.url,
            displayUrl: photo.displayUrl,
            thumbUrl: photo.thumbUrl,
            filename: photo.filename,
            mimeType: photo.mimeType,
            fileSize: photo.size,
            sortOrder: i,
            uploadedAt: photo.uploadedAt
          }
        });
      }
    }
  });

  return nextData;
}

export async function createPhotoWithPrisma(photo: Partial<AppPhoto> & { url: string }): Promise<AppPhoto> {
  const normalized = normalizePhoto(photo);
  const count = await prisma.photo.count();

  await prisma.photo.create({
    data: {
      url: normalized.url,
      displayUrl: normalized.displayUrl,
      thumbUrl: normalized.thumbUrl,
      filename: normalized.filename,
      mimeType: normalized.mimeType,
      fileSize: normalized.size,
      sortOrder: count,
      uploadedAt: normalized.uploadedAt
    }
  });

  return normalized;
}

export async function deletePhotoWithPrisma(url: string): Promise<void> {
  await prisma.photo.deleteMany({
    where: { url }
  });
}
