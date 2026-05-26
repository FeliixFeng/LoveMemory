'use client';

import { Milestone } from '../../lib/types';
import { ICONS } from '../../lib/constants';

export function MilestoneModal({
  editMs, msDraft, setMsDraft, onSave, onDelete, onClose
}: {
  editMs: Milestone | null;
  msDraft: { date: string; title: string; desc: string; icon: string };
  setMsDraft: (fn: (d: { date: string; title: string; desc: string; icon: string }) => { date: string; title: string; desc: string; icon: string }) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl p-5" style={{ animation: 'slideUp 0.3s ease-out' }}>
        <div className="w-10 h-1 bg-amber-200 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>{editMs ? '编辑里程碑' : '新里程碑'}</h3>
          {editMs && <button onClick={onDelete} className="text-red-400 text-sm">删除</button>}
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {ICONS.map(ic => <button key={ic.id} onClick={() => setMsDraft(d => ({ ...d, icon: ic.id }))} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all ${msDraft.icon === ic.id ? 'bg-[#d48b60] border-[#d48b60] scale-105' : 'bg-white border-amber-100'}`}>{ic.emoji}</button>)}
        </div>
        <div className="space-y-3 mb-4">
          <input type="text" placeholder="标题" value={msDraft.title} onChange={e => setMsDraft(d => ({ ...d, title: e.target.value }))} className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60]" />
          <input type="date" value={msDraft.date} onChange={e => setMsDraft(d => ({ ...d, date: e.target.value }))} className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60]" />
          <input type="text" placeholder="备注（可选）" value={msDraft.desc} onChange={e => setMsDraft(d => ({ ...d, desc: e.target.value }))} className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60]" />
        </div>
        <button onClick={onSave} className="w-full py-3 bg-[#3d281c] text-amber-50 rounded-xl font-medium shadow-lg active:scale-[0.98] transition-transform">保存</button>
      </div>
    </div>
  );
}
