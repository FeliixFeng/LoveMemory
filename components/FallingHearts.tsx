'use client';

import { useState } from 'react';

export function FallingHearts() {
  const [hearts] = useState(() => Array.from({ length: 6 }).map(() => ({
    left: `${Math.random() * 100}%`, dur: `${15 + Math.random() * 10}s`, delay: `${-Math.random() * 20}s`,
    opacity: 0.1 + Math.random() * 0.3, size: `${16 + Math.random() * 12}px`, sway: `${3 + Math.random() * 2}s`
  })));

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-50" style={{ background: 'rgba(239,216,195,0.4)' }} />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-50" style={{ background: 'rgba(255,182,193,0.3)' }} />
      {hearts.map((h, i) => (
        <div key={i} className="absolute -top-8 animate-fall" style={{ left: h.left, opacity: h.opacity, fontSize: h.size, animationDuration: h.dur, animationDelay: h.delay }}>
          <div className="animate-sway" style={{ animationDuration: h.sway }}>💕</div>
        </div>
      ))}
    </div>
  );
}
