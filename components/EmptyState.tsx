'use client';

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="px-4" style={{ animation: 'slideUp 0.4s ease-out' }}>
      <div className="lm-card rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-sm font-bold text-[#3d281c] mb-1" style={{ fontFamily: 'Noto Serif SC, serif' }}>
          开始记录你们的故事
        </h3>
        <p className="text-xs text-[#5c3d2a]/50 mb-4">
          创建第一个事件，记录值得珍藏的瞬间
        </p>
        <button
          onClick={onAdd}
          className="px-5 py-2.5 bg-gradient-to-r from-[#d48b60] to-[#aa6f4d] text-white rounded-xl text-sm font-medium shadow-md active:scale-[0.98] transition-transform"
        >
          + 创建回忆
        </button>
      </div>
    </div>
  );
}
