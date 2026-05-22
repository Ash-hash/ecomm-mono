export function SkeletonCards() {
  return (
    <div className="grid grid-cols-4 gap-6">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-24 bg-zinc-800 animate-pulse rounded-xl" />
      ))}
    </div>
  );
}