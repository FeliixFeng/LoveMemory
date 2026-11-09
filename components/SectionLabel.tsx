/* 区块小标 —— 短横线 + 字距中文，页头语言的降级版。
   用于浮层内的分节：新建弹窗（描述/心情）、详情弹窗（照片/账单）。 */

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="w-4 h-px bg-lm-accent/60" />
      <span className="text-[10px] tracking-[0.25em] text-lm-body/55">{children}</span>
    </span>
  );
}
