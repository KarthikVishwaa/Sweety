import { useReducedMotion } from 'motion/react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { GLUCOSE_THRESHOLDS } from '@/features/readings/readings.constants';
import { formatDisplayDate, formatShortDate } from '@/lib/date';
import type { DaySummary } from '../types';

interface GlucoseChartProps {
  from: string;
  to: string;
  days: DaySummary[];
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const day = payload?.[0]?.payload as DaySummary | undefined;
  if (!active || !day) return null;

  return (
    <div className="rounded-lg border bg-background p-3 text-sm shadow-md">
      <p className="mb-1 font-medium">{formatDisplayDate(day.date)}</p>
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5">
        <dt className="text-muted-foreground">Average</dt>
        <dd className="text-right tabular-nums">{day.average} mg/dl</dd>
        <dt className="text-muted-foreground">Lowest</dt>
        <dd className="text-right tabular-nums">{day.lowest} mg/dl</dd>
        <dt className="text-muted-foreground">Highest</dt>
        <dd className="text-right tabular-nums">{day.highest} mg/dl</dd>
        <dt className="text-muted-foreground">Readings</dt>
        <dd className="text-right tabular-nums">{day.count}</dd>
      </dl>
    </div>
  );
}

export function GlucoseChart({ from, to, days }: GlucoseChartProps) {
  const reducedMotion = useReducedMotion();
  const data = days.map((day) => ({ ...day, dayOfMonth: Number(day.date.slice(8)) }));
  const label = `Daily average glucose, ${formatShortDate(from)} to ${formatShortDate(to)}, ${days.length} ${days.length === 1 ? 'day' : 'days'} with readings`;

  return (
    <div role="img" aria-label={label} className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 24, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="dayOfMonth"
            type="number"
            domain={[1, Number(to.slice(8))]}
            allowDecimals={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            domain={[
              (dataMin: number) => Math.min(dataMin, 60),
              (dataMax: number) => Math.max(dataMax, 200),
            ]}
            width={40}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <ReferenceLine
            y={GLUCOSE_THRESHOLDS.low}
            stroke="#d97706"
            strokeDasharray="6 4"
            label={{
              value: `Low ${GLUCOSE_THRESHOLDS.low}`,
              position: 'insideBottomLeft',
              fontSize: 11,
              fill: '#b45309',
            }}
          />
          <ReferenceLine
            y={GLUCOSE_THRESHOLDS.high}
            stroke="#dc2626"
            strokeDasharray="6 4"
            label={{
              value: `High ${GLUCOSE_THRESHOLDS.high}`,
              position: 'insideTopLeft',
              fontSize: 11,
              fill: '#b91c1c',
            }}
          />
          <Tooltip content={ChartTooltip} />
          <Line
            type="monotone"
            dataKey="average"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--primary)' }}
            activeDot={{ r: 5 }}
            isAnimationActive={!reducedMotion}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
