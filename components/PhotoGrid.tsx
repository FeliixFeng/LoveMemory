'use client';

import { Photo } from '../lib/types';

export function PhotoGrid({
  photos, uploading, deleting, dragIndex,
  onViewPhoto, onDeleteConfirm, onDragStart, onDragOver, onDrop,
  onLongPressStart, onLongPressEnd, onAddClick
}: {
  photos: Photo[]; uploading: boolean; deleting: string; dragIndex: number | null;
  onViewPhoto: (p: Photo) => void; onDeleteConfirm: (p: Photo) => void;
  onDragStart: (i: number) => void; onDragOver: (e: React.DragEvent) => void; onDrop: (i: number) => void;
  onLongPressStart: (p: Photo) => void; onLongPressEnd: () => void; onAddClick: () => void;
}) {
  return (
    <div style={{ animation: 'slideUp 0.6s ease-out 0.2s both' }}>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>甜蜜瞬间</h2>
        <div className="flex gap-2">
          {photos.length > 0 && <button onClick={onAddClick} className="text-[10px] text-[#aa6f4d] font-bold tracking-widest uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>VIEW ALL</button>}
          <label className="lm-btn cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold">
            {uploading ? '上传中...' : '+ 添加'}
            <input type="file" multiple accept="image/*" className="hidden" onChange={e => { /* handled by parent */ }} />
          </label>
        </div>
      </div>
      {photos.length === 0 ? (
        <div className="aspect-[4/3] rounded-2xl border-2 border-dashed border-[#efd8c3] flex flex-col items-center justify-center text-[#aa6f4d] cursor-pointer hover:bg-amber-50/50" onClick={onAddClick}>
          <span className="text-3xl mb-2">📷</span><span className="text-sm">上传第一张照片</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {photos.map((p, idx) => (
            <div key={p.uploadedAt} draggable onDragStart={() => onDragStart(idx)} onDragOver={onDragOver} onDrop={() => onDrop(idx)} className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer group bg-amber-50 transition-opacity ${dragIndex === idx ? 'opacity-50' : ''}`} onClick={() => onViewPhoto(p)} onTouchStart={() => onLongPressStart(p)} onTouchEnd={onLongPressEnd} onMouseDown={() => onLongPressStart(p)} onMouseUp={onLongPressEnd} onMouseLeave={onLongPressEnd}>
              <img src={p.thumbUrl || p.url} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="hidden md:flex absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity items-end justify-center pb-3">
                <button disabled={deleting === p.url} onClick={e => { e.stopPropagation(); onDeleteConfirm(p); }} className="w-7 h-7 rounded-full bg-white/90 text-red-500 text-xs flex items-center justify-center">🗑</button>
              </div>
            </div>
          ))}
          <div className="aspect-square rounded-2xl border-2 border-dashed border-[#efd8c3]/60 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50/50" onClick={onAddClick}>
            <span className="text-[#aa6f4d] text-lg">+</span><span className="text-[10px] text-[#aa6f4d]">Add</span>
          </div>
        </div>
      )}
    </div>
  );
}
