export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-line/70 ${className}`} />
);

export const SkeletonRows = ({ rows = 5, cols = 4 }) => (
  <div className="divide-y divide-line">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
        {Array.from({ length: cols }).map((__, colIndex) => (
          <Skeleton
            key={colIndex}
            className={`h-3.5 ${colIndex === 0 ? 'w-40' : 'w-24'}`}
          />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonCards = ({ count = 4 }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="rounded-lg border border-line bg-surface p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-7 w-16" />
      </div>
    ))}
  </div>
);

export default Skeleton;
