import type { Sdf } from './sdf.ts';
import { gradient } from './surfaceNets.ts';
import { neighbours } from './taubin.ts';

const STEP = 0.5;
const PROJECTION_STEPS = 1;

/**
 * Evens out the triangles of a mesh without changing the shape it describes. Every vertex moves part of the
 * way to the average of its neighbours, scaled by its `weight` (0 leaves it alone), and is then put back on
 * the surface of the field. Edges become about the same length, which is what keeps the angle between
 * neighbouring faces small on a round shape such as a shoulder; because each vertex is projected back, the
 * outline stays where it was. Changes `positions` in place.
 */
export function relaxOntoSurface(
  positions: Float32Array,
  indices: Uint32Array,
  sdf: Sdf,
  weights: ArrayLike<number>,
  iterations: number,
  gradientStep: number,
): void {
  const lists = neighbours(positions.length / 3, indices);
  const active: number[] = [];
  for (let vertex = 0; vertex < lists.length; vertex++)
    if (weights[vertex]! > 0) active.push(vertex);
  const moved = new Float32Array(active.length * 3);

  for (let iteration = 0; iteration < iterations; iteration++) {
    for (const [slot, vertex] of active.entries()) {
      const around = lists[vertex]!;
      const factor = STEP * weights[vertex]!;
      for (let axis = 0; axis < 3; axis++) {
        let sum = 0;
        for (const other of around) sum += positions[other * 3 + axis]!;
        const own = positions[vertex * 3 + axis]!;
        moved[slot * 3 + axis] = own + factor * (sum / around.length - own);
      }
    }
    for (const [slot, vertex] of active.entries()) {
      let x = moved[slot * 3]!;
      let y = moved[slot * 3 + 1]!;
      let z = moved[slot * 3 + 2]!;
      for (let step = 0; step < PROJECTION_STEPS; step++) {
        const distance = sdf(x, y, z);
        const [nx, ny, nz] = gradient(sdf, x, y, z, gradientStep);
        x -= nx * distance;
        y -= ny * distance;
        z -= nz * distance;
      }
      positions.set([x, y, z], vertex * 3);
    }
  }
}
