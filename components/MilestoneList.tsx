'use client';

import { Milestone } from '../lib/types';
import { getEmoji } from '../lib/utils';

export function MilestoneList({
  milestones, onEdit, onCreate
}: {
  milestones: Milestone[]; onEdit: (m: Milestone) => void; onCreate: () => void;
}) {
  return (
    <div style={{ animation: 'slideUp 0.6s ease-out 0.1s both' }}>
      <div className="flex justify-between items-end mb-3">
        <h2 className="text-lg font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>恋爱里程碑</h2>
        <span className="text-[10px] text-[#aa6f4d] font-bold tracking-widest uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>MILESTONES</span>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
        {milestones.map(m => (
          <div key={m.id} onClick={() => onEdit(m)} className="flex-none w-36 p-3 rounded-2xl bg-white border border-[#efd8c3]/40 shadow-sm cursor-pointer hover:-translate-y-0.5 transition-transform">
            <span className="text-xl mb-2 block">{getEmoji(m.icon)}</span>
            <p className="text-[10px] text-[#aa6f4d] mb-0.5" style={{ fontFamily: 'Playfair Display, serif' }}>{m.date.replace(/-/g, '.')}</p>
            <p className="text-sm font-semibold text-[#3d281c] truncate">{m.title}</p>
            <p className="text-[10px] text-[#aa6f4d]/70 truncate">{m.desc || '—'}</p>
          </div>
        ))}
        <div onClick={onCreate} className="flex-none w-16 flex flex-col items-center justify-center gap-1 cursor-pointer group">
          <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-[#efd8c3] flex items-center justify-center text-[#aa6f4d] group-hover:bg-amber-50 group-hover:border-[#d48b60] transition-colors text-lg">+</div>
          <span className="text-[10px] text-[#aa6f4d]">Add</span>
        </div>
      </div>
    </div>
  );
}
