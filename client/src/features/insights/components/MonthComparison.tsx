import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { averageComparison, inRangeComparison } from '../observations';
import type { Comparison } from '../types';
import { InsightCard } from './InsightCard';

function Arrow({ change }: { change: number }) {
  const Icon = change === 0 ? Minus : change > 0 ? ArrowUp : ArrowDown;
  return <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />;
}

// Wording stays neutral: a higher or lower number is described, never called good or bad.
export function MonthComparison({ comparison }: { comparison: Comparison }) {
  const inRange = inRangeComparison(comparison);

  return (
    <InsightCard title="Compared with last month">
      <ul className="space-y-2 text-sm">
        <li className="flex gap-2">
          {comparison.averageChange !== null && <Arrow change={comparison.averageChange} />}
          <span>{averageComparison(comparison)}</span>
        </li>
        {inRange && comparison.inRangeChange !== null && (
          <li className="flex gap-2">
            <Arrow change={comparison.inRangeChange} />
            <span>{inRange}</span>
          </li>
        )}
      </ul>
      {comparison.previousAverage !== null && (
        <p className="text-xs text-muted-foreground">
          Last month: average {comparison.previousAverage} mg/dl,{' '}
          {comparison.previousInRangePercent}% in range.
        </p>
      )}
    </InsightCard>
  );
}
