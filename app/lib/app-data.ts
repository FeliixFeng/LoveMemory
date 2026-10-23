import type { Prisma } from '@prisma/client';
import { prisma } from './prisma.ts';
import type { Event, Photo, Expense, LoveQuote, Wish, Capsule, AppData } from '../../lib/types.ts';
import type { SettingsPatch } from './schemas.ts';

export type { AppData };

export const DEFAULT_APP_DATA: AppData = {
  startDate: '',
  heroImage: '',
  customCovers: [],
  hiddenDefaultCovers: [],
  events: [],
  photos: [],
  expenses: [],
  loveQuotes: [
    { id: 1, content: '余生请多指教' },
    { id: 2, content: '你是我最美丽的意外' },
    { id: 3, content: '每天都是情人节' },
    { id: 4, content: '和你在一起，每天都很特别' },
    { id: 5, content: '你是我最好的选择' }
  ],
  countdowns: [],
  wishes: [],
  capsules: []
};

// --- Prisma result types ---

type EventWithRelations = Prisma.EventGetPayload<{ include: { photos: true; expenses: true } }>;
type PhotoRow = Prisma.PhotoGetPayload<{}>;
type ExpenseRow = Prisma.ExpenseGetPayload<{}>;
type WishRow = Prisma.WishGetPayload<{}>;
type CapsuleRow = Prisma.CapsuleGetPayload<{}>;

// --- Helpers ---

interface NormalizedPhoto {
  url: string;
  displayUrl: string;
  thumbUrl: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  eventId: string | null;
}

function normalizePhoto(photo: Partial<Photo> & { url?: string }): NormalizedPhoto {
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

function toEvent(item: EventWithRelations): Event {
  return {
    id: item.id,
    title: item.title,
    date: item.date,
    desc: item.description,
    icon: item.icon,
    location: item.location || '',
    mood: item.mood || '',
    coverPhoto: item.coverPhoto || '',
    wishId: item.wishId ?? null,
    capsuleId: item.capsuleId ?? null
  };
}

function toPhoto(item: PhotoRow, eventId?: string | null): NormalizedPhoto {
  return normalizePhoto({
    url: item.url,
    displayUrl: item.displayUrl,
    thumbUrl: item.thumbUrl,
    filename: item.filename,
    mimeType: item.mimeType,
    size: item.fileSize,
    uploadedAt: item.uploadedAt,
    eventId: eventId ?? item.eventId
  });
}

function toExpense(item: ExpenseRow): Expense {
  return {
    id: item.id,
    eventId: item.eventId,
    amount: item.amount,
    category: item.category,
    note: item.note
  };
}

function toWish(item: WishRow): Wish {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    emoji: item.emoji,
    isCompleted: item.isCompleted,
    completedAt: item.completedAt,
    sortOrder: item.sortOrder
  };
}

/* 未到解锁日，正文根本不下发 —— 以前只是前端用日期把字遮住，
   F12 里 content 一览无余，而「封存」本该是服务端的事。 */
function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toCapsule(item: CapsuleRow, today: string): Capsule {
  const locked = !!item.unlockDate && item.unlockDate > today;
  return {
    id: item.id,
    title: item.title,
    content: locked ? '' : item.content,
    emoji: item.emoji,
    unlockDate: item.unlockDate,
    isOpened: item.isOpened,
    locked
  };
}

function parseJsonArray<T>(json: string | null | undefined, fallback: T[]): T[] {
  if (!json) return fallback;
  try { return JSON.parse(json); } catch { return fallback; }
}

// --- Read ---

export async function readAppData(): Promise<AppData> {
  const [settings, events, standalonePhotos, loveQuotes, wishes, capsules] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.event.findMany({
      include: { photos: { orderBy: { sortOrder: 'asc' } }, expenses: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }]
    }),
    prisma.photo.findMany({
      where: { eventId: null },
      orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }]
    }),
    prisma.loveQuote.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.wish.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] }),
    prisma.capsule.findMany({ orderBy: { createdAt: 'desc' } })
  ]);

  const eventPhotos = events.flatMap(e => e.photos.map(p => toPhoto(p, e.id)));
  const standalone = standalonePhotos.map(p => toPhoto(p));
  const allPhotos = [...eventPhotos, ...standalone];

  const allExpenses = events.flatMap(e => e.expenses.map(toExpense));

  return {
    startDate: settings?.startDate || '',
    heroImage: settings?.heroImage || '',
    customCovers: parseJsonArray(settings?.customCovers, []),
    hiddenDefaultCovers: parseJsonArray(settings?.hiddenDefaultCovers, []),
    countdowns: parseJsonArray(settings?.countdowns, []),
    events: events.map(toEvent),
    photos: allPhotos,
    expenses: allExpenses,
    loveQuotes: loveQuotes.map(item => ({ id: item.id, content: item.content })),
    wishes: wishes.map(toWish),
    capsules: capsules.map(c => toCapsule(c, todayStr()))
  };
}

// --- Write ---

