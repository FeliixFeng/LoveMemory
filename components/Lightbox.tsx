'use client';

import { useEffect, useRef, useState } from 'react';
import { Photo } from '../lib/types';

export function Lightbox({
  photos, index, onClose, onPrev, onNext
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const touchStart = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const photo = photos[index];
  const hasMultiple = photos.length > 1;

  useEffect(() => {
    setLoaded(false);
  }, [index]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? onNext() : onPrev();
    }
    touchStart.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white text-sm flex items-center justify-center hover:bg-white/20 transition-colors z-10" onClick={onClose}>✕</button>

      {/* Counter */}
      {hasMultiple && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs z-10" style={{ fontFamily: 'Playfair Display, serif' }}>
          {index + 1} / {photos.length}
        </div>
      )}

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white text-lg flex items-center justify-center hover:bg-white/20 transition-colors z-10 active:scale-95"
            onClick={e => { e.stopPropagation(); onPrev(); }}
          >‹</button>
          <button
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white text-lg flex items-center justify-center hover:bg-white/20 transition-colors z-10 active:scale-95"
            onClick={e => { e.stopPropagation(); onNext(); }}
          >›</button>
        </>
      )}

      {/* Image */}
      <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
        <img
          src={photo.displayUrl || photo.url}
          alt=""
          className={`max-w-full max-h-[90vh] object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}
