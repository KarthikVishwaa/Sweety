import type { BodyProportions } from '../bodyProportions.ts';
import { loft } from './loft.ts';
import { axesAlong, ellipsoid, roundCone, type Part } from './sdf.ts';
import { add, along, normalize, radians, rotateY, scale, type Vec3 } from './vec.ts';

type Side = 1 | -1;

// A relaxed hand hanging beside the thigh: a smooth palm with a thumb pad, fingers that curl gently
// towards the palm in two soft sections, and a separate thumb turned forward. The palm faces the thigh
// and is turned slightly inward.
function handParts(p: BodyProportions, side: Side, wrist: Vec3, forearm: Vec3): Part[] {
  const hand = normalize(add(forearm, [0, -0.12, 0]));
  const facing = rotateY([0, 0, 1], -side * radians(15));
  const axes = axesAlong(hand, facing);
  const across = axes[2];
  const inward: Vec3 = [-side, 0, 0];
  const halfPalm = p.palmWidth / 2;

  const curled = normalize(add(hand, scale(inward, 0.55)));
  const thumbBase = along(along(wrist, hand, 0.022), across, halfPalm * 0.78);
  const thumbAngle = radians(p.thumbAngle);
  const thumb = normalize(
    add(
      add(scale(hand, Math.cos(thumbAngle)), scale(across, Math.sin(thumbAngle) * 0.85)),
      scale(inward, 0.15),
    ),
  );

  return [
    ellipsoid(along(wrist, hand, 0.032), [0.013, 0.034, halfPalm], 0.016, axes),
    ellipsoid(
      add(along(along(wrist, hand, 0.026), across, halfPalm * 0.5), scale(inward, 0.004)),
      [0.011, 0.02, 0.012],
      0.012,
      axes,
    ),
    ellipsoid(along(wrist, hand, 0.064), [0.0105, 0.022, halfPalm * 0.92], 0.012, axes),
    ellipsoid(
      add(along(wrist, hand, 0.082), scale(inward, 0.008)),
      [0.009, 0.018, halfPalm * 0.84],
      0.012,
      axesAlong(curled, facing),
    ),
    roundCone(thumbBase, along(thumbBase, thumb, 0.038), 0.0085, 0.006, 0.012),
  ];
}

// Arms hang a little away from the torso with a slight bend at the elbow.
export function armParts(p: BodyProportions, side: Side): Part[] {
  const angle = radians(p.armAngle);
  const shoulder: Vec3 = [side * (p.shoulderWidth / 2 - 0.036), p.shoulderY - 0.024, -0.006];
  const upper = normalize([side * Math.sin(angle), -Math.cos(angle), 0.02]);
  const elbow = along(shoulder, upper, (shoulder[1] - p.elbowY) / -upper[1]);
  const forearm = normalize([
    side * Math.sin(angle),
    -Math.cos(angle),
    Math.tan(radians(p.elbowBend)),
  ]);
  const wrist = along(elbow, forearm, (elbow[1] - p.wristY) / -forearm[1]);
  const upperArm = p.upperArmWidth / 2;
  const lowerArm = p.forearmWidth / 2;
  const outward: Vec3 = [side, 0, 0];
  const forward: Vec3 = [0, 0, 1];

  return [
    loft(
      shoulder,
      elbow,
      [
        { at: 0, width: upperArm, depth: upperArm * 1.06 },
        { at: 0.3, width: upperArm, depth: upperArm * 1.1, forward: 0.002 },
        { at: 0.75, width: upperArm * 0.86, depth: upperArm * 0.93 },
        { at: 1, width: upperArm * 0.77, depth: upperArm * 0.84, forward: -0.002 },
      ],
      outward,
      forward,
      0.016,
    ),
    ellipsoid([elbow[0], elbow[1], elbow[2] - 0.012], [0.02, 0.02, 0.02], 0.022),
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
