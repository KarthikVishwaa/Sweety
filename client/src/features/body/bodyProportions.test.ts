import { describe, expect, it } from 'vitest';
import { BODY_PROPORTIONS } from './bodyProportions';

describe('body proportions', () => {
  const { male, female } = BODY_PROPORTIONS;

  it('makes the female figure shorter than the male', () => {
    expect(female.stature).toBeLessThan(male.stature);
    expect(female.stature / male.stature).toBeCloseTo(0.93, 2);
  });

  it('gives the female a smaller waist-to-hip ratio and a larger hip-to-shoulder ratio', () => {
    expect(female.waistWidth / female.hipWidth).toBeLessThan(male.waistWidth / male.hipWidth);
    expect(female.hipWidth / female.shoulderWidth).toBeGreaterThan(
      male.hipWidth / male.shoulderWidth,
    );
  });

  it('puts the neutral figure halfway between the two on every measurement', () => {
    const { other } = BODY_PROPORTIONS;
    for (const key of Object.keys(male) as (keyof typeof male)[]) {
      expect(other[key]).toBeCloseTo((male[key] + female[key]) / 2, 10);
    }
  });

  it('is about seven and a half heads tall for both models', () => {
    expect(male.headHeight).toBeCloseTo(1 / 7.5, 5);
    expect(female.headHeight).toBeCloseTo(1 / 7.5, 5);
    expect(BODY_PROPORTIONS.other.headHeight).toBeCloseTo(1 / 7.5, 5);
  });
});
