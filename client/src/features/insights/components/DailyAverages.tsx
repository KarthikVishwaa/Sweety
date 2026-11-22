import { VisuallyHiddenTable } from '@/components/layout/VisuallyHiddenTable';
import { GlucoseChart } from '@/features/reports/components/GlucoseChart';
import { formatDisplayDate } from '@/lib/date';
import type { Insights } from '../types';
import { InsightCard } from './InsightCard';

export function DailyAverages({ range, days }: Pick<Insights, 'range' | 'days'>) {
  return (
    <InsightCard title="Daily average">
      <GlucoseChart from={range.from} to={range.to} days={days} />
      <VisuallyHiddenTable
        caption="Daily average glucose"
        headers={['Date', 'Average (mg/dl)', 'Lowest', 'Highest', 'Readings']}
        rows={days.map((day) => [
          formatDisplayDate(day.date),
          day.average,
          day.lowest,
          day.highest,
          day.count,
        ])}
      />
    </InsightCard>
  );
}
