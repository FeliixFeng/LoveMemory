export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-6 w-24 bg-lm-line/20 rounded-lg animate-pulse" />
      <div className="h-40 bg-lm-line/20 rounded-2xl animate-pulse" />
      <div className="h-28 bg-lm-line/20 rounded-2xl animate-pulse" />
      <div className="h-20 bg-lm-line/20 rounded-2xl animate-pulse" />
    </div>
  );
}
