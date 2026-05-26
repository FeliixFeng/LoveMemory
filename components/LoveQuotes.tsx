'use client';

import { useEffect, useState } from 'react';
import { LoveQuote } from '../lib/types';

export function LoveQuotes({ quotes }: { quotes: LoveQuote[] }) {
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    if (quotes.length <= 1) return;
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % quotes.length), 4500);
    return () => clearInterval(t);
  }, [quotes.length]);

  if (quotes.length === 0) return null;

  return (
    <div className="text-center py-2" style={{ animation: 'slideUp 0.6s ease-out 0.05s both' }}>
      <div className="relative h-8 overflow-hidden">
        {quotes.map((quote, i) => (
          <p
            key={quote.id}
            className="absolute inset-0 flex items-center justify-center text-sm text-[#aa6f4d] italic transition-opacity duration-1000"
            style={{
              fontFamily: 'Noto Serif SC, serif',
              opacity: quoteIdx === i ? 1 : 0
            }}
          >
            "{quote.content}"
          </p>
        ))}
      </div>
    </div>
  );
}
