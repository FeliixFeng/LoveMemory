'use client';

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`lm-card rounded-2xl p-4 animate-pulse ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#efd8c3]/40" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-[#efd8c3]/40 rounded w-2/3" />
          <div className="h-2 bg-[#efd8c3]/30 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-[#efd8c3]/30 rounded w-full" />
        <div className="h-2 bg-[#efd8c3]/30 rounded w-4/5" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-[4/5] rounded-xl bg-[#efd8c3]/20 animate-pulse" />
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonGrid />
    </div>
  );
}
