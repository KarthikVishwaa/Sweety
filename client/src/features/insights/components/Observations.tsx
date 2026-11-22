import { observations } from '../observations';
import type { Insights } from '../types';
import { InsightCard } from './InsightCard';

// Short lines that only restate the numbers above. They never advise or diagnose.
export function Observations({ insights }: { insights: Insights }) {
  const lines = observations(insights);
  if (lines.length === 0) return null;

  return (
    <InsightCard title="What the numbers show">
      <ul className="list-disc space-y-1.5 pl-5 text-sm">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </InsightCard>
  );
}
