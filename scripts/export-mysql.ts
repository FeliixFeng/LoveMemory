/**
 * Export MySQL data to JSON backup
 *
 * Usage:
 *   1. Set DATABASE_URL to your MySQL connection string
 *   2. Run: npx tsx scripts/export-mysql.ts
 *   3. Output: data/backup.json
 *
 * This script reads all data from MySQL and exports it to a JSON file
 * that can be imported into SQLite using migrate-to-sqlite.ts.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Reading data from MySQL...');

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

    const eventPhotos = events.flatMap((e: any) => e.photos);
    const allPhotos = [...eventPhotos, ...standalonePhotos].map((item: any) => ({
      url: item.url,
      displayUrl: item.displayUrl,
      thumbUrl: item.thumbUrl,
      filename: item.filename,
      mimeType: item.mimeType,
      size: item.fileSize,
      uploadedAt: item.uploadedAt,
      eventId: item.eventId
    }));

    const allExpenses = events.flatMap((e: any) =>
      e.expenses.map((exp: any) => ({
        id: exp.id,
        eventId: exp.eventId,
        amount: exp.amount,
        category: exp.category,
        note: exp.note
      }))
    );

    const backupData = {
      startDate: settings?.startDate || '',
      heroImage: settings?.heroImage || '',
      customCovers: settings?.customCovers ? JSON.parse(settings.customCovers) : [],
      hiddenDefaultCovers: settings?.hiddenDefaultCovers ? JSON.parse(settings.hiddenDefaultCovers) : [],
      countdowns: settings?.countdowns ? JSON.parse(settings.countdowns) : [],
      events: events.map((item: any) => ({
        id: item.id,
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
      })),
      wishes: wishes.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        emoji: item.emoji,
        isCompleted: item.isCompleted,
        completedAt: item.completedAt,
        sortOrder: item.sortOrder
      })),
      capsules: capsules.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        emoji: item.emoji,
        unlockDate: item.unlockDate,
        isOpened: item.isOpened
      }))
    };

    const backupPath = path.join(process.cwd(), 'data', 'backup.json');
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    console.log(`\n✅ Export complete! Backup saved to: ${backupPath}`);
    console.log(`\nData summary:`);
    console.log(`  Events: ${backupData.events.length}`);
    console.log(`  Photos: ${backupData.photos.length}`);
    console.log(`  Expenses: ${backupData.expenses.length}`);
    console.log(`  Love Quotes: ${backupData.loveQuotes.length}`);
    console.log(`  Wishes: ${backupData.wishes.length}`);
    console.log(`  Capsules: ${backupData.capsules.length}`);

  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
