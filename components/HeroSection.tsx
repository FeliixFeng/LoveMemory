'use client';

import { useEffect, useState, useMemo } from 'react';
import { LoveQuote, Countdown } from '../lib/types';
import { fmt } from '../lib/utils';
import { SafeImage } from './SafeImage';

export function HeroSection({
  heroImages, saving, animDays, nextDays, startDate, quotes, countdowns,
  onHeroUpload, heroRef, children
}: {
  heroImages: string[]; saving: boolean; animDays: number; nextDays: number; startDate: string;
  quotes: LoveQuote[];
  countdowns: Countdown[];
  onHeroUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  heroRef: React.RefObject<any>;
  children?: React.ReactNode;
}) {
  const [heroIdx, setHeroIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [countdownIdx, setCountdownIdx] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroImages.length), 6000);
    return () => clearInterval(t);
  }, [heroImages.length]);

  useEffect(() => {
    heroImages.slice(0, 3).forEach(src => { const img = new Image(); img.src = src; });
  }, [heroImages]);

  useEffect(() => {
    if (quotes.length <= 1) return;
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % quotes.length), 4500);
    return () => clearInterval(t);
  }, [quotes.length]);

  useEffect(() => {
    if (countdowns.length <= 1) return;
    const t = setInterval(() => setCountdownIdx(i => (i + 1) % countdowns.length), 3500);
    return () => clearInterval(t);
  }, [countdowns.length]);

  // Calculate days remaining for each countdown
  const countdownDays = useMemo(() => {
    return countdowns.map(c => {
      if (!c.date) return Infinity;
      const now = new Date();
      const target = new Date(`${c.date}T00:00:00`);
      // Find next occurrence (this year or next)
      let next = new Date(now.getFullYear(), target.getMonth(), target.getDate());
      if (next.getTime() < now.getTime()) next.setFullYear(next.getFullYear() + 1);
      return Math.ceil((next.getTime() - now.getTime()) / 86400000);
    });
  }, [countdowns]);

  return (
    <section className="relative rounded-3xl overflow-hidden shadow-lg aspect-[3/4] md:aspect-[4/3] lg:aspect-[2/1]" style={{ animation: 'slideUp 0.6s ease-out' }}>
      {/* Image layer - base */}
      {heroImages.map((img, i) => (
        <SafeImage
          key={i} src={img} alt=""
          fill
          sizes="100vw"
          priority={i === 0}
          className="object-cover"
          style={{ opacity: heroIdx === i ? 1 : 0, transition: 'opacity 1.5s' }}
        />
      ))}

      {/* Top shadow for controls */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/30 to-transparent z-[1]" />

      {/* Top status indicator */}
      <div className="absolute top-3 left-3 z-10">
        <div className="px-2 py-0.5 rounded-full bg-black/25 text-[9px] text-emerald-400 font-medium tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>
          {saving ? 'SYNCING' : 'LOVING'}
        </div>
      </div>

      {/* Countdown card - top right */}
      {nextDays > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <div className="px-3 py-2 rounded-2xl bg-black/20 backdrop-blur-sm border border-white/10 text-center" style={{ minWidth: '72px' }}>
            {countdowns.length > 0 ? (
              <>
                <div className="text-[10px] mb-0.5">{countdowns[countdownIdx]?.emoji || '💝'} <span className="text-white/50">{countdowns[countdownIdx]?.label || ''}</span></div>
                <div className="text-lg font-bold text-white leading-none" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  {countdownDays[countdownIdx] === Infinity ? '--' : countdownDays[countdownIdx]}
                </div>
                <div className="text-[9px] text-white/40 mt-0.5">天后</div>
              </>
            ) : (
              <>
                <div className="text-[10px] text-white/50 mb-0.5">💝 纪念日</div>
                <div className="text-lg font-bold text-white leading-none" style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  {nextDays}
                </div>
                <div className="text-[9px] text-white/40 mt-0.5">天后</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info overlay - upper center */}
      <div className="absolute inset-0 flex flex-col items-center text-white text-center z-[4] px-6 pointer-events-none pt-[35%] md:pt-[15%]">
        <span className="text-sm font-medium text-white/90 tracking-[0.3em] uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>TOGETHER FOR</span>
        <div className="flex items-baseline mt-1">
          <span className="text-6xl md:text-7xl font-bold leading-none" style={{ fontFamily: 'Noto Serif SC, serif', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{animDays}</span>
          <span className="text-xl font-light italic opacity-60 ml-2 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>Days</span>
        </div>
        {quotes.length > 0 && (
          <p
            className="text-[11px] text-white/70 italic mt-2"
            style={{ fontFamily: 'Noto Serif SC, serif', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
          >
            "{quotes[quoteIdx]?.content}"
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-sm text-white/90">
          <span>📅 {fmt(startDate)}</span><span>·</span><span>⏰ 下次 {nextDays} 天</span>
        </div>
      </div>

      {/* Timeline overlay - bottom of image */}
      {children && (
        <div className="absolute bottom-0 left-0 right-0 z-[3] bg-gradient-to-t from-black/50 via-black/20 to-transparent pt-10 pb-3">
          {children}
        </div>
      )}

      <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={onHeroUpload} />
    </section>
  );
}
