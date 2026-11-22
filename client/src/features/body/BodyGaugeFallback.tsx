import { GlucoseBadge } from '@/features/readings/components/GlucoseBadge';
import { cn } from '@/lib/utils';
import { glucoseBandColor, glucoseToFill } from './glucoseLevel';

// Shown while the 3D figure loads, or when WebGL is missing or fails: the same information, flat.
export function BodyGaugeFallback({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex h-full w-full items-center justify-center gap-5 rounded-xl border bg-card p-4',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <span className="text-4xl font-semibold tabular-nums">{value ?? '–'}</span>
        <span className="text-xs text-muted-foreground">mg/dl</span>
        {value !== null && <GlucoseBadge value={value} />}
      </div>
      <div className="relative h-full max-h-56 w-4 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-x-0 bottom-0 h-full origin-bottom rounded-full transition-transform duration-700 motion-reduce:transition-none"
          style={{
            backgroundColor: glucoseBandColor(value),
            transform: `scaleY(${glucoseToFill(value)})`,
          }}
        />
      </div>
    </div>
  );
}
