import type { DateRange, ReportType } from './reports.types.js';

function parts(date: string): { year: number; month: number; day: number } {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return { year, month, day };
}

function toIso(year: number, month: number, day: number): string {
  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Works on plain YYYY-MM-DD strings with UTC calendar arithmetic, so a range never depends on the
// server's own time zone or on daylight saving.
export function reportRange(type: ReportType, selectedDate: string): DateRange {
  const { year, month } = parts(selectedDate);

  if (type === 'daily') return { from: selectedDate, to: selectedDate };
  if (type === 'mtd') return { from: toIso(year, month, 1), to: selectedDate };

  const previousYear = month === 1 ? year - 1 : year;
  const previousMonth = month === 1 ? 12 : month - 1;
  return {
    from: toIso(previousYear, previousMonth, 1),
    to: toIso(previousYear, previousMonth, daysInMonth(previousYear, previousMonth)),
  };
}
