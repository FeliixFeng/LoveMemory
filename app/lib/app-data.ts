import { prisma } from './prisma.ts';
import type { Event, Photo, Expense, LoveQuote, Wish, Capsule, AppData } from '../../lib/types.ts';

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

interface PrismaPhoto {
  id: bigint;
  url: string;
  displayUrl: string;
  thumbUrl: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
  uploadedAt: string;
  eventId: string | null;
}

interface PrismaEventWithRelations {
  id: string;
  title: string;
  date: string;
  description: string;
  icon: string;
  location: string;
  mood: string;
  coverPhoto: string;
  sortOrder: number;
  photos: PrismaPhoto[];
  expenses: PrismaExpense[];
}

interface PrismaExpense {
  id: number;
  eventId: string;
  amount: number;
  category: string;
  note: string;
}

interface PrismaSettings {
  startDate: string;
  heroImage: string;
  customCovers: string;
  hiddenDefaultCovers: string;
  countdowns: string;
}

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

function toEvent(item: PrismaEventWithRelations): Event {
  return {
    id: item.id,
    title: item.title,
    date: item.date,
    desc: item.description,
    icon: item.icon,
    location: item.location || '',
    mood: item.mood || '',
    coverPhoto: item.coverPhoto || ''
  };
}

function toPhoto(item: PrismaPhoto, eventId?: string | null): NormalizedPhoto {
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

function toExpense(item: PrismaExpense): Expense {
  return {
    id: item.id,
    eventId: item.eventId,
    amount: item.amount,
    category: item.category,
    note: item.note
  };
}

function toWish(item: { id: number; title: string; description: string; emoji: string; isCompleted: boolean; completedAt: string | null; sortOrder: number }): Wish {
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

function toCapsule(item: { id: number; title: string; content: string; emoji: string; unlockDate: string; isOpened: boolean }): Capsule {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    emoji: item.emoji,
    unlockDate: item.unlockDate,
    isOpened: item.isOpened
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
      include: { photos: true, expenses: true },
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

  const typedEvents = events as unknown as PrismaEventWithRelations[];
  const typedStandalone = standalonePhotos as unknown as PrismaPhoto[];
  const typedSettings = settings as PrismaSettings | null;

  const eventPhotos = typedEvents.flatMap(e => e.photos.map(p => toPhoto(p, e.id)));
  const standalone = typedStandalone.map(p => toPhoto(p));
  const allPhotos = [...eventPhotos, ...standalone];

  const allExpenses = typedEvents.flatMap(e => e.expenses.map(toExpense));

  return {
    startDate: typedSettings?.startDate || '',
    heroImage: typedSettings?.heroImage || '',
    customCovers: parseJsonArray(typedSettings?.customCovers, []),
    hiddenDefaultCovers: parseJsonArray(typedSettings?.hiddenDefaultCovers, []),
    countdowns: parseJsonArray(typedSettings?.countdowns, []),
    events: typedEvents.map(toEvent),
    photos: allPhotos,
    expenses: allExpenses,
    loveQuotes: loveQuotes.map(item => ({ id: item.id, content: item.content })),
    wishes: wishes.map(toWish),
    capsules: capsules.map(toCapsule)
  };
}

// --- Write ---

export async function writeAppData(payload: Partial<AppData>): Promise<AppData> {
  const currentData = await readAppData();
  const nextData: AppData = {
    ...DEFAULT_APP_DATA,
    ...currentData,
    ...payload,
    photos: Array.isArray(payload.photos) ? payload.photos.map(normalizePhoto) : currentData.photos,
    events: Array.isArray(payload.events) ? payload.events : currentData.events,
    expenses: Array.isArray(payload.expenses) ? payload.expenses : currentData.expenses,
    loveQuotes: Array.isArray(payload.loveQuotes) ? payload.loveQuotes : currentData.loveQuotes,
    customCovers: Array.isArray(payload.customCovers) ? payload.customCovers : currentData.customCovers,
    hiddenDefaultCovers: Array.isArray(payload.hiddenDefaultCovers) ? payload.hiddenDefaultCovers : currentData.hiddenDefaultCovers,
    countdowns: Array.isArray(payload.countdowns) ? payload.countdowns : currentData.countdowns,
    wishes: Array.isArray(payload.wishes) ? payload.wishes : currentData.wishes,
    capsules: Array.isArray(payload.capsules) ? payload.capsules : currentData.capsules
  };

  const has = {
    settings: payload.startDate !== undefined || payload.heroImage !== undefined || payload.customCovers !== undefined || payload.hiddenDefaultCovers !== undefined || payload.countdowns !== undefined,
    events: Array.isArray(payload.events) && JSON.stringify(payload.events) !== JSON.stringify(currentData.events),
    photos: Array.isArray(payload.photos) && JSON.stringify(payload.photos) !== JSON.stringify(currentData.photos),
    expenses: Array.isArray(payload.expenses) && JSON.stringify(payload.expenses) !== JSON.stringify(currentData.expenses),
    loveQuotes: Array.isArray(payload.loveQuotes) && JSON.stringify(payload.loveQuotes) !== JSON.stringify(currentData.loveQuotes),
    wishes: Array.isArray(payload.wishes) && JSON.stringify(payload.wishes) !== JSON.stringify(currentData.wishes),
    capsules: Array.isArray(payload.capsules) && JSON.stringify(payload.capsules) !== JSON.stringify(currentData.capsules)
  };

  await prisma.$transaction(async (tx) => {
    if (has.settings) {
      await tx.settings.upsert({
        where: { id: 1 },
        create: { id: 1, startDate: nextData.startDate, heroImage: nextData.heroImage, customCovers: JSON.stringify(nextData.customCovers), hiddenDefaultCovers: JSON.stringify(nextData.hiddenDefaultCovers), countdowns: JSON.stringify(nextData.countdowns) },
        update: { startDate: nextData.startDate, heroImage: nextData.heroImage, customCovers: JSON.stringify(nextData.customCovers), hiddenDefaultCovers: JSON.stringify(nextData.hiddenDefaultCovers), countdowns: JSON.stringify(nextData.countdowns) }
      });
    }

    if (has.loveQuotes) {
      const ids = nextData.loveQuotes.map(q => q.id);
      await tx.loveQuote.deleteMany(ids.length > 0 ? { where: { id: { notIn: ids } } } : undefined);
      for (let i = 0; i < nextData.loveQuotes.length; i++) {
        const q = nextData.loveQuotes[i];
        await tx.loveQuote.upsert({ where: { id: q.id }, create: { id: q.id, content: q.content, sortOrder: i }, update: { content: q.content, sortOrder: i } });
      }
    }

    if (has.events) {
      const ids = nextData.events.map(e => String(e.id));
      await tx.event.deleteMany(ids.length > 0 ? { where: { id: { notIn: ids } } } : undefined);
      for (let i = 0; i < nextData.events.length; i++) {
        const e = nextData.events[i];
        await tx.event.upsert({
          where: { id: String(e.id) },
          create: { id: String(e.id), title: e.title, date: e.date, description: e.desc, icon: e.icon || 'heart', location: e.location || '', mood: e.mood || '', coverPhoto: e.coverPhoto || '', sortOrder: i },
          update: { title: e.title, date: e.date, description: e.desc, icon: e.icon || 'heart', location: e.location || '', mood: e.mood || '', coverPhoto: e.coverPhoto || '', sortOrder: i }
        });
      }
    }

    if (has.expenses) {
      const ids = nextData.expenses.map(e => e.id);
      await tx.expense.deleteMany(ids.length > 0 ? { where: { id: { notIn: ids } } } : undefined);
      for (const exp of nextData.expenses) {
        await tx.expense.upsert({ where: { id: exp.id }, create: { id: exp.id, eventId: exp.eventId, amount: exp.amount, category: exp.category, note: exp.note }, update: { eventId: exp.eventId, amount: exp.amount, category: exp.category, note: exp.note } });
      }
    }

    if (has.photos) {
      const urls = nextData.photos.map(p => p.url);
      await tx.photo.deleteMany(urls.length > 0 ? { where: { url: { notIn: urls } } } : undefined);
      for (let i = 0; i < nextData.photos.length; i++) {
        const photo = normalizePhoto(nextData.photos[i]);
        const existing = await tx.photo.findFirst({ where: { url: photo.url }, select: { id: true } });
        if (existing) {
          await tx.photo.update({ where: { id: existing.id }, data: { displayUrl: photo.displayUrl, thumbUrl: photo.thumbUrl, filename: photo.filename, mimeType: photo.mimeType, fileSize: photo.size, sortOrder: i, uploadedAt: photo.uploadedAt, eventId: photo.eventId || null } });
        } else {
          await tx.photo.create({ data: { url: photo.url, displayUrl: photo.displayUrl, thumbUrl: photo.thumbUrl, filename: photo.filename, mimeType: photo.mimeType, fileSize: photo.size, sortOrder: i, uploadedAt: photo.uploadedAt, eventId: photo.eventId || null } });
        }
      }
    }

    if (has.wishes) {
      const ids = nextData.wishes.map(w => w.id);
      await tx.wish.deleteMany(ids.length > 0 ? { where: { id: { notIn: ids } } } : undefined);
      for (let i = 0; i < nextData.wishes.length; i++) {
        const w = nextData.wishes[i];
        await tx.wish.upsert({ where: { id: w.id }, create: { id: w.id, title: w.title, description: w.description || '', emoji: w.emoji || '💝', isCompleted: w.isCompleted || false, completedAt: w.completedAt || null, sortOrder: i }, update: { title: w.title, description: w.description || '', emoji: w.emoji || '💝', isCompleted: w.isCompleted || false, completedAt: w.completedAt || null, sortOrder: i } });
      }
    }

    if (has.capsules) {
      const ids = nextData.capsules.map(c => c.id);
      await tx.capsule.deleteMany(ids.length > 0 ? { where: { id: { notIn: ids } } } : undefined);
      for (const c of nextData.capsules) {
        await tx.capsule.upsert({ where: { id: c.id }, create: { id: c.id, title: c.title, content: c.content || '', emoji: c.emoji || '💌', unlockDate: c.unlockDate || '', isOpened: c.isOpened || false }, update: { title: c.title, content: c.content || '', emoji: c.emoji || '💌', unlockDate: c.unlockDate || '', isOpened: c.isOpened || false } });
      }
    }
  }, { maxWait: 10000, timeout: 10000 });

  return nextData;
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
      coverPhoto: event.coverPhoto || '', sortOrder: event.sortOrder ?? count
    }
  });

  return {
    id: event.id, title: event.title || '', date: event.date || '', desc: event.desc || '',
    icon: event.icon || 'heart', location: event.location || '', mood: event.mood || '', coverPhoto: event.coverPhoto || ''
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
  return toCapsule(created);
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
  return toCapsule(updated);
}

export async function deleteCapsule(id: number): Promise<void> {
  await prisma.capsule.delete({ where: { id } });
}
