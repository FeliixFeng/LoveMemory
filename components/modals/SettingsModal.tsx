'use client';

export function SettingsModal({
  startDate, onSave, onClose
}: {
  startDate: string;
  onSave: (date: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl p-5" style={{ animation: 'slideUp 0.3s ease-out' }}>
        <div className="w-10 h-1 bg-amber-200 rounded-full mx-auto mb-4" />
        <h3 className="text-base font-bold text-[#3d281c] mb-4 text-center" style={{ fontFamily: 'Noto Serif SC, serif' }}>设置纪念日</h3>
        <input type="date" value={startDate} onChange={e => onSave(e.target.value)} className="w-full bg-white border border-[#efd8c3]/60 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#d48b60] mb-4" />
        <button onClick={onClose} className="w-full py-3 bg-[#3d281c] text-amber-50 rounded-xl font-medium shadow-lg active:scale-[0.98] transition-transform">完成</button>
      </div>
    </div>
  );
}
