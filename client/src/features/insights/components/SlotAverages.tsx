import { useReducedMotion } from 'motion/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { VisuallyHiddenTable } from '@/components/layout/VisuallyHiddenTable';
import { GLUCOSE_THRESHOLDS } from '@/features/readings/readings.constants';
import { SLOT_SHORT_LABELS } from '../insights.constants';
import type { Insights } from '../types';
import { InsightCard } from './InsightCard';

export function SlotAverages({ bySlot, highestSlot }: Pick<Insights, 'bySlot' | 'highestSlot'>) {
  const reducedMotion = useReducedMotion();
  const data = bySlot.map((slot) => ({ ...slot, name: SLOT_SHORT_LABELS[slot.slot] }));
  const highest = bySlot.find((slot) => slot.slot === highestSlot);

  return (
    <InsightCard title="Average by meal slot">
      <div
        role="img"
        aria-label="Average glucose for each meal slot, with lines at 70 and 180 mg/dl"
        className="h-56 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 12 }} interval={0} />
            <YAxis
              domain={[0, (dataMax: number) => Math.max(dataMax + 20, 200)]}
              width={36}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <ReferenceLine y={GLUCOSE_THRESHOLDS.low} stroke="#d97706" strokeDasharray="6 4" />
            <ReferenceLine y={GLUCOSE_THRESHOLDS.high} stroke="#dc2626" strokeDasharray="6 4" />
            <Bar
              dataKey="average"
              fill="var(--primary)"
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
              isAnimationActive={!reducedMotion}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm">
        {highest?.average != null
          ? `Highest average: ${highest.slotLabel}, ${highest.average} mg/dl.`
          : 'There are no readings to compare yet.'}
      </p>
      <VisuallyHiddenTable
        caption="Average glucose by meal slot"
        headers={['Slot', 'Average (mg/dl)', 'Readings']}
        rows={bySlot.map((slot) => [slot.slotLabel, slot.average ?? 'No readings', slot.count])}
      />
    </InsightCard>
  );
}
