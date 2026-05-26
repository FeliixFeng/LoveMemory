'use client';

import { Event } from '../lib/types';
import { ICONS, MOODS } from '../lib/constants';

export type EventDraft = {
  title: string;
  date: string;
  desc: string;
  icon: string;
  location: string;
  mood: string;
};

export function EventModal({
  editEvent, draft, setDraft, onSave, onDelete, onClose
}: {
  editEvent: Event | null;
  draft: EventDraft;
  setDraft: (fn: (d: EventDraft) => EventDraft) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto" style={{ animation: 'slideUp 0.3s ease-out' }}>
        <div className="w-10 h-1 bg-amber-200 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            {editEvent ? '编辑事件' : '新事件'}
          </h3>
          {editEvent && <button onClick={onDelete} className="text-red-400 text-sm">删除</button>}
        </div>

        {/* Icon picker */}
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {ICONS.map(ic => (
            <button
              key={ic.id}
              onClick={() => setDraft(d => ({ ...d, icon: ic.id }))}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all shrink-0 ${
                draft.icon === ic.id ? 'bg-[#d48b60] border-[#d48b60] scale-105' : 'bg-white border-amber-100'
              }`}
            >
              {ic.emoji}
            </button>
          ))}
        </div>

        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="标题"
            value={draft.title}
            onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60]"
          />
          <input
            type="date"
            value={draft.date}
            onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
            className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60]"
          />
          <input
            type="text"
            placeholder="地点（可选）"
            value={draft.location}
            onChange={e => setDraft(d => ({ ...d, location: e.target.value }))}
            className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60]"
          />

          {/* Mood picker */}
          <div>
            <p className="text-xs text-[#5c3d2a]/50 mb-1.5">心情</p>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setDraft(d => ({ ...d, mood: d.mood === m.id ? '' : m.id }))}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    draft.mood === m.id ? 'bg-[#d48b60] border-[#d48b60] text-white' : 'bg-white border-[#efd8c3]/60 text-[#5c3d2a]'
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="描述（可选）"
            value={draft.desc}
            onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))}
            rows={3}
            className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60] resize-none"
          />
        </div>

        <button
          onClick={onSave}
          className="w-full py-3 bg-[#3d281c] text-amber-50 rounded-xl font-medium shadow-lg active:scale-[0.98] transition-transform"
        >
          保存
        </button>
      </div>
    </div>
  );
}
