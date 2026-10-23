import { CITY_COORDS, CITY_TO_PROVINCE } from './map-data';

/* 地点解析的唯一入口。
   以前首页按 location 原文去重、足迹页自己模糊匹配、相册完全不看，
   同一个「武汉 江汉路」在三处得到三种结果。现在三处都调这里。 */

export type ResolvedPlace = {
  city: string;
  province: string;
  coords: [number, number];
};

/* 「武汉市」「湖北省」「朝阳区」这类后缀要去掉再匹配。
   注意顺序：长后缀在前，否则「自治区」会被「区」截断。 */
const ADMIN_SUFFIX = /(特别行政区|自治区|自治州|地区|省|市|区|县)$/;

/* 按长度降序：让「吉林市」先于「吉林」、「黄果树瀑布」先于「贵州」命中 */
const CITY_KEYS = Object.keys(CITY_TO_PROVINCE).sort((a, b) => b.length - a.length);

const cache = new Map<string, ResolvedPlace | null>();

function clean(input: string): string {
  return (input || '').replace(/[\s\u3000]+/g, ' ').trim();
}

function exactMatch(text: string): string | null {
  if (CITY_TO_PROVINCE[text]) return text;
  const stripped = text.replace(ADMIN_SUFFIX, '');
  if (stripped && stripped !== text && CITY_TO_PROVINCE[stripped]) return stripped;
  return null;
}

/**
 * 把自由文本地点解析成可上图的城市。
 * 解析不出（家里、公司、某个山头）返回 null —— 不上地图，但仍算一个「地方」。
 */
export function resolvePlace(location: string): ResolvedPlace | null {
  const raw = clean(location);
  if (!raw) return null;

  const cached = cache.get(raw);
  if (cached !== undefined) return cached;

  let city = exactMatch(raw);

  // 「武汉江汉路」「杭州西湖边」这类没有分隔符的，靠包含匹配
  if (!city) {
    for (const key of CITY_KEYS) {
      if (raw.includes(key)) { city = key; break; }
    }
  }

  // 「湖北 武汉」「武汉, 江汉路」这类，逐段精确匹配，避免被更长的城市名误伤
  if (!city) {
    const parts = raw.split(/[\s,，、·/|]+/).filter(Boolean);
    for (const part of parts) {
      const hit = exactMatch(part);
      if (hit) { city = hit; break; }
    }
  }

  const result: ResolvedPlace | null = city
    ? { city, province: CITY_TO_PROVINCE[city], coords: CITY_COORDS[city] }
    : null;

  cache.set(raw, result);
  return result;
}

/**
 * 统计用的地点标签：能定位的归到城市（「武汉 江汉路」和「武汉」算同一个），
 * 定位不了的保留原文（「家里」仍然算一个地方，不会消失）。
 */
export function placeLabel(location: string): string {
  const raw = clean(location);
  if (!raw) return '';
  return resolvePlace(raw)?.city ?? raw;
}

/** 去重后的地点集合，首页统计与足迹页共用同一口径 */
export function collectPlaces(locations: string[]): string[] {
  const seen = new Set<string>();
  for (const loc of locations) {
    const label = placeLabel(loc);
    if (label) seen.add(label);
  }
  return [...seen];
}
