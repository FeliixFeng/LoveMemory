'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { shouldBypassNextImage } from '../lib/image';

type SafeImageProps = Omit<ImageProps, 'onError'> & {
  fallbackSrc?: string;
};

export function SafeImage({ fallbackSrc, alt, src, unoptimized, ...props }: SafeImageProps) {
  const [state, setState] = useState<{
    forSrc: SafeImageProps['src'];
    usedFallback: boolean;
    failed: boolean;
  }>({
    forSrc: src,
    usedFallback: false,
    failed: false
  });

  // src 变更时重置失败/降级状态，避免复用节点（如轮播、切换城市）沿用旧状态
  const activeState =
    state.forSrc === src
      ? state
      : { forSrc: src, usedFallback: false, failed: false };

  const activeSrc =
    activeState.usedFallback && fallbackSrc && fallbackSrc !== src
      ? fallbackSrc
      : src;

  if (activeState.failed || !activeSrc) {
    return (
      <div className="flex items-center justify-center bg-lm-line/30 text-lm-body/30 w-full h-full">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
        </svg>
      </div>
    );
  }

  const resolvedStr = typeof activeSrc === 'string' ? activeSrc : '';
  const bypass = unoptimized ?? shouldBypassNextImage(resolvedStr);

  return (
    <Image
      {...props}
      src={activeSrc}
      alt={alt || ''}
      unoptimized={bypass}
      onError={() => {
        if (!activeState.usedFallback && fallbackSrc && fallbackSrc !== src) {
          setState({ forSrc: src, usedFallback: true, failed: false });
        } else {
          setState({ forSrc: src, usedFallback: activeState.usedFallback, failed: true });
        }
      }}
    />
  );
}
