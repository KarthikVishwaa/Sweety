import { describe, expect, it } from 'vitest';
import { currentMonth, formatMonth, isMonth, shiftMonth } from './month';

describe('isMonth', () => {
  it.each(['2026-10', '2026-01', '1999-12'])('accepts %s', (value) => {
    expect(isMonth(value)).toBe(true);
  });

  it.each([null, '', '2026-13', '2026-00', '2026-1', '2026-10-01', 'garbage', '26-10'])(
    'rejects %s',
    (value) => {
      expect(isMonth(value)).toBe(false);
    },
  );
});

describe('shiftMonth', () => {
  it('moves across a year end in both directions', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2025-12', 1)).toBe('2026-01');
    expect(shiftMonth('2026-10', -1)).toBe('2026-09');
    expect(shiftMonth('2026-10', 3)).toBe('2027-01');
  });
});

describe('formatMonth', () => {
  it('writes the month in full', () => {
    expect(formatMonth('2026-10')).toBe('October 2026');
    expect(formatMonth('2027-01')).toBe('January 2027');
  });
});

describe('currentMonth', () => {
  it('uses the date in Asia/Kolkata, not UTC', () => {
    expect(currentMonth(new Date('2026-10-31T19:00:00Z'))).toBe('2026-11');
    expect(currentMonth(new Date('2026-10-31T17:00:00Z'))).toBe('2026-10');
  });
});
