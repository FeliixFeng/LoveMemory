'use client';

import { Z_LAYER } from './ui/Overlay';

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 bg-lm-ink text-amber-50 text-xs px-4 py-2 rounded-full shadow-lg"
      style={{ zIndex: Z_LAYER.toast }}
    >
      {message}
    </div>
  );
}
