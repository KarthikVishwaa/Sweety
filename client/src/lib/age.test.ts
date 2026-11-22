import { describe, expect, it } from 'vitest';
import { calculateAge, formatAge, formatAgeShort } from './age';

describe('calculateAge', () => {
  it.each([
    ['on the birthday', '1990-05-15', '2026-05-15', { years: 36, months: 0, days: 0 }],
    [
      'the day before the birthday',
      '1990-05-15',
      '2026-05-14',
      { years: 35, months: 11, days: 29 },
    ],
    ['the day after the birthday', '1990-05-15', '2026-05-16', { years: 36, months: 0, days: 1 }],
    ['a typical age', '1992-03-10', '2026-05-21', { years: 34, months: 2, days: 11 }],
    ['exactly 120 years', '1906-11-21', '2026-11-21', { years: 120, months: 0, days: 0 }],
  ])('%s', (_label, dob, today, expected) => {
    expect(calculateAge(dob, today)).toEqual(expected);
  });

  describe('29 February birthdays', () => {
    it.each([
      ['in a leap year', '2028-02-29', { years: 28, months: 0, days: 0 }],
      ['the day before, in a non-leap year', '2027-02-27', { years: 26, months: 11, days: 29 }],
      [
        '28 Feb in a non-leap year counts as the birthday',
        '2027-02-28',
        { years: 27, months: 0, days: 0 },
      ],
      ['1 Mar in a non-leap year', '2027-03-01', { years: 27, months: 0, days: 1 }],
      ['the leap day after a non-leap run', '2032-02-29', { years: 32, months: 0, days: 0 }],
    ])('%s', (_label, today, expected) => {
      expect(calculateAge('2000-02-29', today)).toEqual(expected);
    });
  });

  describe('babies and short spans', () => {
    it.each([
      ['born today', '2026-05-21', '2026-05-21', { years: 0, months: 0, days: 0 }],
      ['under a month old', '2026-05-10', '2026-05-21', { years: 0, months: 0, days: 11 }],
      ['one month and one day', '2026-04-20', '2026-05-21', { years: 0, months: 1, days: 1 }],
      ['11 months old', '2025-06-21', '2026-05-21', { years: 0, months: 11, days: 0 }],
    ])('%s', (_label, dob, today, expected) => {
      expect(calculateAge(dob, today)).toEqual(expected);
    });
  });

  describe('end of month', () => {
    it.each([
      ['31 Jan to 1 Mar', '2026-01-31', '2026-03-01', { years: 0, months: 1, days: 1 }],
      ['31 Jan to 28 Feb', '2026-01-31', '2026-02-28', { years: 0, months: 1, days: 0 }],
      ['31 Jan to 27 Feb', '2026-01-31', '2026-02-27', { years: 0, months: 0, days: 27 }],
      ['30 Nov to 31 Dec', '2025-11-30', '2025-12-31', { years: 0, months: 1, days: 1 }],
      ['31 Dec to 1 Jan', '2025-12-31', '2026-01-01', { years: 0, months: 0, days: 1 }],
    ])('%s', (_label, dob, today, expected) => {
      expect(calculateAge(dob, today)).toEqual(expected);
    });
  });

  describe('invalid input', () => {
    it.each([
      ['an empty date of birth', '', '2026-05-21'],
      ['text', 'abc', '2026-05-21'],
      ['a date that does not exist', '2026-02-30', '2026-05-21'],
      ['a badly formatted date', '15/05/1990', '2026-05-21'],
      ['a date of birth in the future', '2027-01-01', '2026-05-21'],
      ['an invalid today', '1990-05-15', 'nope'],
    ])('returns null for %s', (_label, dob, today) => {
      expect(calculateAge(dob, today)).toBeNull();
    });

    it('never returns a negative number', () => {
      for (const dob of ['2026-05-22', '2026-06-01', '2030-01-01']) {
        expect(calculateAge(dob, '2026-05-21')).toBeNull();
      }
    });
  });
});

describe('formatAge', () => {
  it.each([
    [{ years: 34, months: 2, days: 11 }, 'You are 34 years and 2 months old'],
    [{ years: 34, months: 0, days: 5 }, 'You are 34 years old'],
    [{ years: 1, months: 1, days: 0 }, 'You are 1 year and 1 month old'],
    [{ years: 0, months: 3, days: 5 }, 'You are 3 months and 5 days old'],
    [{ years: 0, months: 1, days: 0 }, 'You are 1 month old'],
    [{ years: 0, months: 0, days: 1 }, 'You are 1 day old'],
    [{ years: 0, months: 0, days: 11 }, 'You are 11 days old'],
    [{ years: 0, months: 0, days: 0 }, 'You were born today'],
  ])('%j reads "%s"', (age, expected) => {
    expect(formatAge(age)).toBe(expected);
  });
});

describe('formatAgeShort', () => {
  it.each([
    [{ years: 36, months: 10, days: 3 }, '36 years'],
    [{ years: 1, months: 0, days: 0 }, '1 year'],
    [{ years: 0, months: 5, days: 9 }, '5 months'],
    [{ years: 0, months: 1, days: 0 }, '1 month'],
    [{ years: 0, months: 0, days: 11 }, '11 days'],
  ])('%j reads "%s"', (age, expected) => {
    expect(formatAgeShort(age)).toBe(expected);
  });
});
