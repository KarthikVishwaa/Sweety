import type { BodyProportions } from '../bodyProportions.ts';
import { ankleCentre } from './legParts.ts';
import { loft, type LoftStation } from './loft.ts';
import { carve, ellipsoid, type Part } from './sdf.ts';
import { add, along, radians, rotateY, scale, type Vec3 } from './vec.ts';

type Side = 1 | -1;

/** How far in front of the back of the heel the ankle sits. */
const HEEL_TO_ANKLE = 0.04;
/** Every part of the sole dips this far below the ground, so cutting at y = 0 leaves a flat sole. */
const SOLE_DIP = 0.003;

// A foot: a rounded heel, a high instep, a forefoot that is widest at the ball (72 per cent of the
// length) and a rounded toe box whose big-toe edge stays straighter. The medial arch is carved out
// of the underside, and the toes turn outward.
export function footParts(p: BodyProportions, side: Side): Part[] {
  const length = p.footLength;
  const turn = side * radians(p.toeOut);
  const forward = rotateY([0, 0, 1], turn);
  const outward = rotateY([side, 0, 0], turn);
  const up: Vec3 = [0, 1, 0];
  const ankle = ankleCentre(p, side);
  const heelBack: Vec3 = [
    ankle[0] - forward[0] * HEEL_TO_ANKLE,
    0,
    ankle[2] - forward[2] * HEEL_TO_ANKLE,
  ];
  const heel = p.heelWidth / 2;
  const ball = p.ballWidth / 2;
  const tipHeight = 0.013;
  // The loft's rounded ends reach one cap-length past its ends, so it stops short of heel and toes.
  const startAt = heel;
  const endAt = length - tipHeight;
  const at = (fraction: number) => (fraction * length - startAt) / (endAt - startAt);
  // In a foot station `forward` is the height of the section's centre and `depth` its half-height.
  const station = (fraction: number, width: number, top: number, offset = 0): LoftStation => {
    const bottom = -SOLE_DIP;
    return {
      at: at(fraction),
      width,
      depth: (top - bottom) / 2,
      forward: (top + bottom) / 2,
      side: offset,
    };
  };

  const placed = (distance: number, sideways: number, height: number): Vec3 =>
    add(add(along(heelBack, forward, distance), scale(outward, sideways)), [0, height, 0]);
  const footAxes: [Vec3, Vec3, Vec3] = [outward, up, forward];

  return [
    loft(
      along(heelBack, forward, startAt),
      along(heelBack, forward, endAt),
      [
        { ...station(0.08, heel * 0.92, 0.046), at: 0 },
        station(0.28, heel * 1.1, 0.066),
        station(0.5, ball * 0.8, 0.055, 0.002),
        station(0.72, ball, 0.039, 0.006),
        station(0.86, ball * 0.92, 0.029, 0.005),
        station(0.95, ball * 0.82, 0.024, 0.002),
        { at: 1, width: ball * 0.72, depth: tipHeight, forward: 0.01, side: 0 },
      ],
      outward,
      up,
      0.014,
    ),
    carve(
      ellipsoid(
        placed(0.46 * length, -(heel + 0.002), -0.002),
        [0.02, 0.006 + p.archHeight * 0.4, 0.046],
        0.012,
        footAxes,
      ),
    ),
  ];
}
