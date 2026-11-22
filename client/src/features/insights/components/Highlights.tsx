import { formatDisplayDate } from '@/lib/date';
import type { Highlight, Insights } from '../types';
import { InsightCard } from './InsightCard';

function Row({ label, highlight }: { label: string; highlight: Highlight | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">
        {highlight ? (
          <>
            <span className="tabular-nums">{highlight.value} mg/dl</span>
            <span className="block text-xs font-normal text-muted-foreground">
              {formatDisplayDate(highlight.date)}, {highlight.slotLabel}
            </span>
          </>
        ) : (
          '–'
        )}
      </dd>
    </div>
  );
}

export function Highlights({ highlights }: Pick<Insights, 'highlights'>) {
  return (
    <InsightCard title="Highlights">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Row label="Highest reading" highlight={highlights.highest} />
        <Row label="Lowest reading" highlight={highlights.lowest} />
      </dl>
    </InsightCard>
  );
}
