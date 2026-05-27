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
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative w-full sm:max-w-sm bg-[#fdfbf7] rounded-t-2xl sm:rounded-2xl p-5" style={{ animation: 'slideUp 0.3s ease-out' }}>
        <div className="w-10 h-1 bg-amber-200 rounded-full mx-auto mb-4 sm:hidden" />
        <h3 className="text-base font-bold text-[#3d281c] mb-2 text-center" style={{ fontFamily: 'Noto Serif SC, serif' }}>{title}</h3>
        <p className="text-sm text-[#aa6f4d] text-center mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-white border border-[#efd8c3] text-[#3d281c] rounded-xl font-medium">取消</button>
          <button onClick={onConfirm} className={`flex-1 py-3 text-white rounded-xl font-medium ${danger ? 'bg-red-500' : 'bg-[#d48b60]'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
