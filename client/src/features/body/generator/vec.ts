export type Vec3 = readonly [number, number, number];

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const length = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export function normalize(a: Vec3): Vec3 {
  const size = length(a);
  return size === 0 ? [0, 0, 0] : scale(a, 1 / size);
}

/** Point `from + direction * distance`. */
export const along = (from: Vec3, direction: Vec3, distance: number): Vec3 =>
  add(from, scale(direction, distance));

/** Rotates about the vertical axis; a positive angle turns +z towards +x. */
export function rotateY(a: Vec3, radians: number): Vec3 {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [a[0] * cos + a[2] * sin, a[1], -a[0] * sin + a[2] * cos];
}

export const radians = (degrees: number): number => (degrees * Math.PI) / 180;
