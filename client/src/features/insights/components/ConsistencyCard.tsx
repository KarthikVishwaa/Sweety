import { plural } from '@/lib/plural';
import type { Consistency } from '../types';
import { InsightCard } from './InsightCard';

export function ConsistencyCard({ consistency }: { consistency: Consistency }) {
  const rows = [
    ['Days logged', `${consistency.daysLogged} of ${consistency.daysInPeriod}`],
    ['Current streak', plural(consistency.currentStreak, 'day')],
    ['Longest streak', plural(consistency.longestStreak, 'day')],
    ['Completion', `${consistency.completionPercent}%`],
  ] as const;

  return (
    <InsightCard title="Consistency">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </InsightCard>
  );
}
