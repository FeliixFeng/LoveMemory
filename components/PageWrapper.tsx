'use client';

import type { ReactNode } from 'react';

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <main className="max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto pt-16 pb-20 md:pb-8 px-4 md:px-8 flex flex-col gap-4">
      {children}
    </main>
  );
}
