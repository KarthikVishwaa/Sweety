import { Skeleton } from '@/components/ui/skeleton';
import { SLOT_KEYS } from '../readings.constants';

export function ReadingsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading readings">
      <Skeleton className="h-5 w-40" />
      <div className="grid gap-4 md:grid-cols-2">
        {SLOT_KEYS.map((key) => (
          <Skeleton key={key} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
