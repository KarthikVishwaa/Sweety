import type { BodyProportions } from '../bodyProportions.ts';
import { handParts } from './handParts.ts';
import { loft } from './loft.ts';
import { ellipsoid, type Part } from './sdf.ts';
import { DELTOID_LENGTH, shoulderLine } from './shoulderLine.ts';
import { along, normalize, radians, type Vec3 } from './vec.ts';

type Side = 1 | -1;

/** A wide blend where the upper arm meets the ribcage, so the armpit is a soft fold and not a crease. */
const ARMPIT_BLEND = 0.04;

/** The shoulder joint and the direction of the upper arm, which the deltoid is aligned with. */
export function armFrame(p: BodyProportions, side: Side) {
  const angle = radians(p.armAngle);
  // The joint sits a little behind the middle of the ribcage, so the arm hangs beside it, not in front of it.
  const [jointX, jointY, jointZ] = shoulderLine(p).joint;
  const shoulder: Vec3 = [side * jointX, jointY, jointZ];
  const upper = normalize([side * Math.sin(angle), -Math.cos(angle), 0.02]);
  return { shoulder, upper };
}

// Arms hang a little away from the torso with a relaxed bend at the elbow.
export function armParts(p: BodyProportions, side: Side): Part[] {
  const angle = radians(p.armAngle);
  const { shoulder, upper } = armFrame(p, side);
  const elbow = along(shoulder, upper, (shoulder[1] - p.elbowY) / -upper[1]);
  const forearm = normalize([
    side * Math.sin(angle),
    -Math.cos(angle),
    Math.tan(radians(p.elbowBend)),
  ]);
  const wrist = along(elbow, forearm, (elbow[1] - p.wristY) / -forearm[1]);
  const upperArm = p.upperArmWidth / 2;
  const armStart = along(shoulder, upper, DELTOID_LENGTH);
  const lowerArm = p.forearmWidth / 2;
  const outward: Vec3 = [side, 0, 0];
  const forward: Vec3 = [0, 0, 1];

  return [
    loft(
      armStart,
      elbow,
      [
        // Starts exactly where the deltoid ends (a circle of the same radius), then fills out a little.
        { at: 0, width: upperArm, depth: upperArm },
        { at: 0.12, width: upperArm, depth: upperArm * 1.05 },
        { at: 0.3, width: upperArm, depth: upperArm * 1.1, forward: 0.002 },
        { at: 0.75, width: upperArm * 0.86, depth: upperArm * 0.93 },
        { at: 1, width: upperArm * 0.77, depth: upperArm * 0.84, forward: -0.002 },
      ],
      outward,
      forward,
      ARMPIT_BLEND,
    ),
    ellipsoid([elbow[0], elbow[1], elbow[2] - 0.01], [0.019, 0.019, 0.019], 0.03),
    loft(
      elbow,
      wrist,
      [
        { at: 0, width: lowerArm * 0.95, depth: lowerArm * 0.95 },
        { at: 0.25, width: lowerArm * 1.08, depth: lowerArm * 1.02, forward: 0.002 },
        { at: 0.6, width: lowerArm * 0.83, depth: lowerArm * 0.76 },
        { at: 1, width: lowerArm * 0.45, depth: p.wristDepth / 2 },
      ],
      outward,
      forward,
      0.015,
    ),
    ...handParts(p, side, wrist, forearm),
  ];
}
