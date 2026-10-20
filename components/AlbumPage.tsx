'use client';

import { useState } from 'react';
import { Photo } from '../lib/types';
import { getEmoji, fmt } from '../lib/utils';
import { useAppData } from '../hooks/useAppData';
import { Lightbox } from './Lightbox';
import { SkeletonPage } from './SkeletonCard';
import { SafeImage } from './SafeImage';

export function AlbumPage() {
  const { data, loading } = useAppData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<{ photos: Photo[]; index: number } | null>(null);

  if (loading) return <SkeletonPage />;

  const eventsWithPhotos = data.events.filter(e => data.photos.some(p => p.eventId === String(e.id)));
  const standalonePhotos = data.photos.filter(p => !p.eventId);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-lm-ink" style={{ fontFamily: 'var(--lm-font-serif)' }}>📷 相册</h1>

      {eventsWithPhotos.length === 0 && standalonePhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <span className="text-4xl mb-3">📷</span>
          <p className="text-sm text-lm-body/50">还没有照片</p>
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
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-lm-line/10 transition-colors"
                >
                  {/* Cover photo */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-lm-line/20 relative">
                    {eventPhotos[0] && (
                      <SafeImage src={eventPhotos[0].thumbUrl || eventPhotos[0].displayUrl || eventPhotos[0].url} alt="" fill sizes="56px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{getEmoji(event.icon)}</span>
                      <h3 className="text-sm font-bold text-lm-ink truncate" style={{ fontFamily: 'var(--lm-font-serif)' }}>{event.title || '未命名'}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-lm-body/45">
                      <span>{fmt(event.date)}</span>
                      <span>· {eventPhotos.length} 张照片</span>
                    </div>
                  </div>
                  <span className="text-lm-body/30 text-sm">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {/* Photos grid */}
                {isExpanded && (
                  <div className="px-4 pb-4 grid grid-cols-5 md:grid-cols-6 gap-1 stagger">
                    {eventPhotos.map((p, i) => (
                      <div
                        key={p.url}
                        className="aspect-[4/5] rounded-lg overflow-hidden bg-lm-line/20 cursor-pointer hover:opacity-90 transition-opacity relative"
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
              <h3 className="text-sm font-bold text-lm-ink mb-3">其他照片 ({standalonePhotos.length})</h3>
              <div className="grid grid-cols-5 md:grid-cols-6 gap-1 stagger">
                {standalonePhotos.map((p, i) => (
                  <div
                    key={p.url}
                    className="aspect-[4/5] rounded-lg overflow-hidden bg-lm-line/20 cursor-pointer hover:opacity-90 transition-opacity relative"
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
