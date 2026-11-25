import type { Event, Photo } from './types.ts';

export type OnThisDayHit = {
  event: Event;
  yearsAgo: number;
};

export type MilestoneInfo = {
  label: string;
  targetDate: string;
  daysLeft: number;
  progress: number;
  secondaryLabel?: string;
};

const DAY_MILESTONES = [
  100, 200, 365, 520, 777, 1000, 1314, 1500, 2000, 2500,
  3000, 3344, 3650, 4000, 5000, 5200, 6000, 7000, 8000, 9000, 10000
];

export function localTodayStr(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function parseMidnight(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00`).getTime();
}

function formatYmd(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * 匹配历史上的今天（月日相同，年份早于今年），按距今年数升序。
 */
export function findOnThisDay(events: Event[], todayStr = localTodayStr()): OnThisDayHit[] {
  const todayYear = Number(todayStr.slice(0, 4));
  const todayMd = todayStr.slice(5, 10);
  if (!todayMd) return [];

  return events
    .filter(ev => ev.date && ev.date.length >= 10 && ev.date.slice(5, 10) === todayMd)
    .map(ev => ({
      event: ev,
      yearsAgo: todayYear - Number(ev.date.slice(0, 4))
    }))
    .filter(hit => hit.yearsAgo > 0)
    .sort((a, b) => a.yearsAgo - b.yearsAgo);
}

/**
 * 从历史事件里随机挑选一条作为时光盲盒；优先挑带照片的事件。
 */
export function pickRandomMemory(events: Event[], photos: Photo[], excludeId?: string | null): Event | null {
  if (events.length === 0) return null;
  const photoEventIds = new Set(photos.map(p => p.eventId).filter(Boolean));
  const candidates = events.filter(e => String(e.id) !== String(excludeId ?? ''));
  const pool = candidates.length > 0 ? candidates : events;
  const withPhotos = pool.filter(e => photoEventIds.has(String(e.id)));
  const finalPool = withPhotos.length > 0 ? withPhotos : pool;
  return finalPool[Math.floor(Math.random() * finalPool.length)] || null;
}

/**
 * 计算最近的恋爱里程碑（周年纪念日 vs 天数大关），返回最先到达的一个并附带次要预告。
 */
export function findNearestMilestone(startDate: string, todayStr = localTodayStr()): MilestoneInfo | null {
  if (!startDate || startDate.length < 10) return null;

  const startMs = parseMidnight(startDate);
  const todayMs = parseMidnight(todayStr);
  if (Number.isNaN(startMs) || Number.isNaN(todayMs) || todayMs < startMs) return null;

  const daysTogether = Math.floor((todayMs - startMs) / 86400000);
  const startD = new Date(startMs);
  const todayD = new Date(todayMs);

  // 1. 下一个周年纪念日
  let annivYear = todayD.getFullYear();
  let annivD = new Date(annivYear, startD.getMonth(), startD.getDate());
  if (annivD.getTime() < todayMs) {
    annivYear += 1;
    annivD = new Date(annivYear, startD.getMonth(), startD.getDate());
  }
  const yearsCount = annivYear - startD.getFullYear();
  const annivDaysLeft = Math.round((annivD.getTime() - todayMs) / 86400000);
  const annivProgress = Math.min(100, Math.max(0, Math.round(((365 - Math.min(365, annivDaysLeft)) / 365) * 100)));
  const annivInfo: MilestoneInfo = {
    label: yearsCount > 0 ? `相恋 ${yearsCount} 周年纪念` : '纪念日',
    targetDate: formatYmd(annivD.getTime()),
    daysLeft: annivDaysLeft,
    progress: annivProgress
  };

  // 2. 下一个天数里程碑（若今天正好踩中大关则 daysLeft = 0）
  const exactToday = DAY_MILESTONES.find(m => m === daysTogether);
  const nextMilestoneDay = exactToday ?? DAY_MILESTONES.find(m => m > daysTogether);
  if (!nextMilestoneDay) return annivInfo;

  const idx = DAY_MILESTONES.indexOf(nextMilestoneDay);
  const prevMilestoneDay = idx > 0 ? DAY_MILESTONES[idx - 1] : 0;
  const dayDaysLeft = nextMilestoneDay - daysTogether;
  const dayProgress = Math.min(
    100,
    Math.max(0, Math.round(((daysTogether - prevMilestoneDay) / (nextMilestoneDay - prevMilestoneDay)) * 100))
  );
  const dayInfo: MilestoneInfo = {
    label: `在一起第 ${nextMilestoneDay} 天`,
    targetDate: formatYmd(startMs + nextMilestoneDay * 86400000),
    daysLeft: dayDaysLeft,
    progress: dayProgress
  };

  // 取更近的一个为主卡，另一个作副提示
  if (dayInfo.daysLeft < annivInfo.daysLeft) {
    return {
      ...dayInfo,
      secondaryLabel: annivDaysLeft === 0
        ? `今天也是相恋 ${yearsCount} 周年纪念`
        : `距离 ${yearsCount} 周年还有 ${annivDaysLeft} 天`
    };
  }

  return {
    ...annivInfo,
    secondaryLabel: dayDaysLeft === 0
      ? `今天正好是在一起第 ${nextMilestoneDay} 天`
      : `距离 ${nextMilestoneDay} 天纪念还有 ${dayDaysLeft} 天`
  };
}
