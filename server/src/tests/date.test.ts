import { describe, expect, it } from 'vitest';
import { isRealCalendarDate, todayInTimeZone, yearsAgo } from '../utils/date.js';

describe('todayInTimeZone', () => {
  it('uses the IST calendar day just before midnight IST', () => {
    expect(todayInTimeZone(new Date('2026-11-20T18:29:59Z'), 'Asia/Kolkata')).toBe('2026-11-20');
  });

  it('rolls over to the next day at midnight IST', () => {
    expect(todayInTimeZone(new Date('2026-11-20T18:30:00Z'), 'Asia/Kolkata')).toBe('2026-11-21');
  });

  it('is already the next day at 00:30 IST while UTC is still the previous day', () => {
    expect(todayInTimeZone(new Date('2026-11-20T19:00:00Z'), 'Asia/Kolkata')).toBe('2026-11-21');
    expect(todayInTimeZone(new Date('2026-11-20T19:00:00Z'), 'UTC')).toBe('2026-11-20');
  });

  it('defaults to the configured timezone', () => {
    expect(todayInTimeZone(new Date('2026-11-20T19:00:00Z'))).toBe('2026-11-21');
  });
});

describe('isRealCalendarDate', () => {
  it.each(['2026-11-21', '2024-02-29', '2026-12-31'])('accepts %s', (value) => {
    expect(isRealCalendarDate(value)).toBe(true);
  });

  it.each([
    '2026-02-30',
    '2025-02-29',
    '2026-13-01',
    '2026-00-10',
    '2026-1-1',
    '21-11-2026',
    'abc',
    '',
  ])('rejects %s', (value) => {
    expect(isRealCalendarDate(value)).toBe(false);
  });
});

describe('yearsAgo', () => {
  it.each([
    ['2026-11-21', 120, '1906-11-21'],
    ['2028-02-29', 120, '1908-02-29'],
    ['2020-02-29', 120, '1900-02-28'],
    ['2026-01-31', 1, '2025-01-31'],
  ])('%s minus %i years is %s', (date, years, expected) => {
    expect(yearsAgo(date, years)).toBe(expected);
  });
});
