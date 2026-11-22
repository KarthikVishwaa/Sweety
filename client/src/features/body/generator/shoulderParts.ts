import type { BodyProportions } from '../bodyProportions.ts';
import { armFrame } from './armParts.ts';
import { roundCone, type Part } from './sdf.ts';
import { DELTOID_LENGTH, shoulderLine } from './shoulderLine.ts';
import { along, type Vec3 } from './vec.ts';

/** Blend where the shoulder meets the chest and neck: wide, so the armpit and the neck base are soft. */
const BODY_BLEND = 0.04;
/** Blend between parts that share a sphere and already meet tangentially, so it only needs to hide the join. */
const JOIN_BLEND = 0.006;

// The neck, and one bent tube for the shoulder: from a sphere in the neck, along a single straight slope, over
// the round cap of the shoulder joint and on down the arm as the deltoid. Because the pieces share their
// spheres they meet tangentially, so there is no ridge, no collar and no separate lump for the deltoid.
export function shoulderParts(p: BodyProportions): Part[] {
  const line = shoulderLine(p);
  const neck = p.neckWidth / 2;
  const { shoulder, upper } = armFrame(p, 1);
  const upperArm = p.upperArmWidth / 2;
  const neckBottom: Vec3 = [0, line.neckBaseY - 0.045, -0.014];

  // The whole field is evaluated on |x|, so only the right-hand side is built.
  return [
    roundCone(neckBottom, [0, p.chinY + 0.018, 0.002], neck * 1.12, neck * 0.95, BODY_BLEND),
    roundCone(line.neckCentre, shoulder, line.neckSphere, line.deltoidRadius, BODY_BLEND),
    roundCone(
      shoulder,
      along(shoulder, upper, DELTOID_LENGTH),
      line.deltoidRadius,
      upperArm,
      JOIN_BLEND,
    ),
  ];
}
