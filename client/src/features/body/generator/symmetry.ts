const CELL = 0.0012;
/** Mirror images that are further apart than this are not the same vertex. */
const TOLERANCE = 0.0012;

const cellOf = (value: number): number => Math.floor(value / CELL);

// A cheap hash of a cell; two cells may share one, which is fine because every candidate's distance is checked.
const hashOf = (x: number, y: number, z: number): number =>
  (cellOf(x) * 73856093) ^ (cellOf(y) * 19349663) ^ (cellOf(z) * 83492791);

/**
 * For every vertex, the vertex that is its mirror image across x = 0, or -1 when there is none. A mesh that
 * is extracted from a symmetric field on a symmetric grid has one for almost every vertex.
 */
export function mirrorPairs(positions: Float32Array): Int32Array {
  const count = positions.length / 3;
  const cells = new Map<number, number[]>();
  for (let vertex = 0; vertex < count; vertex++) {
    const key = hashOf(
      positions[vertex * 3]!,
      positions[vertex * 3 + 1]!,
      positions[vertex * 3 + 2]!,
    );
    const list = cells.get(key);
    if (list) list.push(vertex);
    else cells.set(key, [vertex]);
  }

  const pairs = new Int32Array(count).fill(-1);
  for (let vertex = 0; vertex < count; vertex++) {
    const x = -positions[vertex * 3]!;
    const y = positions[vertex * 3 + 1]!;
    const z = positions[vertex * 3 + 2]!;
    let nearest = TOLERANCE;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = hashOf(x + dx * CELL, y + dy * CELL, z + dz * CELL);
          for (const other of cells.get(key) ?? []) {
            const distance = Math.hypot(
              positions[other * 3]! - x,
              positions[other * 3 + 1]! - y,
              positions[other * 3 + 2]! - z,
            );
            if (distance < nearest) {
              nearest = distance;
              pairs[vertex] = other;
            }
          }
        }
      }
    }
  }
  return pairs;
}

/** Puts each pair of mirrored vertices back at mirrored positions (their average), so the mesh is symmetric. */
export function restoreSymmetry(positions: Float32Array, pairs: Int32Array): void {
  for (let vertex = 0; vertex < pairs.length; vertex++) {
    const mirror = pairs[vertex]!;
    if (mirror <= vertex) continue;
    const x = (positions[vertex * 3]! - positions[mirror * 3]!) / 2;
    const y = (positions[vertex * 3 + 1]! + positions[mirror * 3 + 1]!) / 2;
    const z = (positions[vertex * 3 + 2]! + positions[mirror * 3 + 2]!) / 2;
    positions.set([x, y, z], vertex * 3);
    positions.set([-x, y, z], mirror * 3);
  }
}
