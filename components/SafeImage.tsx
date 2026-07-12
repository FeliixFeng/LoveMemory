'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';

type SafeImageProps = Omit<ImageProps, 'onError'> & {
  fallbackSrc?: string;
};

export function SafeImage({ fallbackSrc, alt, ...props }: SafeImageProps) {
  const [error, setError] = useState(false);

  if (error || !props.src) {
    return (
      <div className="flex items-center justify-center bg-[#efd8c3]/30 text-[#5c3d2a]/30">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      {...props}
      alt={alt || ''}
      onError={() => setError(true)}
    />
  );
}
