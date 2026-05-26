'use client';

import { Photo } from '../lib/types';

export function Gallery({
  photos, deleting, onViewPhoto, onDelete, onAdd, onClose
}: {
  photos: Photo[]; deleting: string;
  onViewPhoto: (p: Photo) => void; onDelete: (p: Photo) => void; onAdd: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[#fdfbf7] flex flex-col" style={{ animation: 'slideUp 0.3s ease-out' }}>
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#efd8c3]/30">
        <button onClick={onClose} className="text-sm text-[#3d281c]">← 返回</button>
        <span className="text-sm font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>甜蜜瞬间</span>
        <button onClick={onAdd} className="text-sm text-[#aa6f4d]">+ 添加</button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
          {photos.map(p => (
            <div key={p.uploadedAt} className="relative aspect-square bg-amber-50 cursor-pointer group" onClick={() => onViewPhoto(p)}>
              <img src={p.thumbUrl || p.url} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <button disabled={deleting === p.url} onClick={e => { e.stopPropagation(); onDelete(p); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center">✕</button>
            </div>
          ))}
        </div>
        {photos.length === 0 && <p className="text-center text-[#aa6f4d] text-sm py-20">还没有照片</p>}
      </div>
    </div>
  );
}
