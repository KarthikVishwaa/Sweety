import { Skeleton } from '@/components/ui/skeleton';
import { STAT_CARD_HEIGHT } from './statCard.constants';

export function ReportSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading report">
      <Skeleton className="h-5 w-40" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className={`${STAT_CARD_HEIGHT} rounded-xl`} />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