export async function writeSettings(patch: SettingsPatch): Promise<void> {
  const settingsData: Prisma.SettingsUpdateInput = {};
  if (patch.startDate !== undefined) settingsData.startDate = patch.startDate;
  if (patch.heroImage !== undefined) settingsData.heroImage = patch.heroImage;
  if (patch.customCovers !== undefined) settingsData.customCovers = JSON.stringify(patch.customCovers);
  if (patch.hiddenDefaultCovers !== undefined) settingsData.hiddenDefaultCovers = JSON.stringify(patch.hiddenDefaultCovers);
  if (patch.countdowns !== undefined) settingsData.countdowns = JSON.stringify(patch.countdowns);

  const hasSettingsPatch = Object.keys(settingsData).length > 0;
  if (!hasSettingsPatch && patch.loveQuotes === undefined) return;

  await prisma.$transaction(async (tx) => {
    if (hasSettingsPatch) {
      await tx.settings.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          startDate: patch.startDate || '',
          heroImage: patch.heroImage || '',
          customCovers: JSON.stringify(patch.customCovers || []),
          hiddenDefaultCovers: JSON.stringify(patch.hiddenDefaultCovers || []),
          countdowns: JSON.stringify(patch.countdowns || [])
        },
        update: settingsData
      });
    }

    if (patch.loveQuotes !== undefined) {
      const ids = patch.loveQuotes.map(q => q.id);
      await tx.loveQuote.deleteMany({ where: ids.length > 0 ? { id: { notIn: ids } } : {} });
      for (let i = 0; i < patch.loveQuotes.length; i++) {
        const q = patch.loveQuotes[i];
        await tx.loveQuote.upsert({
          where: { id: q.id },
          create: { id: q.id, content: q.content, sortOrder: i },
          update: { content: q.content, sortOrder: i }
        });
      }
    }
  }, { maxWait: 10000, timeout: 10000 });
}

export async function updatePhotoOrder(eventId: string, urls: string[]): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const owned = await tx.photo.findMany({
      where: { eventId, url: { in: urls } },
      select: { url: true }
    });
    const ownedUrls = new Set(owned.map(p => p.url));
    const ordered = urls.filter(u => ownedUrls.has(u));

    for (let i = 0; i < ordered.length; i++) {
      await tx.photo.updateMany({ where: { url: ordered[i], eventId }, data: { sortOrder: i } });
    }
    return ordered.length;
  }, { maxWait: 10000, timeout: 10000 });
}

// --- Photo CRUD ---

export async function createPhoto(photo: Partial<Photo> & { url: string }): Promise<Photo> {
  const normalized = normalizePhoto(photo);
  const count = await prisma.photo.count();

  await prisma.photo.create({
    data: {
      url: normalized.url, displayUrl: normalized.displayUrl, thumbUrl: normalized.thumbUrl,
      filename: normalized.filename, mimeType: normalized.mimeType, fileSize: normalized.size,
      sortOrder: count, uploadedAt: normalized.uploadedAt, eventId: normalized.eventId || null
    }
  });

  return normalized;
}

export async function deletePhoto(url: string): Promise<void> {
  await prisma.photo.deleteMany({ where: { url } });
}

// --- Event CRUD ---

export async function createEvent(event: Partial<Event> & { id: string }): Promise<Event> {
  const count = await prisma.event.count();

  await prisma.event.create({
    data: {
      id: event.id, title: event.title || '', date: event.date || '', description: event.desc || '',
      icon: event.icon || 'heart', location: event.location || '', mood: event.mood || '',
      coverPhoto: event.coverPhoto || '', sortOrder: event.sortOrder ?? count,
      wishId: event.wishId ?? null,
      capsuleId: event.capsuleId ?? null
    }
  });

  return {
    id: event.id, title: event.title || '', date: event.date || '', desc: event.desc || '',
    icon: event.icon || 'heart', location: event.location || '', mood: event.mood || '',
    coverPhoto: event.coverPhoto || '',
    wishId: event.wishId ?? null,
    capsuleId: event.capsuleId ?? null
  };
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<void> {
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

export async function deleteEvent(id: string): Promise<void> {
  await prisma.event.delete({ where: { id } });
}

// --- Expense CRUD ---

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
  const created = await prisma.expense.create({
    data: { eventId: expense.eventId, amount: expense.amount, category: expense.category, note: expense.note }
  });
  return { id: created.id, eventId: created.eventId, amount: created.amount, category: created.category, note: created.note };
}

export async function deleteExpense(id: number): Promise<void> {
  await prisma.expense.delete({ where: { id } });
}

// --- Wish CRUD ---

export async function createWish(data: { title: string; description?: string; emoji?: string }): Promise<Wish> {
  const count = await prisma.wish.count();
  const created = await prisma.wish.create({
    data: { title: data.title, description: data.description || '', emoji: data.emoji || '💝', sortOrder: count }
  });
  return toWish(created);
}

export async function updateWish(id: number, data: Partial<Wish>): Promise<Wish> {
  const updated = await prisma.wish.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.emoji !== undefined && { emoji: data.emoji }),
      ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt })
    }
  });
  return toWish(updated);
}

export async function deleteWish(id: number): Promise<void> {
  await prisma.wish.delete({ where: { id } });
}

// --- Capsule CRUD ---

export async function createCapsule(data: { title: string; content?: string; emoji?: string; unlockDate?: string }): Promise<Capsule> {
  const created = await prisma.capsule.create({
    data: { title: data.title, content: data.content || '', emoji: data.emoji || '💌', unlockDate: data.unlockDate || '' }
  });
  return toCapsule(created, todayStr());
}

export async function updateCapsule(id: number, data: Partial<Capsule>): Promise<Capsule> {
  const updated = await prisma.capsule.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.emoji !== undefined && { emoji: data.emoji }),
      ...(data.unlockDate !== undefined && { unlockDate: data.unlockDate }),
      ...(data.isOpened !== undefined && { isOpened: data.isOpened })
    }
  });
  return toCapsule(updated, todayStr());
}

export async function deleteCapsule(id: number): Promise<void> {
  await prisma.capsule.delete({ where: { id } });
}
