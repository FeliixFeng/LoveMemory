'use client';

export function NavBar({ onSettings, onPin, isAuthenticated }: { onSettings: () => void; onPin: () => void; isAuthenticated: boolean }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fdfbf7]/90 border-b border-[#efd8c3]/30 px-4 py-2">
      <div className="max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#aa6f4d] uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>TODAY</span>
          <span className="text-sm font-semibold text-[#3d281c]">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-gradient" style={{ fontFamily: 'Noto Serif SC, serif' }}>珍藏回忆</span>
          <span className="text-[8px] text-[#aa6f4d] tracking-[0.3em] uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>OUR STORY</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onPin} className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm transition-colors ${isAuthenticated ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-[#efd8c3] text-[#5c3d2a]/50 hover:bg-amber-50'}`}>
            {isAuthenticated ? '✓' : '🔒'}
          </button>
          <button onClick={onSettings} className="w-8 h-8 rounded-full bg-white border border-[#efd8c3] flex items-center justify-center text-sm hover:bg-amber-50">⚙</button>
        </div>
      </div>
    </nav>
  );
}
