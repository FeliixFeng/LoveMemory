'use client';

import { useEffect, useState } from 'react';
import { Event, Photo, AppData } from '../lib/types';
import { getEmoji, fmt } from '../lib/utils';
import { Lightbox } from './Lightbox';
import { SkeletonPage } from './SkeletonCard';
import { SafeImage } from './SafeImage';

export function AlbumPage() {
  const [data, setData] = useState<AppData | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<{ photos: Photo[]; index: number } | null>(null);

  useEffect(() => {
    fetch('/api/data', { cache: 'no-store' }).then(r => r.json()).then(d => {
      const events = (d.events || []).sort((a: Event, b: Event) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const photos = (d.photos || []).map((p: Photo) => ({ ...p, displayUrl: p.displayUrl || p.url, thumbUrl: p.thumbUrl || p.displayUrl || p.url }));
      setData({ ...d, events, photos });
    });
  }, []);

  if (!data) return <SkeletonPage />;

  const eventsWithPhotos = data.events.filter(e => data.photos.some(p => p.eventId === String(e.id)));
  const standalonePhotos = data.photos.filter(p => !p.eventId);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>📷 相册</h1>

      {eventsWithPhotos.length === 0 && standalonePhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="text-4xl mb-3">📷</span>
          <p className="text-sm text-[#5c3d2a]/50">还没有照片</p>
        </div>
      ) : (
        <>
          {eventsWithPhotos.map(event => {
            const eventPhotos = data.photos.filter(p => p.eventId === String(event.id));
            const isExpanded = expandedId === String(event.id);
            return (
              <div key={event.id} className="lm-card rounded-2xl overflow-hidden">
                {/* Event header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : String(event.id))}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#efd8c3]/10 transition-colors"
                >
                  {/* Cover photo */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#efd8c3]/20 relative">
                    {eventPhotos[0] && (
                      <SafeImage src={eventPhotos[0].thumbUrl || eventPhotos[0].displayUrl || eventPhotos[0].url} alt="" fill sizes="56px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{getEmoji(event.icon)}</span>
                      <h3 className="text-sm font-bold text-[#3d281c] truncate" style={{ fontFamily: 'Noto Serif SC, serif' }}>{event.title || '未命名'}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5c3d2a]/45">
                      <span>{fmt(event.date)}</span>
                      <span>· {eventPhotos.length} 张照片</span>
                    </div>
                  </div>
                  <span className="text-[#5c3d2a]/30 text-sm">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {/* Photos grid */}
                {isExpanded && (
                  <div className="px-4 pb-4 grid grid-cols-5 md:grid-cols-6 gap-1">
                    {eventPhotos.map((p, i) => (
                      <div
                        key={p.url}
                        className="aspect-[4/5] rounded-lg overflow-hidden bg-[#efd8c3]/20 cursor-pointer hover:opacity-90 transition-opacity relative"
                        onClick={() => setViewPhoto({ photos: eventPhotos, index: i })}
                      >
                        <SafeImage src={p.thumbUrl || p.displayUrl || p.url} alt="" fill sizes="(max-width: 640px) 20vw, 150px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Standalone photos */}
          {standalonePhotos.length > 0 && (
            <div className="lm-card rounded-2xl p-4">
              <h3 className="text-sm font-bold text-[#3d281c] mb-3">其他照片 ({standalonePhotos.length})</h3>
              <div className="grid grid-cols-5 md:grid-cols-6 gap-1">
                {standalonePhotos.map((p, i) => (
                  <div
                    key={p.url}
                    className="aspect-[4/5] rounded-lg overflow-hidden bg-[#efd8c3]/20 cursor-pointer hover:opacity-90 transition-opacity relative"
                    onClick={() => setViewPhoto({ photos: standalonePhotos, index: i })}
                  >
                    <SafeImage src={p.thumbUrl || p.displayUrl || p.url} alt="" fill sizes="(max-width: 640px) 20vw, 150px" className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {viewPhoto && (
        <Lightbox
          photos={viewPhoto.photos}
          index={viewPhoto.index}
          onClose={() => setViewPhoto(null)}
          onPrev={() => setViewPhoto(v => v && { ...v, index: (v.index - 1 + v.photos.length) % v.photos.length })}
          onNext={() => setViewPhoto(v => v && { ...v, index: (v.index + 1) % v.photos.length })}
        />
      )}
    </div>
  );
}
