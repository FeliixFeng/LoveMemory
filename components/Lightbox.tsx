'use client';

import { Photo } from '../lib/types';

export function Lightbox({
  photo, hasMultiple, onClose, onPrev, onNext
}: {
  photo: Photo; hasMultiple: boolean;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white text-xl z-10" onClick={onClose}>✕</button>
      {hasMultiple && (
        <>
          <button className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white text-lg flex items-center justify-center hover:bg-white/40 transition-colors z-10" onClick={e => { e.stopPropagation(); onPrev(); }}>‹</button>
          <button className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 text-white text-lg flex items-center justify-center hover:bg-white/40 transition-colors z-10" onClick={e => { e.stopPropagation(); onNext(); }}>›</button>
        </>
      )}
      <img src={photo.displayUrl || photo.url} alt="" className="max-w-full max-h-full object-contain" onClick={e => e.stopPropagation()} />
    </div>
  );
}
