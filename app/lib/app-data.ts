import { prisma } from './prisma.ts';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getDataFilePath } from './env.ts';
import type { Event, Photo, Expense, LoveQuote, AppData } from '../../lib/types.ts';

export type AppEvent = Event;
export type AppPhoto = Photo;
export type AppExpense = Expense;
export type AppLoveQuote = LoveQuote;
export type { AppData };

export const DEFAULT_APP_DATA: AppData = {
  startDate: '',
  heroImage: '',
  events: [],
  photos: [],
  expenses: [],
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
    uploadedAt: photo.uploadedAt || new Date().toISOString(),
    eventId: photo.eventId || null
  };
}

export async function readAppDataWithPrisma(): Promise<AppData> {
  const [settings, events, standalonePhotos, loveQuotes] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.event.findMany({
      include: { photos: true, expenses: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
    }),
    prisma.photo.findMany({
      where: { eventId: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }]
    }),
    prisma.loveQuote.findMany({ orderBy: { sortOrder: 'asc' } })
  ]);

  const eventPhotos = events.flatMap((e: any) => e.photos);
  const allPhotos = [...eventPhotos, ...standalonePhotos].map((item: any) =>
    normalizePhoto({
      url: item.url,
      displayUrl: item.displayUrl,
      thumbUrl: item.thumbUrl,
      filename: item.filename,
      mimeType: item.mimeType,
      size: item.fileSize,
      uploadedAt: item.uploadedAt,
      eventId: item.eventId
    })
  );

  const allExpenses: Expense[] = events.flatMap((e: any) =>
    e.expenses.map((exp: any) => ({
      id: exp.id,
      eventId: exp.eventId,
      amount: exp.amount,
      category: exp.category,
      note: exp.note
    }))
  );

  return {
    startDate: settings?.startDate || '',
    heroImage: settings?.heroImage || '',
    events: events.map((item: any) => ({
      id: normalizeMilestoneId(item.id),
      title: item.title,
      date: item.date,
      desc: item.description,
      icon: item.icon,
      location: item.location || '',
      mood: item.mood || '',
      coverPhoto: item.coverPhoto || ''
    })),
    photos: allPhotos,
    expenses: allExpenses,
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

function migrateLegacyData(parsed: any): AppData {
  const events = Array.isArray(parsed.events)
    ? parsed.events
    : Array.isArray(parsed.milestones)
      ? parsed.milestones.map((m: any) => ({
          ...m,
          location: m.location || '',
          mood: m.mood || '',
          coverPhoto: m.coverPhoto || ''
        }))
      : [];

  return {
    ...DEFAULT_APP_DATA,
    ...parsed,
    events,
    photos: Array.isArray(parsed.photos) ? parsed.photos.map((photo: Photo) => normalizePhoto(photo)) : [],
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    loveQuotes: Array.isArray(parsed.loveQuotes) ? parsed.loveQuotes : DEFAULT_APP_DATA.loveQuotes
  };
}

export async function readAppDataFromJson(): Promise<AppData> {
  await ensureJsonDataFile();
  const content = await fs.readFile(dataFile, 'utf-8');
  const parsed = JSON.parse(content);

  return migrateLegacyData(parsed);
}

export async function writeAppDataToJson(payload: Partial<AppData>): Promise<AppData> {
  const currentData = await readAppDataFromJson();
  const nextData: AppData = {
    ...DEFAULT_APP_DATA,
    ...currentData,
    ...payload,
    events: Array.isArray(payload.events) ? payload.events : currentData.events,
    photos: Array.isArray(payload.photos)
      ? payload.photos.map((photo) => normalizePhoto(photo))
      : currentData.photos,
    expenses: Array.isArray(payload.expenses) ? payload.expenses : currentData.expenses,
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
    events: Array.isArray(payload.events)
      ? payload.events
      : currentData.events,
    expenses: Array.isArray(payload.expenses)
      ? payload.expenses
      : currentData.expenses,
    loveQuotes: Array.isArray(payload.loveQuotes) ? payload.loveQuotes : currentData.loveQuotes
  };

  const hasSettingsChange = payload.startDate !== undefined || payload.heroImage !== undefined;
  const hasEventsChange = Array.isArray(payload.events) && JSON.stringify(payload.events) !== JSON.stringify(currentData.events);
  const hasPhotosChange = Array.isArray(payload.photos) && JSON.stringify(payload.photos) !== JSON.stringify(currentData.photos);
  const hasExpensesChange = Array.isArray(payload.expenses) && JSON.stringify(payload.expenses) !== JSON.stringify(currentData.expenses);
  const hasLoveQuotesChange = Array.isArray(payload.loveQuotes) && JSON.stringify(payload.loveQuotes) !== JSON.stringify(currentData.loveQuotes);

  await prisma.$transaction(async (tx: any) => {
    if (hasSettingsChange) {
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
    }

    if (hasLoveQuotesChange) {
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

    if (hasEventsChange) {
      const ids = nextData.events.map((item) => String(item.id));

      if (ids.length > 0) {
        await tx.event.deleteMany({
          where: { id: { notIn: ids } }
        });
      } else {
        await tx.event.deleteMany();
      }

      for (let i = 0; i < nextData.events.length; i++) {
        const event = nextData.events[i];
        await tx.event.upsert({
          where: { id: String(event.id) },
          create: {
            id: String(event.id),
            title: event.title,
            date: event.date,
            description: event.desc,
            icon: event.icon || 'heart',
            location: event.location || '',
            mood: event.mood || '',
            coverPhoto: event.coverPhoto || '',
            sortOrder: i
          },
          update: {
            title: event.title,
            date: event.date,
            description: event.desc,
            icon: event.icon || 'heart',
            location: event.location || '',
            mood: event.mood || '',
            coverPhoto: event.coverPhoto || '',
            sortOrder: i
          }
        });
      }
    }

    if (hasExpensesChange) {
      const ids = nextData.expenses.map((item) => item.id);

      if (ids.length > 0) {
        await tx.expense.deleteMany({
          where: { id: { notIn: ids } }
        });
      } else {
        await tx.expense.deleteMany();
      }

      for (const expense of nextData.expenses) {
        await tx.expense.upsert({
          where: { id: expense.id },
          create: {
            id: expense.id,
            eventId: expense.eventId,
            amount: expense.amount,
            category: expense.category,
            note: expense.note
          },
          update: {
            eventId: expense.eventId,
            amount: expense.amount,
            category: expense.category,
            note: expense.note
          }
        });
      }
    }

    if (hasPhotosChange) {
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
              uploadedAt: photo.uploadedAt,
              eventId: photo.eventId || null
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
            uploadedAt: photo.uploadedAt,
            eventId: photo.eventId || null
          }
        });
      }
    }
  }, {
    maxWait: 10000,
    timeout: 10000
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
      uploadedAt: normalized.uploadedAt,
      eventId: normalized.eventId || null
    }
  });

  return normalized;
}

