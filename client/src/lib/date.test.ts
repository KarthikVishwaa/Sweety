import { describe, expect, it } from 'vitest';
import { yearsAgo } from './date';

describe('yearsAgo', () => {
  it.each([
    ['2026-11-21', 120, '1906-11-21'],
    ['2028-02-29', 120, '1908-02-29'],
    ['2020-02-29', 120, '1900-02-28'],
  ])('%s minus %i years is %s', (date, years, expected) => {
    expect(yearsAgo(date, years)).toBe(expected);
  });
});
