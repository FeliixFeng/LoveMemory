'use client';

import { Event } from '../lib/types';
import { ICONS, MOODS } from '../lib/constants';
import { Overlay } from './ui/Overlay';

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
    <Overlay
      onClose={onClose}
      layer="modal"
      panelClassName="w-full sm:max-w-md bg-lm-bg rounded-t-2xl sm:rounded-2xl max-h-[88dvh] overflow-y-auto pb-[env(safe-area-inset-bottom)] sm:shadow-2xl"
    >
        <div className="w-10 h-1 bg-lm-line rounded-full mx-auto mt-4 mb-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h3 className="text-[15px] font-bold text-lm-ink font-serif-cn">
            {editEvent ? '编辑事件' : '新事件'}
          </h3>
          {editEvent && (
            <button
              onClick={onDelete}
              className="px-2.5 h-7 text-[11px] rounded-full text-red-500/85 bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              删除
            </button>
          )}
        </div>

        <div className="px-5 pb-1 space-y-5">
          {/* Icon picker：全展开，不用横向滑 */}
          <div>
            <p className="text-[11px] text-lm-body/45 mb-2">图标</p>
            <div className="grid grid-cols-8 gap-1.5">
              {ICONS.map(ic => {
                const on = draft.icon === ic.id;
                return (
                  <button
                    key={ic.id}
                    onClick={() => setDraft(d => ({ ...d, icon: ic.id }))}
                    title={ic.label}
                    aria-pressed={on}
                    className={`h-10 rounded-lg flex items-center justify-center text-[17px] border-2 transition-all ${
                      on
                        ? 'bg-white border-lm-accent shadow-[0_2px_10px_rgba(204,146,102,0.25)]'
                        : 'bg-white/60 border-transparent hover:bg-white hover:border-lm-line'
                    }`}
                  >
                    {ic.emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 表单：标签在左、输入在右，一张表到底 */}
          <div className="rounded-xl border border-lm-line/60 bg-white/50 divide-y divide-lm-line/50 overflow-hidden">
            <label className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="w-8 shrink-0 text-[11px] text-lm-body/45">标题</span>
              <input
                type="text"
                placeholder="给这个回忆起个名字…"
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                className="flex-1 min-w-0 bg-transparent text-sm text-lm-ink outline-none placeholder:text-lm-body/25"
              />
            </label>
            <label className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="w-8 shrink-0 text-[11px] text-lm-body/45">日期</span>
              <input
                type="date"
                value={draft.date}
                onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
                className="flex-1 min-w-0 bg-transparent text-sm text-lm-ink outline-none tabular-nums"
              />
            </label>
            <label className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="w-8 shrink-0 text-[11px] text-lm-body/45">地点</span>
              <input
                type="text"
                placeholder="在哪里发生的…"
                value={draft.location}
                onChange={e => setDraft(d => ({ ...d, location: e.target.value }))}
                className="flex-1 min-w-0 bg-transparent text-sm text-lm-ink outline-none placeholder:text-lm-body/25"
              />
            </label>
          </div>

          {/* Mood picker */}
          <div>
            <p className="text-[11px] text-lm-body/45 mb-2">心情</p>
            <div className="flex gap-1.5 flex-wrap">
              {MOODS.map(m => {
                const on = draft.mood === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setDraft(d => ({ ...d, mood: d.mood === m.id ? '' : m.id }))}
                    aria-pressed={on}
                    className={`px-2.5 h-8 rounded-full text-[11px] border-2 transition-all ${
                      on
                        ? 'bg-white border-lm-accent text-lm-ink shadow-[0_2px_8px_rgba(204,146,102,0.2)]'
                        : 'bg-white/45 border-transparent text-lm-body/70 hover:bg-white hover:border-lm-line'
                    }`}
                  >
                    {m.emoji} {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[11px] text-lm-body/45 mb-2">描述</p>
            <textarea
              placeholder="记录一下这个美好的瞬间…"
              value={draft.desc}
              onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))}
              rows={3}
              className="w-full bg-white/50 border border-lm-line/60 rounded-xl px-3.5 py-2.5 text-sm text-lm-ink outline-none focus:border-lm-accent focus:bg-white transition-colors resize-none placeholder:text-lm-body/25"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 mt-3 border-t border-lm-line/40 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-white/60 border border-lm-line/60 text-lm-ink text-sm font-medium hover:bg-white active:scale-[0.98] transition-all"
          >
            取消
          </button>
          <button
            onClick={onSave}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-lm-accent to-lm-accent-deep text-white text-sm font-medium shadow-[0_4px_14px_rgba(173,124,87,0.3)] active:scale-[0.98] transition-transform"
          >
            保存
          </button>
        </div>
    </Overlay>
  );
}
