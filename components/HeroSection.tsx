'use client';

import { useEffect, useState } from 'react';
import { LoveQuote } from '../lib/types';
import { fmt } from '../lib/utils';

export function HeroSection({
  heroImages, saving, animDays, nextDays, startDate, quotes,
  onCoverMenu, onHeroUpload, heroRef
}: {
  heroImages: string[]; saving: boolean; animDays: number; nextDays: number; startDate: string;
  quotes: LoveQuote[];
  onCoverMenu: () => void; onHeroUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; heroRef: React.RefObject<any>;
}) {
  const [heroIdx, setHeroIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const t = setInterval(() => setHeroIdx(i => (i + 1) % heroImages.length), 6000);
    return () => clearInterval(t);
  }, [heroImages.length]);

  useEffect(() => {
    heroImages.forEach(src => { const img = new Image(); img.src = src; });
  }, [heroImages]);

  useEffect(() => {
    if (quotes.length <= 1) return;
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % quotes.length), 4500);
    return () => clearInterval(t);
  }, [quotes.length]);

  return (
    <section className="relative rounded-3xl overflow-hidden shadow-lg aspect-[3/4] md:aspect-[4/3] lg:aspect-[16/9]" style={{ animation: 'slideUp 0.6s ease-out' }}>
      {heroImages.map((img, i) => <img key={i} src={img} alt="" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: heroIdx === i ? 1 : 0, transition: 'opacity 1.5s' }} />)}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
      <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 text-white text-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" onClick={onCoverMenu}>✏</button>
      <div className="absolute top-4 left-4"><div className="px-2.5 py-1 rounded-full bg-black/30 text-[10px] text-emerald-400 font-medium tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>{saving ? 'SYNCING' : 'LOVING'}</div></div>
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <span className="text-[10px] font-medium text-white/70 tracking-[0.3em] uppercase" style={{ fontFamily: 'Playfair Display, serif' }}>TOGETHER FOR</span>
        <div className="flex items-baseline mt-1">
          <span className="text-7xl font-bold leading-none" style={{ fontFamily: 'Noto Serif SC, serif', textShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>{animDays}</span>
          <span className="text-2xl font-light italic opacity-80 ml-2 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Days</span>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-white/70">
          <span>📅 {fmt(startDate)}</span><span>·</span><span>⏰ 下次 {nextDays} 天</span>
        </div>
        {quotes.length > 0 && (
          <div className="relative h-6 mt-2 overflow-hidden">
            {quotes.map((q, i) => (
              <p
                key={q.id}
                className="absolute inset-0 flex items-center text-xs text-white/60 italic transition-opacity duration-1000"
                style={{ fontFamily: 'Noto Serif SC, serif', opacity: quoteIdx === i ? 1 : 0 }}
              >
                "{q.content}"
              </p>
            ))}
          </div>
        )}
      </div>
      <input ref={heroRef} type="file" accept="image/*" className="hidden" onChange={onHeroUpload} />
    </section>
  );
}
