'use client';

import { useEffect, useState, useMemo } from 'react';
import { LoveQuote, Countdown } from '../lib/types';
import { HeroSlide } from '../lib/constants';
import { fmt } from '../lib/utils';
import { SafeImage } from './SafeImage';

export function HeroSection({
  heroImages, animDays, nextDays, startDate, quotes, countdowns,
  onHeroUpload, heroRef, children
}: {
  heroImages: (string | HeroSlide)[]; animDays: number; nextDays: number; startDate: string;
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
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;
    heroImages.slice(0, 3).forEach(s => {
      const src = typeof s === 'string' ? s : (isMobile ? s.mobile : s.web);
      const img = new Image(); img.src = src;
    });
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
    <section className="relative rounded-3xl overflow-hidden shadow-lg aspect-[3/4] md:aspect-[4/3] lg:aspect-[2/1] max-h-[70dvh]" style={{ animation: 'slideUp 0.6s ease-out' }}>
      {/* Image layer - base */}
      {heroImages.map((img, i) => {
        const style = { opacity: heroIdx === i ? 1 : 0, transition: 'opacity 1.5s' };
        if (typeof img === 'string') {
          return (
            <SafeImage key={i} src={img} alt="" fill sizes="100vw" priority={i === 0} className="object-cover" style={style} />
          );
        }
        return (
          <picture key={i}>
            <source media="(max-width: 767px)" srcSet={img.mobile} />
            <SafeImage src={img.web} alt="" fill sizes="100vw" priority={i === 0} className="object-cover" style={style} />
          </picture>
        );
      })}

      {/* Top shadow for controls */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/30 to-transparent z-[1]" />

      {/* 文字区暗斑：只在中央文字块后面聚焦压一层，不整图压暗。
          亮封面（日落/雪山）上没有这层，白字会直接蒸发在高光里 */}
      <div
        aria-hidden
        className="absolute inset-0 z-[2]"
        style={{ background: 'radial-gradient(ellipse 62% 48% at 50% 33%, rgba(0,0,0,0.40), rgba(0,0,0,0.16) 55%, transparent 78%)' }}
      />

      {/* Top status indicator */}
      <div className="absolute top-3 left-3 z-10">
        <div className="px-2 py-0.5 rounded-full bg-black/25 text-[9px] text-emerald-400 font-medium tracking-wide" style={{ fontFamily: 'var(--lm-font-display)' }}>
          {'LOVING'}
        </div>
      </div>

      {/* Countdown card - top right —— 高透明玻璃：底色压到很淡、白字带影保证可读 */}
      {nextDays > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <div
            className="px-3 py-2 rounded-2xl text-center border border-white/20"
            style={{
              minWidth: '72px',
              background: 'linear-gradient(140deg, rgba(255,255,255,0.16), rgba(255,255,255,0.05) 50%, rgba(255,240,228,0.10))',
              backdropFilter: 'blur(12px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(12px) saturate(1.4)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 10px rgba(0,0,0,0.12)'
            }}
          >
            {countdowns.length > 0 ? (
              <>
                <div className="text-[10px] mb-0.5">{countdowns[countdownIdx]?.emoji || '💝'} <span className="text-white/75">{countdowns[countdownIdx]?.label || ''}</span></div>
                <div className="text-lg font-bold text-white leading-none" style={{ fontFamily: 'var(--lm-font-display)', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  {countdownDays[countdownIdx] === Infinity ? '--' : countdownDays[countdownIdx]}
                </div>
                <div className="text-[9px] text-white/60 mt-0.5">天后</div>
              </>
            ) : (
              <>
                <div className="text-[10px] text-white/75 mb-0.5">💝 纪念日</div>
                <div className="text-lg font-bold text-white leading-none" style={{ fontFamily: 'var(--lm-font-display)', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  {nextDays}
                </div>
                <div className="text-[9px] text-white/60 mt-0.5">天后</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info overlay - upper center */}
      <div className="absolute inset-0 flex flex-col items-center text-white text-center z-[4] px-6 pointer-events-none pt-[35%] md:pt-[15%]">
        <span className="text-sm font-medium text-white/90 tracking-[0.3em] uppercase" style={{ fontFamily: 'var(--lm-font-display)', textShadow: '0 1px 10px rgba(0,0,0,0.45)' }}>TOGETHER FOR</span>
        <div className="flex items-baseline mt-1">
          <span className="text-6xl md:text-7xl font-bold leading-none" style={{ fontFamily: 'var(--lm-font-serif)', textShadow: '0 2px 14px rgba(0,0,0,0.55), 0 0 40px rgba(0,0,0,0.25)' }}>{animDays}</span>
          <span className="text-xl font-light italic opacity-70 ml-2 mb-1" style={{ fontFamily: 'var(--lm-font-display)', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>Days</span>
        </div>
        {quotes.length > 0 && (
          <p
            className="text-[11px] text-white/85 italic mt-2"
            style={{ fontFamily: 'var(--lm-font-serif)', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}
          >
            "{quotes[quoteIdx]?.content}"
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-sm text-white/90" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
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
