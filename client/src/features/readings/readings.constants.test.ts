import { describe, expect, it } from 'vitest';
import { getGlucoseBand } from './readings.constants';

describe('getGlucoseBand', () => {
  it.each([
    [40, 'low', 'Low'],
    [69, 'low', 'Low'],
    [70, 'in-range', 'In range'],
    [180, 'in-range', 'In range'],
    [181, 'high', 'High'],
    [600, 'high', 'High'],
  ])('classifies %i as %s', (value, key, label) => {
    expect(getGlucoseBand(value)).toEqual({ key, label });
  });
});
