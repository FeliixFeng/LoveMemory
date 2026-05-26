'use client';

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#3d281c] text-amber-50 text-xs px-4 py-2 rounded-full shadow-lg">
      {message}
    </div>
  );
}
