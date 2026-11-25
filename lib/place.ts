import { CITY_COORDS, CITY_TO_PROVINCE } from './map-data.ts';

/* 地点解析的唯一入口。
   以前首页按 location 原文去重、足迹页自己模糊匹配、相册完全不看，
   同一个「武汉 江汉路」在三处得到三种结果。现在全站统一走这里。 */

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

/* 占位词：未确定或空占位，不当作真实去过的地方 */
const PLACEHOLDER_WORDS = new Set(['待定', '未定', '暂无', '未知', '无']);

/* 常见地标/景区/区县到主城市的直觉映射：
   填「迪士尼」「江汉路」「东坡赤壁」时能直接归到对应城市，不用强迫写市名。 */
const LANDMARK_ALIASES: Record<string, string> = {
  '东坡赤壁': '黄冈',
  '迪士尼': '上海', '外滩': '上海', '陆家嘴': '上海', '东方明珠': '上海', '静安寺': '上海',
  '武大': '武汉', '武汉大学': '武汉', '黄鹤楼': '武汉', '江汉路': '武汉', '光谷': '武汉',
  '东湖': '武汉', '汉口': '武汉', '武昌': '武汉', '汉阳': '武汉', '洪山': '武汉', '楚河汉街': '武汉',
  '洪崖洞': '重庆', '解放碑': '重庆', '观音桥': '重庆', '朝天门': '重庆',
  '橘子洲': '长沙', '五一广场': '长沙', '岳麓山': '长沙',
  '鼓浪屿': '厦门', '曾厝垵': '厦门', '沙坡尾': '厦门',
  '春熙路': '成都', '太古里': '成都', '宽窄巷子': '成都', '锦里': '成都',
  '西湖': '杭州', '灵隐寺': '杭州',
  '故宫': '北京', '长城': '北京', '天安门': '北京', '三里屯': '北京', '颐和园': '北京', '环球影城': '北京',
  '夫子庙': '南京', '新街口': '南京', '玄武湖': '南京',
  '天涯海角': '三亚', '亚龙湾': '三亚', '蜈支洲岛': '三亚', '海棠湾': '三亚',
  '大唐不夜城': '西安', '兵马俑': '西安', '回民街': '西安',
  '洱海': '大理', '苍山': '大理',
  '玉龙雪山': '丽江',
  '栈桥': '青岛', '八大关': '青岛',
};

const ALIAS_KEYS = Object.keys(LANDMARK_ALIASES).sort((a, b) => b.length - a.length);

const cache = new Map<string, ResolvedPlace | null>();

function clean(input: string): string {
  return (input || '').replace(/[\s\u3000]+/g, ' ').trim();
}

export function isPlaceholderLocation(input: string): boolean {
  const raw = clean(input);
  return !raw || PLACEHOLDER_WORDS.has(raw);
}

function exactMatch(text: string): string | null {
  if (CITY_TO_PROVINCE[text]) return text;
  const stripped = text.replace(ADMIN_SUFFIX, '');
  if (stripped && stripped !== text && CITY_TO_PROVINCE[stripped]) return stripped;
  return null;
}

function buildResolved(city: string): ResolvedPlace | null {
  const province = CITY_TO_PROVINCE[city];
  const coords = CITY_COORDS[city];
  if (!province || !coords) return null;
  return { city, province, coords };
}

/**
 * 把自由文本地点解析成可上图的城市。
 * 解析不出（家里、公司、某个山头）或占位词（待定）返回 null。
 */
export function resolvePlace(location: string): ResolvedPlace | null {
  const raw = clean(location);
  if (!raw || PLACEHOLDER_WORDS.has(raw)) return null;

  const cached = cache.get(raw);
  if (cached !== undefined) return cached;

  let city: string | null = null;

  // 先匹配常见地标别名（如「东坡赤壁」→「黄冈」、「迪士尼」→「上海」），避免同城景点在地图上重叠打架
  for (const alias of ALIAS_KEYS) {
    if (raw.includes(alias)) {
      city = LANDMARK_ALIASES[alias];
      break;
    }
  }

  if (!city) city = exactMatch(raw);

  // 「武汉江汉路」「杭州西湖边」这类没有分隔符的，靠包含匹配
  if (!city) {
    for (const key of CITY_KEYS) {
      if (raw.includes(key)) { city = key; break; }
    }
  }

  // 「湖北 武汉」「武汉, 江汉路」这类，逐段精确匹配
  if (!city) {
    const parts = raw.split(/[\s,，、·/|]+/).filter(Boolean);
    for (const part of parts) {
      const hit = exactMatch(part);
      if (hit) { city = hit; break; }
    }
  }

  const result = city ? buildResolved(city) : null;
  cache.set(raw, result);
  return result;
}

/**
 * 解析显式保存的 city 字段（如「武汉」「武功山」）。
 */
export function resolveCity(city: string): ResolvedPlace | null {
  const raw = clean(city);
  if (!raw) return null;
  return buildResolved(raw) || resolvePlace(raw);
}

/**
 * 统一的事件地点解析：
 * - 若 event.city 显式存在且非空，优先按 city 定位；
 * - 若 event.city 显式为空字符串 ""，视为用户明确标记「日常/不上图」，不再强行猜；
 * - 若 event.city 未传入（undefined，兼容旧调用），回退按 location 解析。
 */
export function resolveEventPlace(event: { location: string; city?: string }): ResolvedPlace | null {
  if (event.city !== undefined) {
    return event.city.trim() ? resolveCity(event.city) : null;
  }
  return resolvePlace(event.location);
}

/**
 * 统计用的地点标签：能定位的归到城市，定位不了但非占位词的保留原文（「家里」仍算一个地方）。
 */
export function placeLabel(location: string, city?: string): string {
  const raw = clean(location);
  if (city && city.trim()) {
    return resolveCity(city)?.city ?? clean(city);
  }
  if (!raw || PLACEHOLDER_WORDS.has(raw)) return '';
  if (city === '') return raw;
  return resolvePlace(raw)?.city ?? raw;
}

/** 去重后的地点集合，首页统计与足迹页共用同一口径 */
export function collectPlaces(inputs: (string | { location: string; city?: string })[]): string[] {
  const seen = new Set<string>();
  for (const item of inputs) {
    const label = typeof item === 'string'
      ? placeLabel(item)
      : placeLabel(item.location, item.city);
    if (label) seen.add(label);
  }
  return [...seen];
}

/** 供城市选择器使用的全量城市/景区列表 */
export const ALL_CITIES: { city: string; province: string }[] = Object.entries(CITY_TO_PROVINCE).map(
  ([city, province]) => ({ city, province })
);
