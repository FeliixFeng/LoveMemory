'use client';

import { useEffect, useState } from 'react';

const PARTICLES = ['💕', '✨', '🌸', '💫', '🩷', '🌺'];
const PARTICLE_COUNT = 12;

type Particle = { emoji: string; left: string; dur: string; delay: string; opacity: number; size: string; sway: string };

export function FallingHearts() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
      emoji: PARTICLES[i % PARTICLES.length],
      left: `${Math.random() * 100}%`,
      dur: `${18 + Math.random() * 14}s`,
      delay: `${-Math.random() * 25}s`,
      opacity: 0.1 + Math.random() * 0.2,
      size: `${14 + Math.random() * 10}px`,
      sway: `${4 + Math.random() * 3}s`,
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute -top-8 animate-fall"
          style={{ left: p.left, opacity: p.opacity, fontSize: p.size, animationDuration: p.dur, animationDelay: p.delay }}
        >
          <div className="animate-sway" style={{ animationDuration: p.sway }}>{p.emoji}</div>
        </div>
      ))}
    </div>
  );
}
