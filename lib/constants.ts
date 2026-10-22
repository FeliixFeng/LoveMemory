export type HeroSlide = { mobile: string; web: string };

export const HERO_SLIDES: HeroSlide[] = [1, 2, 3, 4, 5, 6].map(n => ({
  mobile: `/hero/hero${n}-mobile.jpg`,
  web: `/hero/hero${n}-web.jpg`
}));

export const ICONS = [
  { id: 'heart', emoji: '💕', label: '心动' },
  { id: 'airplane', emoji: '✈️', label: '旅行' },
  { id: 'house', emoji: '🏠', label: '日常' },
  { id: 'ring', emoji: '💍', label: '纪念' },
  { id: 'camera', emoji: '📷', label: '照片' },
  { id: 'star', emoji: '⭐', label: '特别' },
  { id: 'gift', emoji: '🎁', label: '礼物' },
  { id: 'cake', emoji: '🎂', label: '生日' },
  { id: 'music', emoji: '🎵', label: '音乐' },
  { id: 'food', emoji: '🍽️', label: '美食' },
  { id: 'park', emoji: '🌳', label: '公园' },
  { id: 'movie', emoji: '🎬', label: '电影' },
  { id: 'restaurant', emoji: '🕯️', label: '烛光' },
  { id: 'anniversary', emoji: '💝', label: '周年' },
  { id: 'camping', emoji: '⛺️', label: '露营' },
  { id: 'fireworks', emoji: '🎆', label: '跨年' },
  { id: 'travel', emoji: '🧳', label: '出游' },
  { id: 'flower', emoji: '🌹', label: '鲜花' },
  { id: 'photo', emoji: '📸', label: '回忆' },
  { id: 'couple', emoji: '💑', label: '情侣' },
];

export const ICON_MAP: Record<string, string> = {
  'ph-heart': 'heart',
  'ph-airplane-tilt': 'airplane',
  'ph-house': 'house',
  'ph-ring': 'ring',
  'ph-camera': 'camera',
  'ph-star': 'star'
};

export const MOODS = [
  { id: 'happy', emoji: '😊', label: '开心' },
  { id: 'excited', emoji: '🤩', label: '兴奋' },
  { id: 'romantic', emoji: '🥰', label: '浪漫' },
  { id: 'peaceful', emoji: '😌', label: '平静' },
  { id: 'nostalgic', emoji: '🥺', label: '怀旧' },
  { id: 'grateful', emoji: '🙏', label: '感恩' },
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
