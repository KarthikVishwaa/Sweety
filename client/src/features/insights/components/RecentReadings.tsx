import { GlucoseBadge } from '@/features/readings/components/GlucoseBadge';
import { formatDisplayDate } from '@/lib/date';
import type { RecentReading } from '../types';
import { InsightCard } from './InsightCard';

export function RecentReadings({ recent }: { recent: RecentReading[] }) {
  return (
    <InsightCard title="Recent readings">
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">No readings yet.</p>
      ) : (
        <ul className="divide-y text-sm">
          {recent.map((reading) => (
            <li key={reading.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="block font-medium tabular-nums">{reading.value} mg/dl</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {formatDisplayDate(reading.date)}, {reading.slotLabel}
                </span>
              </span>
              <GlucoseBadge value={reading.value} />
            </li>
          ))}
        </ul>
      )}
    </InsightCard>
  );
}
