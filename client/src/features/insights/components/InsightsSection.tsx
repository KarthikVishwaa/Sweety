import { StaggerGroup, StaggerItem } from '@/components/motion/Stagger';
import { ReadingsError } from '@/features/readings/components/ReadingsError';
import { formatMonth } from '../month';
import type { Insights } from '../types';
import { useInsights } from '../useInsights';
import { ConsistencyCard } from './ConsistencyCard';
import { DailyAverages } from './DailyAverages';
import { Highlights } from './Highlights';
import { InsightsEmpty } from './InsightsEmpty';
import { InsightsSkeleton } from './InsightsSkeleton';
import { MonthComparison } from './MonthComparison';
import { MonthPicker } from './MonthPicker';
import { Observations } from './Observations';
import { RecentReadings } from './RecentReadings';
import { SlotAverages } from './SlotAverages';
import { SummaryTiles } from './SummaryTiles';
import { TimeInRange } from './TimeInRange';

interface InsightsSectionProps {
  month: string;
  isCurrent: boolean;
  onMonthChange: (month: string) => void;
}

function InsightBlocks({ insights }: { insights: Insights }) {
  return (
    <StaggerGroup key={insights.month} className="space-y-4">
      <StaggerItem>
        <SummaryTiles insights={insights} />
      </StaggerItem>
      <StaggerItem>
        <TimeInRange bands={insights.bands} />
      </StaggerItem>
      <StaggerItem className="grid gap-4 md:grid-cols-2">
        <SlotAverages bySlot={insights.bySlot} highestSlot={insights.highestSlot} />
        <MonthComparison comparison={insights.comparison} />
      </StaggerItem>
      <StaggerItem className="grid gap-4 md:grid-cols-2">
        <ConsistencyCard consistency={insights.consistency} />
        <Highlights highlights={insights.highlights} />
      </StaggerItem>
      <StaggerItem>
        <DailyAverages range={insights.range} days={insights.days} />
      </StaggerItem>
      <StaggerItem className="grid gap-4 md:grid-cols-2">
        <RecentReadings recent={insights.recent} />
        <Observations insights={insights} />
      </StaggerItem>
    </StaggerGroup>
  );
}

// The month picker and everything the chosen month shows, with its loading, empty and error states.
export function InsightsSection({ month, isCurrent, onMonthChange }: InsightsSectionProps) {
  const { data, isPending, isError, error, refetch } = useInsights(month);

  return (
    <section aria-label="Month insights" className="space-y-4">
      <MonthPicker month={month} onChange={onMonthChange} isCurrent={isCurrent} />
      {isPending && <InsightsSkeleton />}
      {isError && <ReadingsError message={error.message} onRetry={() => void refetch()} />}
      {data && data.count === 0 && <InsightsEmpty monthLabel={formatMonth(data.month)} />}
      {data && data.count > 0 && <InsightBlocks insights={data} />}
      <p className="text-center text-xs text-muted-foreground">
        Not medical advice. These figures only describe the readings you logged.
      </p>
    </section>
  );
}
