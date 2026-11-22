import { describe, expect, it } from 'vitest';
import { BODY_PROPORTIONS, GENDERS } from './bodyProportions';
import { relaxOntoSurface } from './generator/relaxation';
import type { Sdf } from './generator/sdf';
import { shoulderLine } from './generator/shoulderLine';
import { shoulderCreaseDegrees, shoulderProfileBumps } from './generator/shoulderMetrics';
import { shoulderWeight } from './generator/shoulderMask';
import { extractSurface } from './generator/surfaceNets';
import { mirrorPairs, restoreSymmetry } from './generator/symmetry';

describe.each(GENDERS)('the %s shoulder line', (gender) => {
  const p = BODY_PROPORTIONS[gender];
  const line = shoulderLine(p);

  it('leaves the neck the stated length below the chin', () => {
    expect(line.neckBaseY).toBeCloseTo(p.chinY - p.neckLength, 10);
  });

  it('puts the outer edge of the shoulder joint at half the shoulder width', () => {
    expect(line.joint[0] + line.deltoidRadius).toBeCloseTo(p.shoulderWidth / 2, 10);
  });

  it('falls from the neck to the joint at the stated slope, touching the joint sphere', () => {
    const slope = (p.trapeziusSlope * Math.PI) / 180;
    const tangentX = line.joint[0] + line.deltoidRadius * Math.sin(slope);
    const tangentY = line.joint[1] + line.deltoidRadius * Math.cos(slope);
    const heightAtNeck = tangentY + (tangentX - p.neckWidth / 2) * Math.tan(slope);

    expect(heightAtNeck).toBeCloseTo(line.neckBaseY, 10);
  });

  it('is a gentler slope for the male figure than the female one', () => {
    expect(BODY_PROPORTIONS.male.trapeziusSlope).toBeGreaterThanOrEqual(18);
    expect(BODY_PROPORTIONS.male.trapeziusSlope).toBeLessThanOrEqual(22);
    expect(BODY_PROPORTIONS.female.trapeziusSlope).toBeGreaterThanOrEqual(22);
    expect(BODY_PROPORTIONS.female.trapeziusSlope).toBeLessThanOrEqual(28);
  });
});

describe('the shoulder mask', () => {
  it('is 1 in the neck and shoulder region and 0 away from it', () => {
    expect(shoulderWeight(0.05, 0.8)).toBe(1);
    expect(shoulderWeight(0.2, 0.8)).toBe(0);
    expect(shoulderWeight(0.05, 0.5)).toBe(0);
    expect(shoulderWeight(0.09, 0.69)).toBe(1);
    expect(shoulderWeight(0.05, 0.92)).toBe(0);
  });

  it('fades smoothly instead of switching', () => {
    const weights = [0.125, 0.135, 0.145, 0.155].map((x) => shoulderWeight(x, 0.8));

    expect(weights[0]).toBe(1);
    expect(weights[3]).toBe(0);
    expect(weights[1]).toBeLessThan(1);
    expect(weights[1]).toBeGreaterThan(weights[2]!);
    expect(weights[2]).toBeGreaterThan(0);
  });

  it('is the same on both sides', () => {
    expect(shoulderWeight(-0.13, 0.8)).toBe(shoulderWeight(0.13, 0.8));
  });
});

describe('mirror pairs', () => {
  it('pairs each vertex with its mirror image and makes the pair exactly symmetric', () => {
    const positions = Float32Array.from([0.05, 0.8, 0.01, -0.0502, 0.8004, 0.0099, 0.3, 0.5, 0]);

    const pairs = mirrorPairs(positions);
    restoreSymmetry(positions, pairs);

    expect([...pairs]).toEqual([1, 0, -1]);
    expect(positions[0]).toBeCloseTo(-positions[3]!, 6);
    expect(positions[1]).toBeCloseTo(positions[4]!, 6);
    expect(positions[2]).toBeCloseTo(positions[5]!, 6);
    expect([positions[6], positions[7], positions[8]]).toEqual([Float32Array.of(0.3)[0], 0.5, 0]);
  });
});

describe('shoulder metrics', () => {
  it('measure a flat surface as having no crease and a right-angle fold as 90 degrees', () => {
    const flat = Float32Array.from([0, 0.8, 0, 0.01, 0.8, 0, 0, 0.8, 0.01, 0.01, 0.8, 0.01]);
    const fold = Float32Array.from([0, 0.8, 0, 0.01, 0.8, 0, 0, 0.8, 0.01, 0.01, 0.81, 0.0]);
    const faces = Uint32Array.from([0, 1, 2, 2, 1, 3]);

    expect(shoulderCreaseDegrees(flat, faces)).toBeCloseTo(0, 5);
    expect(shoulderCreaseDegrees(fold, faces)).toBeGreaterThan(30);
  });

  it('count a rise in the top of the shoulder as a bump, and a clean slope as none', () => {
    const profile = (heights: number[]) =>
      Float32Array.from(heights.flatMap((y, index) => [0.042 + index * 0.004, y, 0]));
    const slope = [0.83, 0.822, 0.815, 0.81, 0.806, 0.803, 0.8];
    const lump = [0.83, 0.822, 0.815, 0.81, 0.813, 0.803, 0.8];

    expect(shoulderProfileBumps(profile(slope))).toBe(0);
    expect(shoulderProfileBumps(profile(lump))).toBe(1);
  });
});

describe('relaxing onto the surface', () => {
  const centre = [0.075, 0.8, 0] as const;
  const radius = 0.0335;
  const sphere: Sdf = (x, y, z) => Math.hypot(x - centre[0], y - centre[1], z - centre[2]) - radius;
  const extract = () =>
    extractSurface(sphere, {
      min: [centre[0] - 0.05, centre[1] - 0.05, centre[2] - 0.05],
      cells: [26, 26, 26],
      voxel: 0.0038,
    });

  it('evens out the triangles, so the angle between faces falls, and keeps every vertex on the surface', () => {
    const { positions, indices } = extract();
    const before = shoulderCreaseDegrees(positions, indices);
    const weights = new Float32Array(positions.length / 3).fill(1);

    relaxOntoSurface(positions, indices, sphere, weights, 12, 0.0019);

    expect(shoulderCreaseDegrees(positions, indices)).toBeLessThan(before);
    for (let vertex = 0; vertex < positions.length; vertex += 3) {
      expect(
        Math.abs(sphere(positions[vertex]!, positions[vertex + 1]!, positions[vertex + 2]!)),
      ).toBeLessThan(0.0002);
    }
  });

  it('leaves vertices with no weight exactly where they were', () => {
    const { positions, indices } = extract();
    const original = Float32Array.from(positions);

    relaxOntoSurface(positions, indices, sphere, new Float32Array(positions.length / 3), 5, 0.0019);

    expect(positions).toEqual(original);
  });
});
