// Measurements of the neck-to-shoulder region of a finished figure (at unit height), used to keep the
// shoulders smooth: no ridge along the top, no lump at the outer end.
const REGION = { halfWidth: 0.15, bottom: 0.75, top: 0.84 } as const;
const PROFILE = { from: 0.042, to: 0.112, step: 0.004, ceiling: 0.86, depth: 0.12 } as const;
/** A rise of the top of the shoulder this big, from one sample to the next further out, is a bump. */
const BUMP_HEIGHT = 0.0006;

function inRegion(x: number, y: number): boolean {
  return Math.abs(x) <= REGION.halfWidth && y >= REGION.bottom && y <= REGION.top;
}

/** The largest angle in degrees between the normals of two faces that share an edge, in the region. */
export function shoulderCreaseDegrees(
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
): number {
  const normals = new Map<number, [number, number, number]>();
  for (let face = 0; face < indices.length / 3; face++) {
    const [a, b, c] = [indices[face * 3]!, indices[face * 3 + 1]!, indices[face * 3 + 2]!];
    const x = (positions[a * 3]! + positions[b * 3]! + positions[c * 3]!) / 3;
    const y = (positions[a * 3 + 1]! + positions[b * 3 + 1]! + positions[c * 3 + 1]!) / 3;
    if (!inRegion(x, y)) continue;
    const ux = positions[b * 3]! - positions[a * 3]!;
    const uy = positions[b * 3 + 1]! - positions[a * 3 + 1]!;
    const uz = positions[b * 3 + 2]! - positions[a * 3 + 2]!;
    const vx = positions[c * 3]! - positions[a * 3]!;
    const vy = positions[c * 3 + 1]! - positions[a * 3 + 1]!;
    const vz = positions[c * 3 + 2]! - positions[a * 3 + 2]!;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const length = Math.hypot(nx, ny, nz) || 1;
    normals.set(face, [nx / length, ny / length, nz / length]);
  }

  const vertexCount = positions.length / 3;
  const owner = new Map<number, number>();
  let widest = 0;
  for (const face of normals.keys()) {
    for (const [from, to] of [
      [0, 1],
      [1, 2],
      [2, 0],
    ] as const) {
      const a = indices[face * 3 + from]!;
      const b = indices[face * 3 + to]!;
      const edge = Math.min(a, b) * vertexCount + Math.max(a, b);
      const other = owner.get(edge);
      if (other === undefined) {
        owner.set(edge, face);
        continue;
      }
      const [x1, y1, z1] = normals.get(face)!;
      const [x2, y2, z2] = normals.get(other)!;
      const cosine = Math.min(Math.max(x1 * x2 + y1 * y2 + z1 * z2, -1), 1);
      widest = Math.max(widest, Math.acos(cosine));
    }
  }
  return (widest * 180) / Math.PI;
}

/** How many times the top of the shoulder rises, going from the neck out to the arm. Zero is a clean slope. */
export function shoulderProfileBumps(positions: ArrayLike<number>): number {
  const samples = Math.round((PROFILE.to - PROFILE.from) / PROFILE.step) + 1;
  const tops = new Array<number>(samples).fill(-Infinity);
  for (let index = 0; index < positions.length; index += 3) {
    const x = Math.abs(positions[index]!);
    const y = positions[index + 1]!;
    if (
      y < REGION.bottom ||
      y > PROFILE.ceiling ||
      Math.abs(positions[index + 2]!) > PROFILE.depth
    ) {
      continue;
    }
    const sample = Math.round((x - PROFILE.from) / PROFILE.step);
    if (sample < 0 || sample >= samples) continue;
    if (Math.abs(x - (PROFILE.from + sample * PROFILE.step)) < PROFILE.step / 2) {
      tops[sample] = Math.max(tops[sample]!, y);
    }
  }
  let bumps = 0;
  for (let sample = 1; sample < samples; sample++) {
    if (tops[sample]! - tops[sample - 1]! > BUMP_HEIGHT) bumps++;
  }
  return bumps;
}
