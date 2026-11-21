import { format } from 'date-fns';

export const TIME_ZONE = 'Asia/Kolkata';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function todayInIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function isRealDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
  );
}

export function parseISODate(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function addDays(value: string, days: number): string {
  const shifted = parseISODate(value);
  shifted.setDate(shifted.getDate() + days);
  return toISODate(shifted);
}

export function formatDisplayDate(value: string): string {
  return format(parseISODate(value), 'EEE, d MMM yyyy');
}
