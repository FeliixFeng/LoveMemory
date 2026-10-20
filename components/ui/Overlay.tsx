'use client';

import { useEffect, useRef, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useOverlayLayer } from '../../hooks/useOverlayLayer';

/** 全站层级规范，避免各处 z-index 各写各的 */
export const Z_LAYER = {
  nav: 40,
  sheet: 50,
  modal: 60,
  lightbox: 70,
  toast: 80,
} as const;

type OverlayProps = {
  onClose: () => void;
  children: ReactNode;
  /** 层级：底部抽屉 50 / 居中弹窗 60 / 灯箱 70 */
  layer?: keyof typeof Z_LAYER;
  /** 面板标题元素的 id，用于 aria-labelledby */
  labelledBy?: string;
  backdropClassName?: string;
  panelClassName?: string;
  closeOnBackdrop?: boolean;
};

/**
 * 统一浮层容器：
 * - 锁 body 滚动（含嵌套计数）
 * - 点遮罩关闭、Esc 关闭
 * - 焦点移入面板 + Tab 循环（简单焦点陷阱）
 * - 关闭后焦点回到触发元素
 */
export function Overlay({
  onClose,
  children,
  layer = 'modal',
  labelledBy,
  backdropClassName = 'bg-black/30',
  panelClassName = '',
  closeOnBackdrop = true,
}: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const { isTop } = useOverlayLayer();

  const dragRef = useRef({ active: false, startY: 0, prevY: 0, prevT: 0, dy: 0 });

  function handleDragStart(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const d = dragRef.current;
    const now = performance.now();
    d.active = true;
    d.startY = e.clientY;
    d.prevY = e.clientY;
    d.prevT = now;
    d.dy = 0;
    const panel = panelRef.current;
    if (panel) {
      panel.style.transition = 'none';
      panel.style.transform = 'translateY(0)';
    }
  }

  function handleDragMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d.active) return;
    d.dy = Math.max(0, e.clientY - d.startY);
    d.prevY = e.clientY;
    d.prevT = performance.now();
    const panel = panelRef.current;
    if (panel) panel.style.transform = `translateY(${d.dy}px)`;
  }

  function handleDragEnd(e: ReactPointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    const panel = panelRef.current;
    if (!panel) return;
    const velocity = (e.clientY - d.prevY) / Math.max(1, performance.now() - d.prevT);
    if (d.dy >= 24 && (d.dy > panel.offsetHeight * 0.3 || velocity > 0.6)) {
      onCloseRef.current();
      return;
    }
    panel.style.transition = 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)';
    panel.style.transform = '';
  }

  useScrollLock(true);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    const prevFocus = document.activeElement as HTMLElement | null;

    const target = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel;
    target?.focus({ preventScroll: true });

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // 只关最上面那一层
        if (!isTop()) return;
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab' || !panel) return;

      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => el.offsetParent !== null || el === document.activeElement);

      if (nodes.length === 0) {
        e.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center"
      style={{ zIndex: Z_LAYER[layer] }}
    >
      <div
        className={`absolute inset-0 ${backdropClassName} animate-[fadeIn_0.2s_ease-out]`}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative lm-scroll-contain outline-none ${panelClassName}`}
      >
        {layer === 'sheet' && (
          <div
            aria-hidden="true"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            className="sticky top-0 z-10 flex touch-none select-none items-center justify-center bg-inherit py-2.5 cursor-grab active:cursor-grabbing"
          >
            <span className="h-1 w-9 rounded-full bg-lm-line" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
