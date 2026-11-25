import type { AppData } from './types.ts';
import { resolveEventPlace } from './place.ts';

export type AchievementCategory = 'time' | 'footprint' | 'memory';

export type Achievement = {
  id: string;
  category: AchievementCategory;
  title: string;
  subtitle: string;
  symbol: string;
  unlocked: boolean;
  progressText: string;
  progress: number; // 0..100
};

export function computeAchievements(data: AppData, daysTogether: number): Achievement[] {
  const provinces = new Set<string>();
  const cities = new Set<string>();
  let hasTrip = false;

  const homeCity = (data.homeCity || '').trim();

  for (const ev of data.events) {
    const resolved = resolveEventPlace(ev);
    if (resolved) {
      provinces.add(resolved.province);
      cities.add(resolved.city);
      if (homeCity && resolved.city !== homeCity) hasTrip = true;
    }
    if ((ev.endDate && ev.endDate > ev.date) || ev.icon === 'airplane') {
      hasTrip = true;
    }
  }

  const eventCount = data.events.length;
  const photoCount = data.photos.length;
  const provCount = provinces.size;
  const cityCount = cities.size;
  const completedWishes = data.wishes.filter(w => w.isCompleted).length;

  const list: Achievement[] = [
    // 时光里程碑
    makeNumBadge('time-100', 'time', '百日初见', '相恋满 100 天', '🌱', daysTogether, 100, '天'),
    makeNumBadge('time-520', 'time', '520 心动', '相恋满 520 天', '💗', daysTogether, 520, '天'),
    makeNumBadge('time-1000', 'time', '千日相守', '相恋满 1000 天', '✨', daysTogether, 1000, '天'),
    makeNumBadge('time-2000', 'time', '两千昼夜', '相恋满 2000 天', '🌙', daysTogether, 2000, '天'),
    makeNumBadge('time-5y', 'time', '五年之约', '携手走过 5 周年', '🥂', daysTogether, 1826, '天'),
    makeNumBadge('time-3000', 'time', '三千朝暮', '向 3000 天进发', '👑', daysTogether, 3000, '天'),

    // 足迹探索
    makeNumBadge('map-1', 'footprint', '启程出发', '点亮第 1 座城市', '📍', cityCount, 1, '城'),
    makeNumBadge('map-3p', 'footprint', '山河初览', '足迹跨越 3 个省市', '🧭', provCount, 3, '省'),
    makeNumBadge('map-5p', 'footprint', '五省行者', '足迹点亮 5 个省市', '🗺️', provCount, 5, '省'),
    makeNumBadge('map-10c', 'footprint', '十城印记', '打卡 10 座不同城市', '✈️', cityCount, 10, '城'),
    {
      id: 'map-trip',
      category: 'footprint',
      title: '远方来信',
      subtitle: '开启一次专属双人旅行',
      symbol: '🧳',
      unlocked: hasTrip,
      progressText: hasTrip ? '已解锁' : '待出发',
      progress: hasTrip ? 100 : 0
    },

    // 回忆与定格
    makeNumBadge('mem-10', 'memory', '十段篇章', '记录 10 个珍贵事件', '📖', eventCount, 10, '条'),
    makeNumBadge('mem-25', 'memory', '廿五时光', '记录 25 个珍贵事件', '📜', eventCount, 25, '条'),
    makeNumBadge('photo-20', 'memory', '光影留痕', '留存 20 张双人照片', '📸', photoCount, 20, '张'),
    makeNumBadge('photo-50', 'memory', '胶片藏家', '留存 50 张双人照片', '🎞️', photoCount, 50, '张'),
    makeNumBadge('wish-1', 'memory', '心愿成真', '共同完成第 1 个心愿', '🎁', completedWishes, 1, '个'),
  ];

  return list;
}

function makeNumBadge(
  id: string,
  category: AchievementCategory,
  title: string,
  subtitle: string,
  symbol: string,
  current: number,
  target: number,
  unit: string
): Achievement {
  const unlocked = current >= target;
  const progress = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  return {
    id,
    category,
    title,
    subtitle,
    symbol,
    unlocked,
    progressText: unlocked ? '已达成' : `${current} / ${target} ${unit}`,
    progress
  };
}
