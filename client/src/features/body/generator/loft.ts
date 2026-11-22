import type { Part } from './sdf.ts';
import { add, cross, dot, length, normalize, scale, sub, type Vec3 } from './vec.ts';

/**
 * One cross-section of a lofted shape, `at` a fraction 0 to 1 of the way from start to end. The section
 * is an ellipse with half-sizes `width` (along the side axis) and `depth` (along the depth axis), whose
 * centre can be pushed `side` and `forward` from the axis.
 */
export interface LoftStation {
  at: number;
  width: number;
  depth: number;
  side?: number;
  forward?: number;
}

const LOOKUP_SIZE = 128;
const PROFILE_KEYS = ['width', 'depth', 'side', 'forward'] as const;
type ProfileKey = (typeof PROFILE_KEYS)[number];

const value = (station: LoftStation, key: ProfileKey): number => station[key] ?? 0;

// Cubic Hermite with Catmull-Rom tangents, so the outline has no flat spot or kink at a station. The
// slope is zero at the first and last station, where the rounded end caps join without a crease.
function interpolate(stations: LoftStation[], at: number, key: ProfileKey): number {
  let index = 0;
  while (index < stations.length - 2 && at > stations[index + 1]!.at) index++;
  const from = stations[index]!;
  const to = stations[index + 1]!;
  const before = stations[Math.max(index - 1, 0)]!;
  const after = stations[Math.min(index + 2, stations.length - 1)]!;
  const span = to.at - from.at;
  const t = Math.min(Math.max((at - from.at) / span, 0), 1);
  const first = index === 0;
  const last = index + 1 === stations.length - 1;
  const tangentFrom = first
    ? 0
    : ((value(to, key) - value(before, key)) / (to.at - before.at)) * span;
  const tangentTo = last
    ? 0
    : ((value(after, key) - value(from, key)) / (after.at - from.at)) * span;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * value(from, key) +
    (t3 - 2 * t2 + t) * tangentFrom +
    (-2 * t3 + 3 * t2) * value(to, key) +
    (t3 - t2) * tangentTo
  );
}

function sample(stations: LoftStation[]): Record<ProfileKey, Float32Array> {
  const profile = {} as Record<ProfileKey, Float32Array>;
  for (const key of PROFILE_KEYS) {
    profile[key] = new Float32Array(LOOKUP_SIZE);
    for (let index = 0; index < LOOKUP_SIZE; index++) {
      profile[key][index] = interpolate(stations, index / (LOOKUP_SIZE - 1), key);
    }
  }
  return profile;
}

/**
 * A smooth shape swept from `start` to `end` with an elliptical cross-section that changes along the
 * way: the torso, a limb segment or a foot. `sideHint` and `depthHint` say which way the section's
 * width and depth point; `side` offsets are measured along `sideHint`.
 */
export function loft(
  start: Vec3,
  end: Vec3,
  stations: LoftStation[],
  sideHint: Vec3,
  depthHint: Vec3,
  blend: number,
): Part {
  const axis = sub(end, start);
  const size = length(axis);
  const direction = normalize(axis);
  const depthAxis = normalize(sub(depthHint, scale(direction, dot(depthHint, direction))));
  let sideAxis = normalize(cross(depthAxis, direction));
  if (dot(sideAxis, sideHint) < 0) sideAxis = scale(sideAxis, -1);
  const profile = sample(stations);
  const widest = Math.max(...profile.width, ...profile.depth);
  const offset = Math.max(...profile.side.map(Math.abs), ...profile.forward.map(Math.abs));

  return {
    distance: (x, y, z) => {
      const p = sub([x, y, z], start);
      const distanceAlong = dot(p, direction);
      const at = Math.min(Math.max(distanceAlong / size, 0), 1);
      const position = at * (LOOKUP_SIZE - 1);
      const lower = Math.floor(position);
      const upper = Math.min(lower + 1, LOOKUP_SIZE - 1);
      const mix = position - lower;
      const read = (key: ProfileKey) =>
        profile[key][lower]! + (profile[key][upper]! - profile[key][lower]!) * mix;

      const local = sub(p, scale(direction, at * size));
      const width = read('width');
      const depth = read('depth');
      const u = (dot(local, sideAxis) - read('side')) / width;
      const v = (dot(local, depthAxis) - read('forward')) / depth;
      // Past either end the section closes as half an ellipsoid, so the ends are rounded, not flat.
      const cap = Math.min(width, depth);
      const past = Math.max(-distanceAlong, distanceAlong - size, 0) / cap;
      const k0 = Math.hypot(u, v, past);
      const k1 = Math.hypot(u / width, v / depth, past / cap);
      return k1 === 0 ? -Math.min(width, depth) : (k0 * (k0 - 1)) / k1;
    },
    center: add(start, scale(axis, 0.5)),
    radius: size / 2 + widest + offset,
    blend,
  };
}
