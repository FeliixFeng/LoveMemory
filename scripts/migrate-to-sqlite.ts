/**
 * Migration script: JSON backup → SQLite
 *
 * Usage:
 *   1. First, export your MySQL data to data/backup.json:
 *      - Temporarily set STORAGE_DRIVER=json in your .env
 *      - Start the app, it will read from MySQL and write to JSON
 *      - Copy data/db.json to data/backup.json
 *      - Or use the export step below
 *
 *   2. Run this script to import into SQLite:
 *      npx tsx scripts/migrate-to-sqlite.ts [path-to-backup.json]
 *
 *   Default backup path: data/backup.json
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const backupPath = process.argv[2] || path.join(process.cwd(), 'data', 'backup.json');

async function main() {
  console.log(`Reading backup from: ${backupPath}`);

  let backupData;
  try {
    const content = await fs.readFile(backupPath, 'utf-8');
    backupData = JSON.parse(content);
  } catch (error) {
    console.error(`Failed to read backup file: ${backupPath}`);
    console.error('Make sure the file exists. Run with: npx tsx scripts/migrate-to-sqlite.ts <path>');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // Ensure database tables exist
    console.log('Creating database tables...');
    await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL');

    // Import Settings
    console.log('Importing settings...');
    await prisma.settings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        startDate: backupData.startDate || '',
        heroImage: backupData.heroImage || '',
        customCovers: JSON.stringify(backupData.customCovers || []),
        hiddenDefaultCovers: JSON.stringify(backupData.hiddenDefaultCovers || []),
        countdowns: JSON.stringify(backupData.countdowns || [])
      },
      update: {
        startDate: backupData.startDate || '',
        heroImage: backupData.heroImage || '',
        customCovers: JSON.stringify(backupData.customCovers || []),
        hiddenDefaultCovers: JSON.stringify(backupData.hiddenDefaultCovers || []),
        countdowns: JSON.stringify(backupData.countdowns || [])
      }
    });

    // Import Love Quotes
    if (Array.isArray(backupData.loveQuotes)) {
      console.log(`Importing ${backupData.loveQuotes.length} love quotes...`);
      for (let i = 0; i < backupData.loveQuotes.length; i++) {
        const quote = backupData.loveQuotes[i];
        await prisma.loveQuote.upsert({
          where: { id: quote.id },
          create: { id: quote.id, content: quote.content, sortOrder: i },
          update: { content: quote.content, sortOrder: i }
        });
      }
    }

    // Import Events
    if (Array.isArray(backupData.events)) {
      console.log(`Importing ${backupData.events.length} events...`);
      for (let i = 0; i < backupData.events.length; i++) {
        const event = backupData.events[i];
        await prisma.event.upsert({
          where: { id: String(event.id) },
          create: {
            id: String(event.id),
            title: event.title || '',
            date: event.date || '',
            description: event.desc || '',
            icon: event.icon || 'heart',
            location: event.location || '',
            mood: event.mood || '',
            coverPhoto: event.coverPhoto || '',
            sortOrder: i
          },
          update: {
            title: event.title || '',
            date: event.date || '',
            description: event.desc || '',
            icon: event.icon || 'heart',
            location: event.location || '',
            mood: event.mood || '',
            coverPhoto: event.coverPhoto || '',
            sortOrder: i
          }
        });
      }
    }

    // Import Photos
    if (Array.isArray(backupData.photos)) {
      console.log(`Importing ${backupData.photos.length} photos...`);
      for (let i = 0; i < backupData.photos.length; i++) {
        const photo = backupData.photos[i];
        const existing = await prisma.photo.findFirst({
          where: { url: photo.url },
          select: { id: true }
        });

        if (existing) {
          await prisma.photo.update({
            where: { id: existing.id },
            data: {
              displayUrl: photo.displayUrl || photo.url,
              thumbUrl: photo.thumbUrl || photo.displayUrl || photo.url,
              filename: photo.filename || '',
              mimeType: photo.mimeType || '',
              fileSize: photo.size || 0,
              sortOrder: i,
              uploadedAt: photo.uploadedAt || new Date().toISOString(),
              eventId: photo.eventId || null
            }
          });
        } else {
          await prisma.photo.create({
            data: {
              url: photo.url,
              displayUrl: photo.displayUrl || photo.url,
              thumbUrl: photo.thumbUrl || photo.displayUrl || photo.url,
              filename: photo.filename || '',
              mimeType: photo.mimeType || '',
              fileSize: photo.size || 0,
              sortOrder: i,
              uploadedAt: photo.uploadedAt || new Date().toISOString(),
              eventId: photo.eventId || null
            }
          });
        }
      }
    }

    // Import Expenses
    if (Array.isArray(backupData.expenses)) {
      console.log(`Importing ${backupData.expenses.length} expenses...`);
      for (const expense of backupData.expenses) {
        await prisma.expense.upsert({
          where: { id: expense.id },
          create: {
            id: expense.id,
            eventId: expense.eventId,
            amount: expense.amount,
            category: expense.category || '',
            note: expense.note || ''
          },
          update: {
            eventId: expense.eventId,
            amount: expense.amount,
            category: expense.category || '',
            note: expense.note || ''
          }
        });
      }
    }

    // Import Wishes
    if (Array.isArray(backupData.wishes)) {
      console.log(`Importing ${backupData.wishes.length} wishes...`);
      for (let i = 0; i < backupData.wishes.length; i++) {
        const wish = backupData.wishes[i];
        await prisma.wish.upsert({
          where: { id: wish.id },
          create: {
            id: wish.id,
            title: wish.title || '',
            description: wish.description || '',
            emoji: wish.emoji || '💝',
            isCompleted: wish.isCompleted || false,
            completedAt: wish.completedAt || null,
            sortOrder: i
          },
          update: {
            title: wish.title || '',
            description: wish.description || '',
            emoji: wish.emoji || '💝',
            isCompleted: wish.isCompleted || false,
            completedAt: wish.completedAt || null,
            sortOrder: i
          }
        });
      }
    }

    // Import Capsules
    if (Array.isArray(backupData.capsules)) {
      console.log(`Importing ${backupData.capsules.length} capsules...`);
      for (const capsule of backupData.capsules) {
        await prisma.capsule.upsert({
          where: { id: capsule.id },
          create: {
            id: capsule.id,
            title: capsule.title || '',
            content: capsule.content || '',
            emoji: capsule.emoji || '💌',
            unlockDate: capsule.unlockDate || '',
            isOpened: capsule.isOpened || false
          },
          update: {
            title: capsule.title || '',
            content: capsule.content || '',
            emoji: capsule.emoji || '💌',
            unlockDate: capsule.unlockDate || '',
            isOpened: capsule.isOpened || false
          }
        });
      }
    }

    // Verify counts
    const counts = await prisma.$transaction([
      prisma.settings.count(),
      prisma.event.count(),
      prisma.photo.count(),
      prisma.expense.count(),
      prisma.loveQuote.count(),
      prisma.wish.count(),
      prisma.capsule.count()
    ]);

    console.log('\n✅ Migration complete!');
    console.log('Database counts:');
    console.log(`  Settings: ${counts[0]}`);
    console.log(`  Events: ${counts[1]} (expected: ${backupData.events?.length || 0})`);
    console.log(`  Photos: ${counts[2]} (expected: ${backupData.photos?.length || 0})`);
    console.log(`  Expenses: ${counts[3]} (expected: ${backupData.expenses?.length || 0})`);
    console.log(`  Love Quotes: ${counts[4]} (expected: ${backupData.loveQuotes?.length || 0})`);
    console.log(`  Wishes: ${counts[5]} (expected: ${backupData.wishes?.length || 0})`);
    console.log(`  Capsules: ${counts[6]} (expected: ${backupData.capsules?.length || 0})`);

  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
