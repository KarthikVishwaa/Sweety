import { roundToOneDecimal } from './insights.rounding.js';
import type { Comparison } from './insights.types.js';

interface MonthFigures {
  count: number;
  average: number | null;
  inRangePercent: number;
}

/** This month against the previous full month. A side without readings leaves its figures null. */
export function compare(current: MonthFigures, previous: MonthFigures): Comparison {
  const hasPrevious = previous.count > 0 && previous.average !== null;
  const bothHaveData = hasPrevious && current.count > 0 && current.average !== null;
  return {
    previousAverage: hasPrevious ? previous.average : null,
    previousInRangePercent: hasPrevious ? previous.inRangePercent : null,
    averageChange: bothHaveData
      ? roundToOneDecimal((current.average as number) - (previous.average as number))
      : null,
    inRangeChange: bothHaveData ? current.inRangePercent - previous.inRangePercent : null,
  };
}
