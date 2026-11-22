import { cross, dot, length, normalize, scale, sub, type Vec3 } from './vec.ts';

export type Sdf = (x: number, y: number, z: number) => number;

/** A rounded shape that is smoothly added to, or carved out of, the body. */
export interface Part {
  distance: Sdf;
  /** Bounding sphere: further away than this (plus the blend) the part cannot change the result. */
  center: Vec3;
  radius: number;
  /** Blend radius used where this part meets the shape built before it. */
  blend: number;
  carve?: boolean;
}

/** Polynomial smooth minimum: a union with a rounded fillet of about `blend`. */
export function smoothMin(a: number, b: number, blend: number): number {
  const h = Math.max(blend - Math.abs(a - b), 0) / blend;
  return Math.min(a, b) - h * h * blend * 0.25;
}

export const smoothMax = (a: number, b: number, blend: number): number => -smoothMin(-a, -b, blend);

/** An ellipsoid with its own axes (unit, orthogonal) and a radius along each. */
export function ellipsoid(
  center: Vec3,
  radii: Vec3,
  blend: number,
  axes?: [Vec3, Vec3, Vec3],
): Part {
  const [ax, ay, az]: [Vec3, Vec3, Vec3] = axes ?? [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const [rx, ry, rz] = radii;

  return {
    distance: (x, y, z) => {
      const p = sub([x, y, z], center);
      const u = dot(p, ax);
      const v = dot(p, ay);
      const w = dot(p, az);
      const k0 = Math.hypot(u / rx, v / ry, w / rz);
      const k1 = Math.hypot(u / (rx * rx), v / (ry * ry), w / (rz * rz));
      return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
    },
    center,
    radius: Math.max(rx, ry, rz),
    blend,
  };
}

/** Builds orthonormal axes whose second axis is `main`, with the third as close as possible to `hint`. */
export function axesAlong(main: Vec3, hint: Vec3): [Vec3, Vec3, Vec3] {
  const second = normalize(main);
  const third = normalize(sub(hint, scale(second, dot(hint, second))));
  return [cross(second, third), second, third];
}

/** A cone with rounded ends between two points (a capsule when the radii are equal). */
export function roundCone(a: Vec3, b: Vec3, radiusA: number, radiusB: number, blend: number): Part {
  const ba = sub(b, a);
  const l2 = dot(ba, ba);
  const rr = radiusA - radiusB;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;

  return {
    distance: (x, y, z) => {
      const pa = sub([x, y, z], a);
      const t = dot(pa, ba);
      const beyond = t - l2;
      const qx = pa[0] * l2 - ba[0] * t;
      const qy = pa[1] * l2 - ba[1] * t;
      const qz = pa[2] * l2 - ba[2] * t;
      const x2 = qx * qx + qy * qy + qz * qz;
      const y2 = t * t * l2;
      const z2 = beyond * beyond * l2;
      const k = Math.sign(rr) * rr * rr * x2;
      if (Math.sign(beyond) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - radiusB;
      if (Math.sign(t) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - radiusA;
      return (Math.sqrt(x2 * a2 * il2) + t * rr) * il2 - radiusA;
    },
    center: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    radius: length(ba) / 2 + Math.max(radiusA, radiusB),
    blend,
  };
}

/** The same part, but carved out of the body instead of added to it. */
export const carve = (part: Part): Part => ({ ...part, carve: true });
