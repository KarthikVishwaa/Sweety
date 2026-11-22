import { describe, expect, it } from 'vitest';
import { GLUCOSE_THRESHOLDS } from '@/features/readings/readings.constants';
import {
  BAND_COLORS,
  GLUCOSE_FULL_VALUE,
  RING_FILLS,
  glucoseBandColor,
  glucoseToFill,
} from './glucoseLevel';

describe('glucoseToFill', () => {
  it.each([
    [39, 0],
    [40, 0],
    [400, 1],
    [401, 1],
    [900, 1],
  ])('maps %i to %f', (value, fill) => {
    expect(glucoseToFill(value)).toBe(fill);
  });

  it('is linear between empty and full', () => {
    expect(glucoseToFill(220)).toBeCloseTo(0.5, 5);
    expect(glucoseToFill(GLUCOSE_THRESHOLDS.low)).toBeCloseTo(30 / 360, 5);
    expect(glucoseToFill(GLUCOSE_THRESHOLDS.high)).toBeCloseTo(140 / 360, 5);
  });

  it('maps no reading to an empty body', () => {
    expect(glucoseToFill(null)).toBe(0);
  });

  it('puts the rings at the band thresholds', () => {
    expect(RING_FILLS.low).toBe(glucoseToFill(GLUCOSE_THRESHOLDS.low));
    expect(RING_FILLS.high).toBe(glucoseToFill(GLUCOSE_THRESHOLDS.high));
    expect(GLUCOSE_FULL_VALUE).toBe(400);
  });
});

describe('glucoseBandColor', () => {
  it.each([
    [39, BAND_COLORS.low],
    [69, BAND_COLORS.low],
    [70, BAND_COLORS['in-range']],
    [180, BAND_COLORS['in-range']],
    [181, BAND_COLORS.high],
    [400, BAND_COLORS.high],
  ])('colours %i', (value, color) => {
    expect(glucoseBandColor(value)).toBe(color);
  });

  it('uses a neutral colour when there is no reading', () => {
    expect(glucoseBandColor(null)).toBe(BAND_COLORS.none);
  });
});
