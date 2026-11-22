import type { BodyProportions } from '../bodyProportions.ts';
import { ankleCentre } from './legParts.ts';
import { loft, type LoftStation } from './loft.ts';
import { carve, ellipsoid, roundCone, type Part } from './sdf.ts';
import { add, along, radians, rotateY, scale, type Vec3 } from './vec.ts';

type Side = 1 | -1;

/** How far in front of the back of the heel the ankle sits. */
const HEEL_TO_ANKLE = 0.04;
/** Every part of the sole dips this far below the ground, so cutting at y = 0 leaves a flat sole. */
const SOLE_DIP = 0.003;

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

  // Along the inner edge the big toe stands a little proud of the rest of the toe box.
  const bigToe = roundCone(
    placed(0.8 * length, -ball * 0.5, 0.0215),
    placed(0.975 * length, -ball * 0.36, 0.0125),
    0.0098,
    0.0085,
    0.01,
  );

  return [
    loft(
      along(heelBack, forward, startAt),
      along(heelBack, forward, endAt),
      [
        { ...station(0.08, heel * 0.9, 0.05), at: 0 },
        station(0.22, heel * 1.08, 0.07),
        station(0.36, heel * 1.02, 0.074),
        station(0.52, ball * 0.84, 0.058, 0.002),
        station(0.72, ball, 0.039, 0.005),
        station(0.86, ball * 0.9, 0.0295, 0.003),
        station(0.95, ball * 0.74, 0.0235, -0.001),
        { at: 1, width: ball * 0.5, depth: tipHeight, forward: 0.01, side: -0.003 },
      ],
      outward,
      up,
      0.014,
    ),
    bigToe,
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
