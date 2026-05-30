'use client';

export function FloatingAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-[64px] md:bottom-6 right-4 z-[100] w-14 h-14 rounded-full lm-btn flex items-center justify-center text-2xl shadow-xl active:scale-95 transition-transform"
      aria-label="添加事件"
    >
      +
    </button>
  );
}
