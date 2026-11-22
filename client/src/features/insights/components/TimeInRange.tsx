import { cn } from '@/lib/utils';
import { plural } from '@/lib/plural';
import type { Insights } from '../types';
import { InsightCard } from './InsightCard';

const BANDS = [
  { key: 'low', label: 'Low', color: 'bg-amber-500' },
  { key: 'inRange', label: 'In range', color: 'bg-emerald-500' },
  { key: 'high', label: 'High', color: 'bg-red-500' },
] as const;

// A stacked bar, with the same numbers written out so colour is never the only thing that says it.
export function TimeInRange({ bands }: Pick<Insights, 'bands'>) {
  return (
    <InsightCard title="Time in range">
      <div aria-hidden="true" className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {BANDS.map(({ key, color }) => (
          <div
            key={key}
            className={cn('h-full', color)}
            style={{ width: `${bands.percentages[key]}%` }}
          />
        ))}
      </div>
      <ul className="grid grid-cols-3 gap-2 text-sm">
        {BANDS.map(({ key, label, color }) => (
          <li key={key} className="space-y-0.5">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span aria-hidden="true" className={cn('size-2.5 rounded-full', color)} />
              {label}
            </span>
            <span className="block font-semibold tabular-nums">{bands.percentages[key]}%</span>
            <span className="block text-xs text-muted-foreground">
              {plural(bands.counts[key], 'reading')}
            </span>
          </li>
        ))}
      </ul>
    </InsightCard>
  );
}
