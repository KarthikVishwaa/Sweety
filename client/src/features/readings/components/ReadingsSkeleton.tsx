import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SLOT_KEYS } from '../readings.constants';
import { SLOT_CARD_HEIGHT } from './slotCard.constants';

export function ReadingsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading readings">
      <Skeleton className="h-5 w-40" />
      <div className="grid gap-4 md:grid-cols-2">
        {SLOT_KEYS.map((key) => (
          <Skeleton key={key} className={cn('rounded-xl', SLOT_CARD_HEIGHT)} />
        ))}
      </div>
    </div>
  );
}
