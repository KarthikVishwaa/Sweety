import type { Sdf } from './sdf.ts';

export interface SurfaceMesh {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

export interface SurfaceGrid {
  min: readonly [number, number, number];
  cells: readonly [number, number, number];
  voxel: number;
}

const BLOCK = 2;
const BLOCK_HALF_DIAGONAL = BLOCK * 0.87;
const BAND_MARGIN_VOXELS = 1;
const MAX_PROJECTION_VOXELS = 0.5;

// Corner offsets of a cell (bit 0 = x, bit 1 = y, bit 2 = z) and the 12 edges between them.
const CORNERS = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
] as const;
const EDGES = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [0, 2],
  [1, 3],
  [4, 6],
  [5, 7],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const;

// Samples the field on a regular grid, but only evaluates it exactly near the surface: blocks that are
// clearly inside or outside take the value measured at their centre, which is enough for the sign.
function sampleGrid(sdf: Sdf, grid: SurfaceGrid): Float32Array {
  const [cellsX, cellsY, cellsZ] = grid.cells;
  const sizeX = cellsX + 1;
  const sizeY = cellsY + 1;
  const sizeZ = cellsZ + 1;
  const samples = new Float32Array(sizeX * sizeY * sizeZ);
  const [minX, minY, minZ] = grid.min;
  const skipBeyond = (BLOCK_HALF_DIAGONAL + BAND_MARGIN_VOXELS) * grid.voxel;

  for (let startK = 0; startK < sizeZ; startK += BLOCK) {
    const endK = Math.min(startK + BLOCK, sizeZ);
    for (let startJ = 0; startJ < sizeY; startJ += BLOCK) {
      const endJ = Math.min(startJ + BLOCK, sizeY);
      for (let startI = 0; startI < sizeX; startI += BLOCK) {
        const endI = Math.min(startI + BLOCK, sizeX);
        const centre = sdf(
          minX + ((startI + endI - 1) / 2) * grid.voxel,
          minY + ((startJ + endJ - 1) / 2) * grid.voxel,
          minZ + ((startK + endK - 1) / 2) * grid.voxel,
        );
        const far = Math.abs(centre) > skipBeyond;

        for (let k = startK; k < endK; k++) {
          for (let j = startJ; j < endJ; j++) {
            for (let i = startI; i < endI; i++) {
              samples[i + sizeX * (j + sizeY * k)] = far
                ? centre
                : sdf(minX + i * grid.voxel, minY + j * grid.voxel, minZ + k * grid.voxel);
            }
          }
        }
      }
    }
  }
  return samples;
}

// Where two samples that are inside touch only diagonally across a face (a checkerboard), the quads
// either side of that face share one edge and the surface is no longer a manifold. Filling in the outside
// sample closest to the surface joins the two inside samples, so every such face has one clear shape.
function joinCheckerboards(samples: Float32Array, grid: SurfaceGrid): void {
  const [sizeX, sizeY, sizeZ] = grid.cells.map((cells) => cells + 1) as [number, number, number];
  const strides = [1, sizeX, sizeX * sizeY] as const;
  const sizes = [sizeX, sizeY, sizeZ] as const;

  for (const [first, second] of [
    [0, 1],
    [0, 2],
    [1, 2],
  ] as const) {
    const limit = [sizes[first]! - 1, sizes[second]! - 1] as const;
    for (let other = 0; other < sizeX * sizeY * sizeZ; other++) {
      const coordinates = [
        other % sizeX,
        Math.floor(other / sizeX) % sizeY,
        Math.floor(other / (sizeX * sizeY)),
      ];
      if (coordinates[first]! >= limit[0] || coordinates[second]! >= limit[1]) continue;
      const a = other;
      const b = a + strides[first]!;
      const c = a + strides[second]!;
      const d = b + strides[second]!;
      const inside = (index: number) => samples[index]! < 0;
      if (inside(a) === inside(d) && inside(b) === inside(c) && inside(a) !== inside(b)) {
        const outside = inside(a) ? [b, c] : [a, d];
        const weakest = samples[outside[0]!]! <= samples[outside[1]!]! ? outside[0]! : outside[1]!;
        samples[weakest] = -Math.abs(samples[weakest]!);
      }
    }
  }
}

export function gradient(
  sdf: Sdf,
  x: number,
  y: number,
  z: number,
  step: number,
): [number, number, number] {
  const gx = sdf(x + step, y, z) - sdf(x - step, y, z);
  const gy = sdf(x, y + step, z) - sdf(x, y - step, z);
  const gz = sdf(x, y, z + step) - sdf(x, y, z - step);
  const length = Math.hypot(gx, gy, gz) || 1;
  return [gx / length, gy / length, gz / length];
}

