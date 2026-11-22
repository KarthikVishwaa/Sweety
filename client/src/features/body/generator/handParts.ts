import type { BodyProportions } from '../bodyProportions.ts';
import { axesAlong, ellipsoid, roundCone, type Part } from './sdf.ts';
import { add, along, normalize, radians, rotateY, scale, type Vec3 } from './vec.ts';

type Side = 1 | -1;

/** Wrist to the knuckles, as a fraction of the stature. */
const PALM_LENGTH = 0.054;
/** Bend of the three finger sections towards the palm, cumulative, in degrees. */
const FINGER_BEND = [14, 38, 62] as const;
const FINGER_RADIUS = 0.0057;
const FINGER_BLEND = 0.008;
/** How far the outer fingers fan away from the middle ones, in degrees per finger. */
const FINGER_FAN = 6;

interface Finger {
  /** Position across the palm, from the thumb side (1) to the little finger side (-1), as a fraction of half the palm. */
  across: number;
  lengths: readonly [number, number, number];
}

const FINGERS: Finger[] = [
  { across: 0.74, lengths: [0.024, 0.0145, 0.0125] },
  { across: 0.25, lengths: [0.027, 0.0165, 0.0135] },
  { across: -0.25, lengths: [0.0255, 0.0155, 0.013] },
  { across: -0.74, lengths: [0.02, 0.0115, 0.011] },
];

// Three sections that curl a little more at each joint, so the finger reads as a relaxed hook.
function finger(start: Vec3, direction: Vec3, curl: Vec3, lengths: Finger['lengths']): Part[] {
  const parts: Part[] = [];
  let from = start;
  for (const [index, length] of lengths.entries()) {
    const bend = radians(FINGER_BEND[index]!);
    const section = normalize(add(scale(direction, Math.cos(bend)), scale(curl, Math.sin(bend))));
    const to = along(from, section, length);
    parts.push(
      roundCone(
        from,
        to,
        FINGER_RADIUS * (1 - 0.07 * index),
        FINGER_RADIUS * (1 - 0.07 * (index + 1)),
        FINGER_BLEND,
      ),
    );
    from = to;
  }
  return parts;
}

// A relaxed hand hanging beside the thigh with the palm turned slightly inward: a flat palm with a
// thumb pad, four slightly fanned fingers that curl towards the palm, and a thumb in two sections.
export function handParts(p: BodyProportions, side: Side, wrist: Vec3, forearm: Vec3): Part[] {
  const hand = normalize(add(forearm, [0, -0.12, 0]));
  const facing = rotateY([0, 0, 1], -side * radians(15));
  const axes = axesAlong(hand, facing);
  const across = axes[2];
  const inward: Vec3 = [-side, 0, 0];
  const halfPalm = p.palmWidth / 2;

  const palm: Part[] = [
    ellipsoid(
      along(wrist, hand, PALM_LENGTH * 0.55),
      [0.0125, PALM_LENGTH * 0.62, halfPalm],
      0.016,
      axes,
    ),
    ellipsoid(
      add(along(along(wrist, hand, 0.026), across, halfPalm * 0.55), scale(inward, 0.004)),
      [0.011, 0.02, 0.012],
      0.014,
      axes,
    ),
  ];

  const fingers = FINGERS.flatMap(({ across: position, lengths }, index) => {
    const fan = radians(FINGER_FAN * (1.5 - index));
    const direction = normalize(add(hand, scale(across, Math.tan(fan))));
    const base = along(along(wrist, hand, PALM_LENGTH), across, halfPalm * position);
    return finger(base, direction, inward, lengths);
  });

  const thumbBase = along(along(wrist, hand, 0.03), across, halfPalm * 0.85);
  const outwardTurn = radians(p.thumbAngle);
  const first = normalize(
    add(
      add(scale(hand, Math.cos(outwardTurn)), scale(across, Math.sin(outwardTurn) * 0.8)),
      scale(inward, 0.1),
    ),
  );
  const knuckle = along(thumbBase, first, 0.03);
  const second = normalize(add(add(scale(hand, 0.85), scale(across, 0.25)), scale(inward, 0.45)));
  const thumb = [
    roundCone(thumbBase, knuckle, 0.0092, 0.0073, 0.014),
    roundCone(knuckle, along(knuckle, second, 0.03), 0.0073, 0.0058, 0.006),
  ];

  return [...palm, ...fingers, ...thumb];
}
