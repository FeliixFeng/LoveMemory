/* 页面页头 —— 短横线 + 字距英文小标 + 衬线中文标题（设置页首发，全站统一）。
   不用 emoji：各平台渲染不一，是 DIY 模板感的来源。 */

export function PageHeader({ label, title, children }: { label: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 pt-1">
      <span aria-hidden className="w-5 h-px bg-lm-accent/60" />
      <span className="text-[10px] tracking-[0.35em] uppercase text-lm-accent font-display">{label}</span>
      <h1 className="ml-auto text-lg font-bold text-lm-ink font-serif-cn">{title}</h1>
      {children}
    </div>
  );
}
