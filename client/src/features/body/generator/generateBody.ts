import type { Gender } from '../bodyProportions.ts';
import { createBodySdf } from './bodySdf.ts';
import type { Sdf } from './sdf.ts';
import { extractSurface, gradient } from './surfaceNets.ts';
import { taubinSmooth } from './taubin.ts';

export interface BodyMesh {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

/** Edge of a voxel, as a fraction of the stature. */
export const VOXEL = 0.0038;
const SMOOTHING_ITERATIONS = 3;
const HALF_WIDTH = 0.25;
const TOP = 1.012;
const BACK = -0.1;
const FRONT = 0.16;
// The ground plane falls halfway between two rows of samples, so the flat sole is extracted cleanly.
const BOTTOM = -2.5 * VOXEL;

function normalsFromField(sdf: Sdf, positions: Float32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  for (let index = 0; index < positions.length; index += 3) {
    normals.set(
      gradient(sdf, positions[index]!, positions[index + 1]!, positions[index + 2]!, VOXEL * 0.5),
      index,
    );
  }
  return normals;
}

// Feet exactly on y = 0, centred on x and z, and exactly one unit tall.
function standAtUnitHeight(positions: Float32Array): void {
  let low = Infinity;
  let high = -Infinity;
  let back = Infinity;
  let front = -Infinity;
  for (let index = 0; index < positions.length; index += 3) {
    positions[index + 1] = Math.max(positions[index + 1]!, 0);
    low = Math.min(low, positions[index + 1]!);
    high = Math.max(high, positions[index + 1]!);
    back = Math.min(back, positions[index + 2]!);
    front = Math.max(front, positions[index + 2]!);
  }
  const size = 1 / (high - low);
  const middle = (back + front) / 2;
  for (let index = 0; index < positions.length; index += 3) {
    positions[index] = positions[index]! * size;
    positions[index + 1] = (positions[index + 1]! - low) * size;
    positions[index + 2] = (positions[index + 2]! - middle) * size;
  }
}

/** A seamless, watertight, symmetrical mesh of the figure at unit height. Pure and deterministic. */
export function generateBodyMesh(gender: Gender): BodyMesh {
  const sdf = createBodySdf(gender);
  const cellsX = Math.ceil(HALF_WIDTH / VOXEL) * 2;
  const surface = extractSurface(sdf, {
    min: [(-cellsX / 2) * VOXEL, BOTTOM, BACK],
    cells: [cellsX, Math.ceil((TOP - BOTTOM) / VOXEL), Math.ceil((FRONT - BACK) / VOXEL)],
    voxel: VOXEL,
  });
  taubinSmooth(surface.positions, surface.indices, SMOOTHING_ITERATIONS);
  const normals = normalsFromField(sdf, surface.positions);
  standAtUnitHeight(surface.positions);
  return { positions: surface.positions, normals, indices: surface.indices };
}
