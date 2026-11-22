import { isRealDate } from '@/lib/date';
import { plural } from '@/lib/plural';

export interface Age {
  years: number;
  months: number;
  days: number;
}

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

function parse(value: string): CalendarDate | null {
  if (!isRealDate(value)) return null;
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return { year, month, day };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonths({ year, month, day }: CalendarDate, months: number): CalendarDate {
  const total = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(total / 12);
  const targetMonth = (total % 12) + 1;
  return {
    year: targetYear,
    month: targetMonth,
    day: Math.min(day, daysInMonth(targetYear, targetMonth)),
  };
}

function isAfter(a: CalendarDate, b: CalendarDate): boolean {
  return Date.UTC(a.year, a.month - 1, a.day) > Date.UTC(b.year, b.month - 1, b.day);
}

function daysBetween(from: CalendarDate, to: CalendarDate): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (Date.UTC(to.year, to.month - 1, to.day) - Date.UTC(from.year, from.month - 1, from.day)) /
      millisecondsPerDay,
  );
}

export function calculateAge(dateOfBirth: string, today: string): Age | null {
  const birth = parse(dateOfBirth);
  const now = parse(today);
  if (!birth || !now || isAfter(birth, now)) return null;

  let months = (now.year - birth.year) * 12 + (now.month - birth.month);
  if (isAfter(addMonths(birth, months), now)) months -= 1;

  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days: daysBetween(addMonths(birth, months), now),
  };
}

export function formatAge({ years, months, days }: Age): string {
  if (years > 0) {
    return `You are ${plural(years, 'year')}${months > 0 ? ` and ${plural(months, 'month')}` : ''} old`;
  }
  if (months > 0) {
    return `You are ${plural(months, 'month')}${days > 0 ? ` and ${plural(days, 'day')}` : ''} old`;
  }
  return days > 0 ? `You are ${plural(days, 'day')} old` : 'You were born today';
}

/** The largest unit only, for example "36 years". */
export function formatAgeShort({ years, months, days }: Age): string {
  if (years > 0) return plural(years, 'year');
  if (months > 0) return plural(months, 'month');
  return plural(days, 'day');
}
