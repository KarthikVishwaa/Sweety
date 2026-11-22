import { describe, expect, it } from 'vitest';
import { BODY_PROPORTIONS, GENDERS } from './bodyProportions';

describe('body proportions', () => {
  const { male, female, other } = BODY_PROPORTIONS;

  it('makes the female figure about 0.93 of the male stature', () => {
    expect(female.stature / male.stature).toBeCloseTo(0.93, 3);
  });

  it('gives the female a smaller waist-to-hip ratio and a larger hip-to-shoulder ratio', () => {
    expect(female.waistWidth / female.hipWidth).toBeLessThan(male.waistWidth / male.hipWidth);
    expect(female.hipWidth / female.shoulderWidth).toBeGreaterThan(
      male.hipWidth / male.shoulderWidth,
    );
  });

  it('puts the neutral figure exactly halfway on every measurement', () => {
    for (const key of Object.keys(male) as (keyof typeof male)[]) {
      expect(other[key]).toBeCloseTo((male[key] + female[key]) / 2, 10);
    }
  });

  it.each(GENDERS)('keeps the %s landmarks in anatomical order', (gender) => {
    const p = BODY_PROPORTIONS[gender];
    const fromTop = [
      p.chinY + p.headHeight,
      p.chinY,
      p.shoulderY,
      p.chestY,
      p.elbowY,
      p.navelY,
      p.hipJointY,
      p.wristY,
      p.crotchY,
      p.fingertipY,
      p.kneeY,
      p.ankleY,
    ];
    for (let index = 1; index < fromTop.length; index++) {
      expect(fromTop[index]).toBeLessThan(fromTop[index - 1]!);
    }
    expect(p.chinY + p.headHeight).toBeCloseTo(1, 5);
  });

  it('uses the Drillis and Contini landmark heights', () => {
    expect(male.headHeight).toBe(0.13);
    expect(male.shoulderY).toBe(0.818);
    expect(male.kneeY).toBe(0.285);
    expect(male.footLength).toBe(0.152);
    expect(female.footLength).toBe(0.148);
  });
});
