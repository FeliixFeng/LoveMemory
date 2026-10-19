'use client';

import type { ReactNode } from 'react';

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <main className="max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto pt-16 pb-[calc(5rem_+_env(safe-area-inset-bottom))] md:pb-8 px-4 md:px-8 flex flex-col gap-4">
      {children}
    </main>
  );
}
