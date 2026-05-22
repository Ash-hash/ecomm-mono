export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse border rounded-xl p-3">
      <div className="aspect-square bg-gray-200 rounded-md"></div>
      <div className="h-4 bg-gray-200 mt-3 w-3/4"></div>
      <div className="h-4 bg-gray-200 mt-2 w-1/2"></div>
      <div className="h-8 bg-gray-200 mt-4 rounded"></div>
    </div>
  );
}