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
      <div className="absolute inset-0 bg-black/30 modal-backdrop" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto modal-content">
        <div className="w-10 h-1 bg-amber-200 rounded-full mx-auto mt-4 mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-4 pb-3 border-b border-[#efd8c3]/20">
          <h3 className="text-base font-bold text-[#3d281c]" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            {editEvent ? '✏️ 编辑事件' : '✨ 新事件'}
          </h3>
          {editEvent && (
            <button onClick={onDelete} className="px-3 py-1.5 text-xs rounded-lg text-red-400 bg-red-50 hover:bg-red-100 transition-colors">删除</button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Icon picker */}
          <div>
            <p className="text-xs text-[#5c3d2a]/50 mb-2">选择图标</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {ICONS.map(ic => (
                <button
                  key={ic.id}
                  onClick={() => setDraft(d => ({ ...d, icon: ic.id }))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 transition-all shrink-0 ${
                    draft.icon === ic.id ? 'bg-gradient-to-br from-[#d48b60] to-[#aa6f4d] border-[#d48b60] scale-110 shadow-md text-white' : 'bg-white border-[#efd8c3]/40 hover:border-[#d48b60]/40'
                  }`}
                >
                  {ic.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#5c3d2a]/50 mb-1 block">标题</label>
              <input
                type="text"
                placeholder="给这个回忆起个名字..."
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#5c3d2a]/50 mb-1 block">日期</label>
              <input
                type="date"
                value={draft.date}
                onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#5c3d2a]/50 mb-1 block">地点</label>
              <input
                type="text"
                placeholder="在哪里发生的..."
                value={draft.location}
                onChange={e => setDraft(d => ({ ...d, location: e.target.value }))}
                className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60] transition-colors"
              />
            </div>
          </div>

          {/* Mood picker */}
          <div>
            <p className="text-xs text-[#5c3d2a]/50 mb-2">心情</p>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setDraft(d => ({ ...d, mood: d.mood === m.id ? '' : m.id }))}
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                    draft.mood === m.id ? 'bg-gradient-to-r from-[#d48b60] to-[#aa6f4d] border-[#d48b60] text-white shadow-sm' : 'bg-white border-[#efd8c3]/60 text-[#5c3d2a] hover:border-[#d48b60]/40'
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-[#5c3d2a]/50 mb-1 block">描述</label>
            <textarea
              placeholder="记录一下这个美好的瞬间..."
              value={draft.desc}
              onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))}
              rows={3}
              className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-[#efd8c3]/20 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-[#efd8c3] text-[#3d281c] rounded-xl font-medium active:scale-[0.98] transition-transform">取消</button>
          <button onClick={onSave} className="flex-1 py-3 bg-gradient-to-r from-[#d48b60] to-[#aa6f4d] text-white rounded-xl font-medium shadow-lg active:scale-[0.98] transition-transform">保存</button>
        </div>
      </div>
    </div>
  );
}
