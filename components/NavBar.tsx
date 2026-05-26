'use client';

export function NavBar({ onSettings }: { onSettings: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fdfbf7]/90 border-b border-[#efd8c3]/30 px-4 py-3">
      <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#aa6f4d] uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>TODAY</span>
          <span className="text-sm font-semibold text-[#3d281c]">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-gradient" style={{ fontFamily: 'Noto Serif SC, serif' }}>珍藏回忆</span>
          <span className="text-[8px] text-[#aa6f4d] tracking-[0.3em] uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>OUR STORY</span>
        </div>
        <button onClick={onSettings} className="w-8 h-8 rounded-full bg-white border border-[#efd8c3] flex items-center justify-center text-sm hover:bg-amber-50">⚙</button>
      </div>
    </nav>
  );
}
