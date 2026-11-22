import { describe, expect, it } from 'vitest';
import { getBodyGeometry } from './bodyGeometry';
import { generateBodyMesh } from './bodyMesh';
import { BODY_PROPORTIONS, MESH_TRIANGLE_BUDGET, type BodyModel } from './bodyProportions';

const MODELS: BodyModel[] = ['male', 'female'];
const SYMMETRY_TOLERANCE = 0.01;

describe.each(MODELS)('%s body mesh', (model) => {
  const mesh = generateBodyMesh(model);
  const { stature } = BODY_PROPORTIONS[model];

  it('is non-empty and under the triangle budget', () => {
    expect(mesh.indices.length / 3).toBeGreaterThan(1000);
    expect(mesh.indices.length / 3).toBeLessThan(MESH_TRIANGLE_BUDGET);
  });

  it('stands on the ground and is as tall as the stature', () => {
    let low = Infinity;
    let high = -Infinity;
    for (let index = 1; index < mesh.positions.length; index += 3) {
      low = Math.min(low, mesh.positions[index]!);
      high = Math.max(high, mesh.positions[index]!);
    }
    expect(low).toBeGreaterThan(-0.02 * stature);
    expect(low).toBeLessThan(0.02 * stature);
    expect(high - low).toBeCloseTo(stature, 1);
  });

  it('is symmetrical left to right', () => {
    let minX = Infinity;
    let maxX = -Infinity;
    for (let index = 0; index < mesh.positions.length; index += 3) {
      minX = Math.min(minX, mesh.positions[index]!);
      maxX = Math.max(maxX, mesh.positions[index]!);
    }
    expect(Math.abs(minX + maxX)).toBeLessThan(SYMMETRY_TOLERANCE * stature);
  });

  it('has unit normals and valid indices', () => {
    const vertices = mesh.positions.length / 3;
    expect(Math.max(...mesh.indices.slice(0, 5000))).toBeLessThan(vertices);
    expect(Math.hypot(mesh.normals[0]!, mesh.normals[1]!, mesh.normals[2]!)).toBeCloseTo(1, 3);
  });

  it('is deterministic', () => {
    expect(generateBodyMesh(model).positions).toEqual(mesh.positions);
  });
});

describe('getBodyGeometry', () => {
  it('returns one memoised geometry per model', async () => {
    const first = await getBodyGeometry('male');
    expect(await getBodyGeometry('male')).toBe(first);
    expect(first.getAttribute('position').count).toBeGreaterThan(0);
  });
});
