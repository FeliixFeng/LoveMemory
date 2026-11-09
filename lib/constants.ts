export type HeroSlide = { mobile: string; web: string };

export const HERO_SLIDES: HeroSlide[] = [1, 2, 3, 4, 5, 6].map(n => ({
  mobile: `/hero/hero${n}-mobile.jpg`,
  web: `/hero/hero${n}-web.jpg`
}));

/* 事件类别图标 —— 内容资产，用户建事件时挑选。
   2026-11-09 精简：删语义重复且从未用过的 park/travel/couple，再删最泛的 house（20→16，
   选择器 grid-cols-8 正好 8+8 两排齐）；换掉两个渲染丑的：🎆 暗紫方块 → 🎇，
   🕯️ 又小又怪 → 🥂。只改 emoji/label 不动 id，老数据零迁移。 */
export const ICONS = [
  { id: 'heart', emoji: '💕', label: '心动' },
  { id: 'airplane', emoji: '✈️', label: '旅行' },
  { id: 'ring', emoji: '💍', label: '纪念' },
  { id: 'camera', emoji: '📷', label: '照片' },
  { id: 'star', emoji: '⭐', label: '特别' },
  { id: 'gift', emoji: '🎁', label: '礼物' },
  { id: 'cake', emoji: '🎂', label: '生日' },
  { id: 'music', emoji: '🎵', label: '音乐' },
  { id: 'food', emoji: '🍽️', label: '美食' },
  { id: 'movie', emoji: '🎬', label: '电影' },
  { id: 'restaurant', emoji: '🥂', label: '约会' },
  { id: 'anniversary', emoji: '💝', label: '周年' },
  { id: 'camping', emoji: '⛺️', label: '露营' },
  { id: 'fireworks', emoji: '🎇', label: '跨年' },
  { id: 'flower', emoji: '🌹', label: '鲜花' },
  { id: 'photo', emoji: '📸', label: '回忆' },
];

export const ICON_MAP: Record<string, string> = {
  'ph-heart': 'heart',
  'ph-airplane-tilt': 'airplane',
  'ph-house': 'house',
  'ph-ring': 'ring',
  'ph-camera': 'camera',
  'ph-star': 'star'
};

/* 心情 —— 2026-11-09 精简到 5 个（删从未用过的 peaceful/grateful），
   保证移动端一排放得下不折行；怀旧 🥺 换 🥲（🥺 是恳求脸，语义不贴）。 */
export const MOODS = [
  { id: 'happy', emoji: '😊', label: '开心' },
  { id: 'excited', emoji: '🤩', label: '兴奋' },
  { id: 'romantic', emoji: '🥰', label: '浪漫' },
  { id: 'nostalgic', emoji: '🥲', label: '怀旧' },
  { id: 'loved', emoji: '😍', label: '被爱' },
];

export const EXPENSE_CATEGORIES = [
  { id: 'food', emoji: '🍽️', label: '餐饮' },
  { id: 'transport', emoji: '🚗', label: '交通' },
  { id: 'accommodation', emoji: '🏨', label: '住宿' },
  { id: 'tickets', emoji: '🎫', label: '门票' },
  { id: 'shopping', emoji: '🛍️', label: '购物' },
  { id: 'gift', emoji: '🎁', label: '礼物' },
  { id: 'other', emoji: '📝', label: '其他' },
];
