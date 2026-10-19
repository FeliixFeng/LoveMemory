'use client';

import { useEffect } from 'react';

/**
 * 浮层打开时锁定 body 滚动。
 * 用计数支持嵌套（比如事件详情上再弹确认框），只有最后一个浮层关闭时才恢复。
 * iOS 上用 position: fixed 保持当前滚动位置，避免关闭后跳回顶部。
 */

let lockCount = 0;

let saved: {
  position: string;
  top: string;
  width: string;
  overflow: string;
  scrollY: number;
} | null = null;

function applyLock() {
  const body = document.body;
  saved = {
    position: body.style.position,
    top: body.style.top,
    width: body.style.width,
    overflow: body.style.overflow,
    scrollY: window.scrollY,
  };

  body.style.position = 'fixed';
  body.style.top = `-${saved.scrollY}px`;
  body.style.width = '100%';
  body.style.overflow = 'hidden';
}

function releaseLock() {
  if (!saved) return;
  const body = document.body;
  const scrollY = saved.scrollY;

  body.style.position = saved.position;
  body.style.top = saved.top;
  body.style.width = saved.width;
  body.style.overflow = saved.overflow;
  saved = null;

  window.scrollTo(0, scrollY);
}

export function useScrollLock(locked = true) {
  useEffect(() => {
    if (!locked) return;

    lockCount += 1;
    if (lockCount === 1) applyLock();

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) releaseLock();
    };
  }, [locked]);
}
