export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center gap-2 py-10 animate-[fadeIn_0.35s_ease-out]">
        <span className="text-3xl animate-[heartbeat_1.4s_ease-in-out_infinite]">💕</span>
        <p className="text-[11px] text-lm-body/40">正在打开回忆…</p>
      </div>
      <div className="h-40 bg-lm-line/20 rounded-2xl animate-[slideUp_0.45s_ease-out_both]" style={{ animationDelay: '0.04s' }} />
      <div className="h-28 bg-lm-line/15 rounded-2xl animate-[slideUp_0.45s_ease-out_both]" style={{ animationDelay: '0.1s' }} />
      <div className="h-20 bg-lm-line/10 rounded-2xl animate-[slideUp_0.45s_ease-out_both]" style={{ animationDelay: '0.16s' }} />
    </div>
  );
}
