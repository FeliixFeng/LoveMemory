'use client';

export function FloatingAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-[64px] md:bottom-6 right-4 z-[100] w-12 h-12 rounded-full flex items-center justify-center text-xl text-white shadow-lg hover:shadow-xl active:scale-95 transition-all"
      style={{
        background: 'linear-gradient(135deg, #d48b60, #aa6f4d)',
        boxShadow: '0 4px 20px rgba(170,111,77,0.35)'
      }}
      aria-label="添加事件"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>
  );
}
