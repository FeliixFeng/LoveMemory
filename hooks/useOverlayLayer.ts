'use client';

import { useEffect, useRef } from 'react';

/**
 * 浮层层级栈：保证 Esc 只关掉最上面那一层。
 * 例如「事件详情 → 点开照片灯箱」，Esc 应该只关灯箱，而不是两层一起关。
 */

const stack: symbol[] = [];

export function useOverlayLayer() {
  const idRef = useRef<symbol>(Symbol('overlay-layer'));

  useEffect(() => {
    const id = idRef.current;
    stack.push(id);
    return () => {
      const index = stack.lastIndexOf(id);
      if (index >= 0) stack.splice(index, 1);
    };
  }, []);

  return {
    isTop: () => stack[stack.length - 1] === idRef.current,
  };
}
