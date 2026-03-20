import { prisma } from './prisma.ts';

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

export type AppData = {
  startDate: string;
  heroImage: string;
  milestones: AppMilestone[];
  photos: AppPhoto[];
};

export const DEFAULT_APP_DATA: AppData = {
  startDate: '',
  heroImage: '',
  milestones: [],
  photos: []
};

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
  const [settings, milestones, photos] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.milestone.findMany({ orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] }),
    prisma.photo.findMany({ orderBy: { id: 'desc' } })
  ]);

  return {
    startDate: settings?.startDate || '',
    heroImage: settings?.heroImage || '',
    milestones: milestones.map((item) => ({
      id: normalizeMilestoneId(item.id),
      date: item.date,
      title: item.title,
      desc: item.description,
      icon: item.icon
    })),
    photos: photos.map((item) =>
      normalizePhoto({
        url: item.url,
        displayUrl: item.displayUrl,
        thumbUrl: item.thumbUrl,
        filename: item.filename,
        mimeType: item.mimeType,
        size: item.fileSize,
        uploadedAt: item.uploadedAt
      })
    )
  };
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
      : currentData.milestones
  };

  await prisma.$transaction(async (tx) => {
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

      for (const photo of nextData.photos) {
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
            uploadedAt: photo.uploadedAt
          }
        });
      }
    }
  });

  return nextData;
}
