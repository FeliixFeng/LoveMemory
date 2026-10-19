'use client';

export function FloatingAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-[calc(64px_+_env(safe-area-inset-bottom))] md:bottom-6 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center text-xl text-white shadow-lg hover:shadow-xl active:scale-95 transition-all"
      style={{
        background: 'linear-gradient(135deg, #C49A6C, #A67C52)',
        boxShadow: '0 4px 20px rgba(166,124,82,0.35)'
      }}
      aria-label="添加事件"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>
  );
}
