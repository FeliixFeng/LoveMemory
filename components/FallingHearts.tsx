'use client';

import { useState, useMemo } from 'react';

const PARTICLES = ['💕', '✨', '🌸', '💫', '🩷', '🌺'];
const BOKEH_COUNT = 4;
const PARTICLE_COUNT = 12;
const SPARKLE_COUNT = 8;

export function FallingHearts() {
  const bokeh = useMemo(() => Array.from({ length: BOKEH_COUNT }).map((_, i) => ({
    left: `${15 + Math.random() * 70}%`,
    top: `${10 + Math.random() * 80}%`,
    size: 180 + Math.random() * 200,
    color: i % 2 === 0 ? 'rgba(239,216,195,0.25)' : 'rgba(255,182,193,0.2)',
    drift: `${20 + Math.random() * 15}s`,
    delay: `${-Math.random() * 20}s`,
  })), []);

  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
    emoji: PARTICLES[i % PARTICLES.length],
    left: `${Math.random() * 100}%`,
    dur: `${18 + Math.random() * 14}s`,
    delay: `${-Math.random() * 25}s`,
    opacity: 0.08 + Math.random() * 0.18,
    size: `${14 + Math.random() * 10}px`,
    sway: `${4 + Math.random() * 3}s`,
  })), []);

  const sparkles = useMemo(() => Array.from({ length: SPARKLE_COUNT }).map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    dur: `${3 + Math.random() * 4}s`,
    delay: `${-Math.random() * 5}s`,
    size: 2 + Math.random() * 3,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      {/* Bokeh light spots */}
      {bokeh.map((b, i) => (
        <div
          key={`b${i}`}
          className="absolute rounded-full animate-drift"
          style={{
            left: b.left, top: b.top,
            width: b.size, height: b.size,
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            animationDuration: b.drift, animationDelay: b.delay,
            filter: 'blur(40px)',
          }}
        />
      ))}

      {/* Falling particles */}
      {particles.map((p, i) => (
        <div
          key={`p${i}`}
          className="absolute -top-8 animate-fall"
          style={{ left: p.left, opacity: p.opacity, fontSize: p.size, animationDuration: p.dur, animationDelay: p.delay }}
        >
          <div className="animate-sway" style={{ animationDuration: p.sway }}>{p.emoji}</div>
        </div>
      ))}

      {/* Sparkles */}
      {sparkles.map((s, i) => (
        <div
          key={`s${i}`}
          className="absolute animate-sparkle"
          style={{
            left: s.left, top: s.top,
            width: s.size, height: s.size,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
            boxShadow: '0 0 6px rgba(255,255,255,0.4)',
            animationDuration: s.dur, animationDelay: s.delay,
          }}
        />
      ))}
    </div>
  );
}
