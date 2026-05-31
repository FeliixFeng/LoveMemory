'use client';

export function ConfirmDialog({
  title, message, confirmLabel = '删除', danger = true,
  onConfirm, onCancel
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full sm:max-w-sm bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl overflow-hidden" style={{ animation: 'slideUp 0.3s ease-out' }}>
        <div className="w-10 h-1 bg-amber-200 rounded-full mx-auto mt-4 mb-3 sm:hidden" />

        <div className="p-5 text-center">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl ${danger ? 'bg-red-50' : 'bg-amber-50'}`}>
            {danger ? '⚠️' : '❓'}
          </div>

          <h3 className="text-base font-bold text-[#3d281c] mb-2" style={{ fontFamily: 'Noto Serif SC, serif' }}>{title}</h3>
          <p className="text-sm text-[#5c3d2a]/60 mb-6">{message}</p>

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-3 bg-white border border-[#efd8c3] text-[#3d281c] rounded-xl font-medium active:scale-[0.98] transition-transform">取消</button>
            <button onClick={onConfirm} className={`flex-1 py-3 text-white rounded-xl font-medium active:scale-[0.98] transition-transform ${danger ? 'bg-red-500 shadow-red-200' : 'bg-[#d48b60] shadow-amber-200'} shadow-lg`}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
