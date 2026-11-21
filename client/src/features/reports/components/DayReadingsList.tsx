import { GlucoseBadge } from '@/features/readings/components/GlucoseBadge';
import type { DayReading } from '../types';

export function DayReadingsList({ readings }: { readings: DayReading[] }) {
  return (
    <ul className="divide-y rounded-xl border" aria-label="Readings for the day">
      {readings.map((reading) => (
        <li key={reading.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm font-medium">{reading.slotLabel}</span>
          <span className="flex items-center gap-3">
            <span className="tabular-nums">
              <span className="text-lg font-semibold">{reading.value}</span>{' '}
              <span className="text-xs text-muted-foreground">mg/dl</span>
            </span>
            <GlucoseBadge value={reading.value} />
          </span>
        </li>
      ))}
    </ul>
  );
}
