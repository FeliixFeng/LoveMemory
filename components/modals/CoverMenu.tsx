'use client';

export function CoverMenu({
  hasHeroImage, onChangeCover, onResetDefault, onClose
}: {
  hasHeroImage: boolean;
  onChangeCover: () => void;
  onResetDefault: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm mx-4 mb-4 sm:mb-0 bg-white rounded-2xl overflow-hidden shadow-xl" style={{ animation: 'slideUp 0.3s ease-out' }}>
        <div className="py-2.5 px-4 border-b border-gray-100 text-center"><span className="text-xs text-gray-400 font-medium">Manage Cover</span></div>
        <button onClick={onChangeCover} className="w-full py-3 text-sm text-[#3d281c] border-b border-gray-100">🖼 更换封面</button>
        {hasHeroImage && <button onClick={onResetDefault} className="w-full py-3 text-sm text-red-500 border-b border-gray-100">🗑 恢复默认</button>}
        <button onClick={onClose} className="w-full py-3 text-sm text-gray-500">取消</button>
      </div>
    </div>
  );
}
