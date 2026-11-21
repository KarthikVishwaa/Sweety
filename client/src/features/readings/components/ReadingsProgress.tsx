import { cn } from '@/lib/utils';
import { MAX_READINGS_PER_DAY } from '../readings.constants';

export function ReadingsProgress({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-sm font-medium" aria-live="polite">
        {count} of {MAX_READINGS_PER_DAY} readings
      </p>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: MAX_READINGS_PER_DAY }, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 w-6 rounded-full transition-colors',
              index < count ? 'bg-primary' : 'bg-muted',
            )}
          />
        ))}
      </div>
    </div>
  );
}
