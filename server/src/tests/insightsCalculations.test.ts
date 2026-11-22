import { describe, expect, it } from 'vitest';
import { compare } from '../modules/insights/insights.comparison.js';
import { daysInPeriod, monthRange, previousMonth } from '../modules/insights/insights.month.js';
import { percentages, roundToOneDecimal } from '../modules/insights/insights.rounding.js';
import { currentStreak, longestStreak } from '../modules/insights/insights.streaks.js';

describe('percentages (largest remainder)', () => {
  it('splits 1, 2, 1 into 25, 50, 25', () => {
    expect(percentages([1, 2, 1])).toEqual([25, 50, 25]);
  });

  it('always adds up to 100, where plain rounding would not', () => {
    // 1/3 each rounds to 33 + 33 + 33 = 99.
    const thirds = percentages([1, 1, 1]);
    expect(thirds.reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(thirds).toEqual([34, 33, 33]);

    for (const counts of [
      [7, 11, 13],
      [1, 0, 6],
      [5, 5, 1],
      [2, 3, 2],
      [100, 1, 1],
    ]) {
      expect(percentages(counts).reduce((sum, value) => sum + value, 0)).toBe(100);
    }
  });

  it('gives the extra point to the biggest leftover first', () => {
    expect(percentages([1, 6, 0])).toEqual([14, 86, 0]);
    expect(percentages([2, 5, 0])).toEqual([29, 71, 0]);
  });

  it('is all zeros when there is nothing to share', () => {
    expect(percentages([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('keeps a lone band at 100', () => {
    expect(percentages([0, 4, 0])).toEqual([0, 100, 0]);
  });
});

describe('roundToOneDecimal', () => {
  it('rounds half up and removes float noise', () => {
    expect(roundToOneDecimal(128.75)).toBe(128.8);
    expect(roundToOneDecimal(128.8 - 125)).toBe(3.8);
    expect(roundToOneDecimal(-6.199999999)).toBe(-6.2);
  });
});

describe('currentStreak', () => {
  const logged = (...days: string[]) => new Set(days);

  it('counts the run ending today', () => {
    expect(currentStreak(logged('2026-10-23', '2026-10-24', '2026-10-25'), '2026-10-25')).toBe(3);
  });

  it('keeps the run alive when today has no reading yet', () => {
    expect(currentStreak(logged('2026-10-23', '2026-10-24'), '2026-10-25')).toBe(2);
  });

  it('is 0 when neither today nor yesterday has a reading', () => {
    expect(currentStreak(logged('2026-10-20', '2026-10-21'), '2026-10-25')).toBe(0);
    expect(currentStreak(logged(), '2026-10-25')).toBe(0);
  });

  it('stops at a gap', () => {
    expect(currentStreak(logged('2026-10-21', '2026-10-24', '2026-10-25'), '2026-10-25')).toBe(2);
  });

  it('crosses a month end', () => {
    expect(currentStreak(logged('2026-09-30', '2026-10-01'), '2026-10-01')).toBe(2);
  });
});

describe('longestStreak', () => {
  it('finds the longest run, however the days are ordered', () => {
    expect(
      longestStreak(['2026-10-09', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-08']),
    ).toBe(3);
  });

  it('is 1 for a single day and 0 for none', () => {
    expect(longestStreak(['2026-10-04'])).toBe(1);
    expect(longestStreak([])).toBe(0);
  });

  it('counts a day once', () => {
    expect(longestStreak(['2026-10-01', '2026-10-01', '2026-10-02'])).toBe(2);
  });

  it('runs across a month end', () => {
    expect(longestStreak(['2026-02-28', '2026-03-01', '2026-03-02'])).toBe(3);
  });
});

describe('compare', () => {
  const current = { count: 4, average: 128.8, inRangePercent: 50 };

  it('reports the change against the previous month', () => {
    expect(compare(current, { count: 10, average: 135, inRangePercent: 80 })).toEqual({
      previousAverage: 135,
      previousInRangePercent: 80,
      averageChange: -6.2,
      inRangeChange: -30,
    });
  });

  it('is all null without previous data', () => {
    expect(compare(current, { count: 0, average: null, inRangePercent: 0 })).toEqual({
      previousAverage: null,
      previousInRangePercent: null,
      averageChange: null,
      inRangeChange: null,
    });
  });

  it('keeps the previous figures but no change when this month is empty', () => {
    expect(
      compare(
        { count: 0, average: null, inRangePercent: 0 },
        { count: 10, average: 135, inRangePercent: 80 },
      ),
    ).toEqual({
      previousAverage: 135,
      previousInRangePercent: 80,
      averageChange: null,
      inRangeChange: null,
    });
  });
});

describe('month helpers', () => {
  it('finds the previous month across a year end', () => {
    expect(previousMonth('2026-10')).toBe('2026-09');
    expect(previousMonth('2026-01')).toBe('2025-12');
    expect(previousMonth('2026-03')).toBe('2026-02');
  });

  it('ends the current month today and a past month on its last day', () => {
    expect(monthRange('2026-10', '2026-10-25')).toEqual({ from: '2026-10-01', to: '2026-10-25' });
    expect(monthRange('2026-09', '2026-10-25')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(monthRange('2028-02', '2028-03-10')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });

  it('counts the days of the period', () => {
    expect(daysInPeriod(monthRange('2026-10', '2026-10-25'))).toBe(25);
    expect(daysInPeriod(monthRange('2026-09', '2026-10-25'))).toBe(30);
  });
});
