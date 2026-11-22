import type { BodyProportions } from '../bodyProportions.ts';

export interface BodyMeshReport {
  triangles: number;
  height: number;
  components: number;
  boundaryEdges: number;
  nonManifoldEdges: number;
  degenerateTriangles: number;
  signedVolume: number;
  /** Largest distance from a vertex's mirror image to the nearest vertex, as a fraction of the height. */
  asymmetry: number;
  footLength: number;
  shoulderWidth: number;
  waistWidth: number;
  hipWidth: number;
}

const DEGENERATE_AREA = 1e-12;
const SLICE_HALF_HEIGHT = 0.004;
const SLICE_BIN = 0.004;
const MIRROR_CELL = 0.01;
const MIRROR_STRIDE = 5;
const SYMMETRY_TOLERANCE = 0.002;
const WIDTH_TOLERANCE = 0.015;
const FOOT_TOLERANCE = 0.008;

function edgeCounts(indices: ArrayLike<number>, vertexCount: number): Map<number, number> {
  const counts = new Map<number, number>();
  for (let index = 0; index < indices.length; index += 3) {
    for (const [from, to] of [
      [0, 1],
      [1, 2],
      [2, 0],
    ] as const) {
      const a = indices[index + from]!;
      const b = indices[index + to]!;
      const key = Math.min(a, b) * vertexCount + Math.max(a, b);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

function countComponents(indices: ArrayLike<number>, vertexCount: number): number {
  const parent = Int32Array.from({ length: vertexCount }, (_, index) => index);
  const root = (vertex: number): number => {
    while (parent[vertex] !== vertex) {
      parent[vertex] = parent[parent[vertex]!]!;
      vertex = parent[vertex]!;
    }
    return vertex;
  };
  const used = new Uint8Array(vertexCount);
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index]!;
    used[a] = 1;
    for (const other of [indices[index + 1]!, indices[index + 2]!]) {
      used[other] = 1;
      parent[root(other)] = root(a);
    }
  }
  let roots = 0;
  for (let vertex = 0; vertex < vertexCount; vertex++)
    if (used[vertex] && root(vertex) === vertex) roots++;
  return roots;
}

function triangleGeometry(positions: ArrayLike<number>, indices: ArrayLike<number>) {
  let volume = 0;
  let degenerate = 0;
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index]! * 3;
    const b = indices[index + 1]! * 3;
    const c = indices[index + 2]! * 3;
    const ab = [
      positions[b]! - positions[a]!,
      positions[b + 1]! - positions[a + 1]!,
      positions[b + 2]! - positions[a + 2]!,
    ];
    const ac = [
      positions[c]! - positions[a]!,
      positions[c + 1]! - positions[a + 1]!,
      positions[c + 2]! - positions[a + 2]!,
    ];
    const cross = [
      ab[1]! * ac[2]! - ab[2]! * ac[1]!,
      ab[2]! * ac[0]! - ab[0]! * ac[2]!,
      ab[0]! * ac[1]! - ab[1]! * ac[0]!,
    ];
    if (Math.hypot(cross[0]!, cross[1]!, cross[2]!) / 2 < DEGENERATE_AREA) degenerate++;
    volume +=
      (positions[a]! * cross[0]! + positions[a + 1]! * cross[1]! + positions[a + 2]! * cross[2]!) /
      6;
  }
  return { volume, degenerate };
}

function asymmetry(positions: ArrayLike<number>): number {
  const cells = new Map<string, number[]>();
  const cellOf = (x: number, y: number, z: number) =>
    `${Math.floor(x / MIRROR_CELL)},${Math.floor(y / MIRROR_CELL)},${Math.floor(z / MIRROR_CELL)}`;
  for (let index = 0; index < positions.length; index += 3) {
    const key = cellOf(positions[index]!, positions[index + 1]!, positions[index + 2]!);
    const list = cells.get(key);
    if (list) list.push(index);
    else cells.set(key, [index]);
  }
  let worst = 0;
  for (let index = 0; index < positions.length; index += 3 * MIRROR_STRIDE) {
    const x = -positions[index]!;
    const y = positions[index + 1]!;
    const z = positions[index + 2]!;
    let nearest = Infinity;
    const [cx, cy, cz] = [x, y, z].map((value) => Math.floor(value / MIRROR_CELL));
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          for (const other of cells.get(`${cx! + dx},${cy! + dy},${cz! + dz}`) ?? []) {
            nearest = Math.min(
              nearest,
              Math.hypot(
                positions[other]! - x,
                positions[other + 1]! - y,
                positions[other + 2]! - z,
              ),
            );
          }
        }
      }
    }
    worst = Math.max(worst, nearest);
  }
  return worst;
}

