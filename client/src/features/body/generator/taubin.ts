const SHRINK = 0.5;
const INFLATE = -0.53;

export function neighbours(vertexCount: number, indices: Uint32Array): number[][] {
  const lists: number[][] = Array.from({ length: vertexCount }, () => []);
  const link = (a: number, b: number) => {
    if (!lists[a]!.includes(b)) lists[a]!.push(b);
    if (!lists[b]!.includes(a)) lists[b]!.push(a);
  };
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index]!;
    const b = indices[index + 1]!;
    const c = indices[index + 2]!;
    link(a, b);
    link(b, c);
    link(c, a);
  }
  return lists;
}

function relax(positions: Float32Array, lists: number[][], factor: number): void {
  const moved = new Float32Array(positions.length);
  for (let vertex = 0; vertex < lists.length; vertex++) {
    const around = lists[vertex]!;
    for (let axis = 0; axis < 3; axis++) {
      const own = positions[vertex * 3 + axis]!;
      let sum = 0;
      for (const other of around) sum += positions[other * 3 + axis]!;
      const average = around.length > 0 ? sum / around.length : own;
      moved[vertex * 3 + axis] = own + factor * (average - own);
    }
  }
  positions.set(moved);
}

/**
 * Taubin smoothing: a shrinking step followed by an inflating one, so stair-steps from the voxel grid
 * disappear without the figure losing volume. Changes `positions` in place.
 */
export function taubinSmooth(
  positions: Float32Array,
  indices: Uint32Array,
  iterations: number,
): void {
  const lists = neighbours(positions.length / 3, indices);
  for (let iteration = 0; iteration < iterations; iteration++) {
    relax(positions, lists, SHRINK);
    relax(positions, lists, INFLATE);
  }
}
