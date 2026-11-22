import { SLOT_LABELS, getGlucoseBand } from '@/features/readings/readings.constants';
import type { Comparison, Insights } from './types';

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? '' : 's'}`;

/** For example "Average is 6.2 mg/dl lower than last month". Plain words, no judgement. */
export function averageComparison({ averageChange, previousAverage }: Comparison): string {
  if (previousAverage === null || averageChange === null) {
    return 'There are no readings from last month to compare with.';
  }
  if (averageChange === 0) return 'Average is the same as last month.';
  return `Average is ${Math.abs(averageChange)} mg/dl ${averageChange < 0 ? 'lower' : 'higher'} than last month.`;
}

export function inRangeComparison({ inRangeChange }: Comparison): string | null {
  if (inRangeChange === null) return null;
  if (inRangeChange === 0) return 'Time in range is the same as last month.';
  return `Time in range is ${plural(Math.abs(inRangeChange), 'percentage point')} ${inRangeChange < 0 ? 'lower' : 'higher'} than last month.`;
}

/** One to three short lines that only restate the numbers. Nothing is advised or diagnosed. */
export function observations(insights: Insights): string[] {
  const { count, average, bands, bySlot, highestSlot, consistency } = insights;
  if (count === 0 || average === null) return [];

  const lines = [
    `Your average was ${average} mg/dl, which is ${getGlucoseBand(average).label.toLowerCase()}.`,
    `${bands.percentages.inRange}% of your readings were in range, ${bands.percentages.low}% low and ${bands.percentages.high}% high.`,
  ];
  const highest = bySlot.find((slot) => slot.slot === highestSlot);
  if (highest?.average != null && bySlot.filter((slot) => slot.count > 0).length > 1) {
    lines.push(
      `${SLOT_LABELS[highest.slot]} readings had the highest average, ${highest.average} mg/dl.`,
    );
  } else {
    lines.push(
      `You logged readings on ${consistency.daysLogged} of ${consistency.daysInPeriod} days.`,
    );
  }
  return lines;
}

/** The line under the figure, for example "Average this month: 152.4 mg/dl, In range". */
export function figureCaption(average: number | null, period: string): string {
  if (average === null) return `No readings ${period}`;
  return `Average ${period}: ${average} mg/dl, ${getGlucoseBand(average).label}`;
}
