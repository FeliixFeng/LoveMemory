import { ICONS, ICON_MAP } from './constants';

export function getEmoji(icon: string): string {
  return ICONS.find(i => i.id === (ICON_MAP[icon] || icon))?.emoji || '💕';
}

export function fmt(d: string): string {
  if (!d) return '--';
  return new Date(`${d}T00:00:00`).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
