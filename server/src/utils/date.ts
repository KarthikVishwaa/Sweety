import { env } from '../config/env.js';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// "Today" is a calendar day in the configured zone (Asia/Kolkata by default), not in UTC: from 18:30 UTC
// it is already tomorrow in India, and a reading must not be rejected as "in the future" for that.
export function todayInTimeZone(now: Date = new Date(), timeZone: string = env.TZ): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

// Round-trips through Date.UTC so an impossible date such as 2026-02-31 is rejected, not rolled over.
export function isRealCalendarDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function addDays(date: string, days: number): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function yearsAgo(date: string, years: number): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const targetYear = year - years;
  const lastDayOfMonth = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  return [
    String(targetYear).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(Math.min(day, lastDayOfMonth)).padStart(2, '0'),
  ].join('-');
}