export function extractSurface(sdf: Sdf, grid: SurfaceGrid): SurfaceMesh {
  const [cellsX, cellsY, cellsZ] = grid.cells;
  const sizeX = cellsX + 1;
  const sizeY = cellsY + 1;
  const samples = sampleGrid(sdf, grid);
  joinCheckerboards(samples, grid);
  const sampleAt = (i: number, j: number, k: number) => samples[i + sizeX * (j + sizeY * k)]!;
  const cellAt = (i: number, j: number, k: number) => i + cellsX * (j + cellsY * k);
  const cellVertex = new Int32Array(cellsX * cellsY * cellsZ).fill(-1);
  const positions: number[] = [];
  const [minX, minY, minZ] = grid.min;
  const values = new Float32Array(8);

  for (let k = 0; k < cellsZ; k++) {
    for (let j = 0; j < cellsY; j++) {
      for (let i = 0; i < cellsX; i++) {
        let mask = 0;
        for (let corner = 0; corner < 8; corner++) {
          const [dx, dy, dz] = CORNERS[corner]!;
          const value = sampleAt(i + dx, j + dy, k + dz);
          values[corner] = value;
          if (value < 0) mask |= 1 << corner;
        }
        if (mask === 0 || mask === 255) continue;

        let sumX = 0;
        let sumY = 0;
        let sumZ = 0;
        let crossings = 0;
        for (const [from, to] of EDGES) {
          const start = values[from]!;
          const end = values[to]!;
          if (start < 0 === end < 0) continue;
          const t = start / (start - end);
          const [ax, ay, az] = CORNERS[from]!;
          const [bx, by, bz] = CORNERS[to]!;
          sumX += ax + (bx - ax) * t;
          sumY += ay + (by - ay) * t;
          sumZ += az + (bz - az) * t;
          crossings++;
        }
        cellVertex[cellAt(i, j, k)] = positions.length / 3;
        positions.push(
          minX + (i + sumX / crossings) * grid.voxel,
          minY + (j + sumY / crossings) * grid.voxel,
          minZ + (k + sumZ / crossings) * grid.voxel,
        );
      }
    }
  }

  const vertexCount = positions.length / 3;
  const normals = new Float32Array(vertexCount * 3);
  const projectionLimit = MAX_PROJECTION_VOXELS * grid.voxel;
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    const x = positions[vertex * 3]!;
    const y = positions[vertex * 3 + 1]!;
    const z = positions[vertex * 3 + 2]!;
    const [nx, ny, nz] = gradient(sdf, x, y, z, grid.voxel * 0.5);
    const offset = Math.max(-projectionLimit, Math.min(projectionLimit, sdf(x, y, z)));
    positions[vertex * 3] = x - nx * offset;
    positions[vertex * 3 + 1] = y - ny * offset;
    positions[vertex * 3 + 2] = z - nz * offset;
    normals.set([nx, ny, nz], vertex * 3);
  }

  const indices: number[] = [];
  const distance = (a: number, b: number) =>
    Math.hypot(
      positions[a * 3]! - positions[b * 3]!,
      positions[a * 3 + 1]! - positions[b * 3 + 1]!,
      positions[a * 3 + 2]! - positions[b * 3 + 2]!,
    );
  const addTriangle = (a: number, b: number, c: number) => {
    const abx = positions[b * 3]! - positions[a * 3]!;
    const aby = positions[b * 3 + 1]! - positions[a * 3 + 1]!;
    const abz = positions[b * 3 + 2]! - positions[a * 3 + 2]!;
    const acx = positions[c * 3]! - positions[a * 3]!;
    const acy = positions[c * 3 + 1]! - positions[a * 3 + 1]!;
    const acz = positions[c * 3 + 2]! - positions[a * 3 + 2]!;
    const faceX = aby * acz - abz * acy;
    const faceY = abz * acx - abx * acz;
    const faceZ = abx * acy - aby * acx;
    const facing =
      faceX * (normals[a * 3]! + normals[b * 3]! + normals[c * 3]!) +
      faceY * (normals[a * 3 + 1]! + normals[b * 3 + 1]! + normals[c * 3 + 1]!) +
      faceZ * (normals[a * 3 + 2]! + normals[b * 3 + 2]! + normals[c * 3 + 2]!);
    if (facing >= 0) indices.push(a, b, c);
    else indices.push(a, c, b);
  };
  const addQuad = (a: number, b: number, c: number, d: number) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (distance(a, c) <= distance(b, d)) {
      addTriangle(a, b, c);
      addTriangle(a, c, d);
    } else {
      addTriangle(b, c, d);
      addTriangle(b, d, a);
    }
  };
  const vertexAt = (i: number, j: number, k: number) => cellVertex[cellAt(i, j, k)]!;
  const crosses = (i: number, j: number, k: number, di: number, dj: number, dk: number) =>
    sampleAt(i, j, k) < 0 !== sampleAt(i + di, j + dj, k + dk) < 0;

  for (let k = 1; k < cellsZ; k++) {
    for (let j = 1; j < cellsY; j++) {
      for (let i = 1; i < cellsX; i++) {
        if (crosses(i, j, k, 1, 0, 0)) {
          addQuad(
            vertexAt(i, j - 1, k - 1),
            vertexAt(i, j, k - 1),
            vertexAt(i, j, k),
            vertexAt(i, j - 1, k),
          );
        }
        if (crosses(i, j, k, 0, 1, 0)) {
          addQuad(
            vertexAt(i - 1, j, k - 1),
            vertexAt(i, j, k - 1),
            vertexAt(i, j, k),
            vertexAt(i - 1, j, k),
          );
        }
        if (crosses(i, j, k, 0, 0, 1)) {
          addQuad(
            vertexAt(i - 1, j - 1, k),
            vertexAt(i, j - 1, k),
            vertexAt(i, j, k),
            vertexAt(i - 1, j, k),
          );
        }
      }
    }
  }

  return {
    positions: Float32Array.from(positions),
    normals,
    indices: Uint32Array.from(indices),
  };
}
