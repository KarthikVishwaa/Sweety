import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRange } from '@/lib/date';
import type { Report } from '../types';
import { DayReadingsList } from './DayReadingsList';
import { ReportEmpty } from './ReportEmpty';
import { StatCards } from './StatCards';

const GlucoseChart = lazy(() =>
  import('./GlucoseChart').then((module) => ({ default: module.GlucoseChart })),
);

interface ReportBodyProps {
  report: Report;
  onAddReading: () => void;
}

export function ReportBody({ report, onAddReading }: ReportBodyProps) {
  const { type, from, to, count, highest, lowest, average, readings, days } = report;
  const isDaily = type === 'daily';

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">{formatRange(from, to)}</p>
      {count === 0 || highest === null || lowest === null || average === null ? (
        <ReportEmpty onAddReading={isDaily ? onAddReading : undefined} />
      ) : (
        <>
          <StatCards highest={highest} lowest={lowest} average={average} count={count} />
          {isDaily && readings && <DayReadingsList readings={readings} />}
          {!isDaily && days && (
            <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
              <GlucoseChart from={from} to={to} days={days} />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}
