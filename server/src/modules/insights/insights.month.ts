import { addDays } from '../../utils/date.js';
import type { DateRange } from '../reports/reports.types.js';

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isMonth(value: string): boolean {
  return MONTH_PATTERN.test(value);
}

export const monthOf = (date: string): string => date.slice(0, 7);

const daysInMonth = (month: string): number => {
  const [year = 0, number = 1] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number, 0)).getUTCDate();
};

export function previousMonth(month: string): string {
  return monthOf(addDays(`${month}-01`, -1));
}

/** The whole month, or up to `today` when `today` falls inside it. */
export function monthRange(month: string, today: string): DateRange {
  const last = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`;
  return { from: `${month}-01`, to: monthOf(today) === month && today < last ? today : last };
}

/** Days that have passed in the month so far, counting today, or all of them for a past month. */
export function daysInPeriod({ from, to }: DateRange): number {
  return Number(to.slice(8)) - Number(from.slice(8)) + 1;
}