export async function deletePhotoWithPrisma(url: string): Promise<void> {
  await prisma.photo.deleteMany({
    where: { url }
  });
}

export async function createEventWithPrisma(event: Partial<Event> & { id: string }): Promise<Event> {
  const count = await prisma.event.count();

  await prisma.event.create({
    data: {
      id: event.id,
      title: event.title || '',
      date: event.date || '',
      description: event.desc || '',
      icon: event.icon || 'heart',
      location: event.location || '',
      mood: event.mood || '',
      coverPhoto: event.coverPhoto || '',
      sortOrder: event.sortOrder ?? count
    }
  });

  return {
    id: event.id,
    title: event.title || '',
    date: event.date || '',
    desc: event.desc || '',
    icon: event.icon || 'heart',
    location: event.location || '',
    mood: event.mood || '',
    coverPhoto: event.coverPhoto || ''
  };
}

export async function updateEventWithPrisma(id: string, data: Partial<Event>): Promise<void> {
  await prisma.event.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.date !== undefined && { date: data.date }),
      ...(data.desc !== undefined && { description: data.desc }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.mood !== undefined && { mood: data.mood }),
      ...(data.coverPhoto !== undefined && { coverPhoto: data.coverPhoto })
    }
  });
}

export async function deleteEventWithPrisma(id: string): Promise<void> {
  await prisma.event.delete({
    where: { id }
  });
}

export async function addExpenseWithPrisma(expense: Omit<Expense, 'id'>): Promise<Expense> {
  const created = await prisma.expense.create({
    data: {
      eventId: expense.eventId,
      amount: expense.amount,
      category: expense.category,
      note: expense.note
    }
  });

  return {
    id: created.id,
    eventId: created.eventId,
    amount: created.amount,
    category: created.category,
    note: created.note
  };
}

export async function deleteExpenseWithPrisma(id: number): Promise<void> {
  await prisma.expense.delete({
    where: { id }
  });
}
