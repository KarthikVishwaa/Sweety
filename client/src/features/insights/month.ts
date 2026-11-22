import { format } from 'date-fns';
import { todayInIST } from '@/lib/date';

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const isMonth = (value: string | null): value is string =>
  value !== null && MONTH_PATTERN.test(value);

export const currentMonth = (now: Date = new Date()): string => todayInIST(now).slice(0, 7);

export function shiftMonth(month: string, delta: number): string {
  const [year = 0, number = 1] = month.split('-').map(Number);
  const total = year * 12 + (number - 1) + delta;
  return `${String(Math.floor(total / 12)).padStart(4, '0')}-${String((total % 12) + 1).padStart(2, '0')}`;
}

/** For example "October 2026". */
export function formatMonth(month: string): string {
  const [year = 0, number = 1] = month.split('-').map(Number);
  return format(new Date(year, number - 1, 1), 'MMMM yyyy');
}
