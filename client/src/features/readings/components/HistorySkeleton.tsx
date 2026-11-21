import { Skeleton } from '@/components/ui/skeleton';

const MAX_SKELETON_ROWS = 10;

export function HistorySkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading history">
      {Array.from({ length: Math.min(rows, MAX_SKELETON_ROWS) }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full rounded-lg md:h-11" />
      ))}
    </div>
  );
}
