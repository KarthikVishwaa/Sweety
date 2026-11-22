import { describe, expect, it } from 'vitest';
import { averageComparison, figureCaption, inRangeComparison, observations } from './observations';
import type { Comparison, Insights } from './types';

const comparison = (overrides: Partial<Comparison>): Comparison => ({
  previousAverage: 135,
  previousInRangePercent: 80,
  averageChange: -6.2,
  inRangeChange: -30,
  ...overrides,
});

function insights(overrides: Partial<Insights> = {}): Insights {
  return {
    month: '2026-10',
    range: { from: '2026-10-01', to: '2026-10-25' },
    count: 4,
    average: 128.8,
    highest: 200,
    lowest: 65,
    bands: {
      counts: { low: 1, inRange: 2, high: 1 },
      percentages: { low: 25, inRange: 50, high: 25 },
    },
    bySlot: [
      { slot: 'morning_fasting', slotLabel: 'Morning (fasting)', average: 121.7, count: 3 },
      { slot: 'after_breakfast', slotLabel: 'After breakfast', average: 150, count: 1 },
      { slot: 'after_lunch', slotLabel: 'After lunch', average: null, count: 0 },
      { slot: 'after_dinner', slotLabel: 'After dinner', average: null, count: 0 },
    ],
    highestSlot: 'after_breakfast',
    days: [],
    consistency: {
      daysLogged: 3,
      daysInPeriod: 25,
      currentStreak: 0,
      longestStreak: 2,
      completionPercent: 4,
    },
    highlights: { highest: null, lowest: null },
    comparison: comparison({}),
    recent: [],
    lifetime: { totalReadings: 4, firstReadingDate: '2026-10-01' },
    ...overrides,
  };
}

describe('averageComparison', () => {
  it('says plainly how much lower or higher the average is', () => {
    expect(averageComparison(comparison({ averageChange: -6.2 }))).toBe(
      'Average is 6.2 mg/dl lower than last month.',
    );
    expect(averageComparison(comparison({ averageChange: 3.8 }))).toBe(
      'Average is 3.8 mg/dl higher than last month.',
    );
  });

  it('says so when nothing changed, or when there is nothing to compare with', () => {
    expect(averageComparison(comparison({ averageChange: 0 }))).toBe(
      'Average is the same as last month.',
    );
    expect(averageComparison(comparison({ previousAverage: null, averageChange: null }))).toBe(
      'There are no readings from last month to compare with.',
    );
  });

  it('never calls a change good or bad', () => {
    for (const change of [-20, -0.1, 0, 0.1, 20]) {
      expect(averageComparison(comparison({ averageChange: change }))).not.toMatch(
        /good|bad|better|worse|improv|worsen|healthy|risk/i,
      );
    }
  });
});

describe('inRangeComparison', () => {
  it('counts percentage points', () => {
    expect(inRangeComparison(comparison({ inRangeChange: -30 }))).toBe(
      'Time in range is 30 percentage points lower than last month.',
    );
    expect(inRangeComparison(comparison({ inRangeChange: 1 }))).toBe(
      'Time in range is 1 percentage point higher than last month.',
    );
    expect(inRangeComparison(comparison({ inRangeChange: 0 }))).toBe(
      'Time in range is the same as last month.',
    );
  });

  it('is left out without a comparison', () => {
    expect(inRangeComparison(comparison({ inRangeChange: null }))).toBeNull();
  });
});

describe('observations', () => {
  it('restates the numbers in up to three short lines', () => {
    const lines = observations(insights());

    expect(lines).toEqual([
      'Your average was 128.8 mg/dl, which is in range.',
      '50% of your readings were in range, 25% low and 25% high.',
      'After breakfast readings had the highest average, 150 mg/dl.',
    ]);
  });

  it('falls back to the days logged when only one slot has readings', () => {
    const lines = observations(
      insights({
        bySlot: insights().bySlot.map((slot) =>
          slot.slot === 'morning_fasting' ? slot : { ...slot, average: null, count: 0 },
        ),
      }),
    );

    expect(lines[2]).toBe('You logged readings on 3 of 25 days.');
  });

  it('gives nothing for a month without readings', () => {
    expect(observations(insights({ count: 0, average: null }))).toEqual([]);
  });

  it('never advises or diagnoses', () => {
    for (const line of observations(insights())) {
      expect(line).not.toMatch(/should|must|consult|doctor|diagnos|risk|dangerous|healthy/i);
    }
  });
});

describe('figureCaption', () => {
  it('shows the average and its band', () => {
    expect(figureCaption(152.4, 'this month')).toBe('Average this month: 152.4 mg/dl, In range');
    expect(figureCaption(190, 'in October 2026')).toBe('Average in October 2026: 190 mg/dl, High');
    expect(figureCaption(65, 'this month')).toBe('Average this month: 65 mg/dl, Low');
  });

  it('says there are no readings', () => {
    expect(figureCaption(null, 'this month')).toBe('No readings this month');
  });
});
