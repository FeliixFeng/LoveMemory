import type { Event, Photo } from './types.ts';

/**
 * 判断图片是否应跳过 Next.js `/_next/image` 代理直接加载：
 * - 外部 HTTPS/HTTP 图片（如阿里云 OSS 已做压缩和独立 thumbs 缩略图）直连 CDN，避免走部署机带宽和 CPU；
 * - 本地 `/uploads/thumbs/`（上传时已 sharp 裁剪为 480px）和 `data:` / `blob:` 无需二次转码；
 * - 本地静态大图（如 `/hero/hero*-web.jpg`）保留 Next Image 优化缓存。
 */
export function shouldBypassNextImage(src?: string | null): boolean {
  if (!src) return false;
  if (src.startsWith('https://') || src.startsWith('http://')) return true;
  if (src.startsWith('/uploads/thumbs/')) return true;
  if (src.startsWith('data:') || src.startsWith('blob:')) return true;
  return false;
}

/** 列表/卡片/网格等小尺寸预览场景优先使用的缩略图地址 */
export function getPhotoThumbUrl(photo?: Pick<Photo, 'url' | 'displayUrl' | 'thumbUrl'> | null): string {
  if (!photo) return '';
  return photo.thumbUrl || photo.displayUrl || photo.url || '';
}

/** 灯箱/全屏查看原图场景使用的清晰大图地址 */
export function getPhotoOriginalUrl(photo?: Pick<Photo, 'url' | 'displayUrl'> | null): string {
  if (!photo) return '';
  return photo.displayUrl || photo.url || '';
}

/**
 * 将标准上传的原图路径（`.../photos/<filename>`）映射为对应缩略图路径（`.../thumbs/<filename>`）。
 * 主要用于 `event.coverPhoto` 或 `customCovers` 这类只存了单一 URL 的字段在缩略图位降载。
 */
export function deriveThumbFromUrl(url?: string | null): string {
  if (!url) return '';
  if (url.includes('/thumbs/')) return url;
  if (url.includes('/photos/')) {
    return url.replace('/photos/', '/thumbs/');
  }
  return '';
}

/**
 * 解析事件封面图：卡片展示优先返回 `thumbSrc`（480px 缩略图），并提供 `fallbackSrc`（原图兜底）。
 */
export function resolveEventCoverUrls(
  event: Pick<Event, 'coverPhoto'>,
  eventPhotos: Photo[],
  allPhotos: Photo[] = eventPhotos
): { thumbSrc: string; fallbackSrc: string } {
  const cover = event.coverPhoto?.trim() || '';
  if (cover) {
    const matched = allPhotos.find(p => p.url === cover || p.displayUrl === cover);
    if (matched?.thumbUrl) {
      return {
        thumbSrc: matched.thumbUrl,
        fallbackSrc: getPhotoOriginalUrl(matched) || cover
      };
    }
    const derived = deriveThumbFromUrl(cover);
    return {
      thumbSrc: derived || cover,
      fallbackSrc: cover
    };
  }

  const first = eventPhotos[0];
  if (!first) {
    return { thumbSrc: '', fallbackSrc: '' };
  }

  const original = getPhotoOriginalUrl(first);
  return {
    thumbSrc: getPhotoThumbUrl(first),
    fallbackSrc: original
  };
}