// Width of the body at a height, counting only the part joined to the middle (not the arms beside it).
function widthAt(positions: ArrayLike<number>, height: number): number {
  const occupied = new Set<number>();
  for (let index = 0; index < positions.length; index += 3) {
    if (Math.abs(positions[index + 1]! - height) <= SLICE_HALF_HEIGHT) {
      occupied.add(Math.floor(positions[index]! / SLICE_BIN));
    }
  }
  let right = 0;
  while (occupied.has(right + 1)) right++;
  let left = -1;
  while (occupied.has(left - 1)) left--;
  return (right - left + 1) * SLICE_BIN;
}

function widestAt(positions: ArrayLike<number>, from: number, to: number): number {
  let widest = 0;
  for (let height = from; height <= to; height += SLICE_HALF_HEIGHT) {
    widest = Math.max(widest, widthAt(positions, height));
  }
  return widest;
}

function footLength(positions: ArrayLike<number>, toeOut: number): number {
  const angle = (toeOut * Math.PI) / 180;
  const along = [Math.sin(angle), Math.cos(angle)];
  let low = Infinity;
  let high = -Infinity;
  for (let index = 0; index < positions.length; index += 3) {
    if (positions[index]! <= 0 || positions[index + 1]! > 0.03) continue;
    const projected = positions[index]! * along[0]! + positions[index + 2]! * along[1]!;
    low = Math.min(low, projected);
    high = Math.max(high, projected);
  }
  return high - low;
}

/** Measures a figure at unit height: topology, orientation, symmetry and its main proportions. */
export function measureBodyMesh(
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
  proportions: BodyProportions,
): BodyMeshReport {
  const vertexCount = positions.length / 3;
  let low = Infinity;
  let high = -Infinity;
  for (let index = 1; index < positions.length; index += 3) {
    low = Math.min(low, positions[index]!);
    high = Math.max(high, positions[index]!);
  }
  const edges = [...edgeCounts(indices, vertexCount).values()];
  const { volume, degenerate } = triangleGeometry(positions, indices);

  return {
    triangles: indices.length / 3,
    height: high - low,
    components: countComponents(indices, vertexCount),
    boundaryEdges: edges.filter((count) => count === 1).length,
    nonManifoldEdges: edges.filter((count) => count > 2).length,
    degenerateTriangles: degenerate,
    signedVolume: volume,
    asymmetry: asymmetry(positions),
    footLength: footLength(positions, proportions.toeOut),
    shoulderWidth: widestAt(positions, proportions.shoulderY - 0.04, proportions.shoulderY),
    waistWidth: widthAt(positions, proportions.navelY),
    hipWidth: widestAt(positions, proportions.crotchY, proportions.hipJointY + 0.01),
  };
}

/** Everything that is wrong with a figure; an empty list means it passes. */
export function bodyMeshProblems(report: BodyMeshReport, proportions: BodyProportions): string[] {
  const problems: string[] = [];
  const check = (ok: boolean, message: string) => {
    if (!ok) problems.push(message);
  };
  const near = (measured: number, expected: number, tolerance: number) =>
    Math.abs(measured - expected) <= tolerance;

  check(Math.abs(report.height - 1) < 1e-3, `height is ${report.height}, expected 1`);
  check(report.components === 1, `${report.components} connected components, expected 1`);
  check(report.boundaryEdges === 0, `${report.boundaryEdges} boundary edges (holes)`);
  check(report.nonManifoldEdges === 0, `${report.nonManifoldEdges} non-manifold edges`);
  check(report.degenerateTriangles === 0, `${report.degenerateTriangles} degenerate triangles`);
  check(report.signedVolume > 0, 'normals point inward (negative volume)');
  check(report.asymmetry <= SYMMETRY_TOLERANCE, `left/right asymmetry ${report.asymmetry}`);
  check(
    near(report.footLength, proportions.footLength, FOOT_TOLERANCE),
    `foot length ${report.footLength.toFixed(3)}, expected about ${proportions.footLength}`,
  );
  for (const [name, measured, expected] of [
    ['shoulder', report.shoulderWidth, proportions.shoulderWidth],
    ['waist', report.waistWidth, proportions.waistWidth],
    ['hip', report.hipWidth, proportions.hipWidth],
  ] as const) {
    check(
      near(measured, expected, WIDTH_TOLERANCE),
      `${name} width ${measured.toFixed(3)}, expected about ${expected}`,
    );
  }
  return problems;
}
