import type { BodyProportions } from '../bodyProportions.ts';
import { loft } from './loft.ts';
import { ellipsoid, type Part } from './sdf.ts';
import type { Vec3 } from './vec.ts';

type Side = 1 | -1;

/** Where a leg meets its foot: above the heel, a little behind the middle of the body. */
export const ankleCentre = (p: BodyProportions, side: Side): Vec3 => [
  side * (p.heelSpacing / 2),
  p.ankleY + 0.008,
  -0.012,
];

export function legParts(p: BodyProportions, side: Side): Part[] {
  const start: Vec3 = [side * (p.hipWidth / 4), p.hipJointY + 0.012, -0.004];
  const ankle = ankleCentre(p, side);
  const at = (y: number) => (start[1] - y) / (start[1] - ankle[1]);
  const thigh = p.thighWidth / 2;
  const knee = p.kneeWidth / 2;
  const calf = p.calfWidth / 2;
  const ankleHalf = p.ankleWidth / 2;
  const calfPeak = p.kneeY - 0.27 * (p.kneeY - p.ankleY);

  return [
    loft(
      start,
      ankle,
      [
        { at: 0, width: thigh * 0.8, depth: thigh * 0.86, side: -0.006, forward: -0.006 },
        {
          at: at(p.hipJointY),
          width: thigh * 0.92,
          depth: thigh * 0.96,
          side: -0.008,
          forward: -0.006,
        },
        {
          at: at(p.crotchY),
          width: thigh * 0.86,
          depth: thigh * 1.04,
          side: 0.002,
          forward: -0.004,
        },
        {
          at: at(p.crotchY - 0.06),
          width: thigh * 0.88,
          depth: thigh * 0.98,
          side: 0.006,
          forward: 0.007,
        },
        {
          at: at(p.kneeY + 0.065),
          width: thigh * 0.72,
          depth: thigh * 0.8,
          side: 0.004,
          forward: 0.008,
        },
        // The kneecap is a slight forward swell of the section, not a separate shape.
        { at: at(p.kneeY + 0.005), width: knee, depth: knee * 1.12, side: 0.002, forward: 0.006 },
        {
          at: at(p.kneeY - 0.035),
          width: knee * 0.98,
          depth: knee * 1.04,
          side: 0.002,
          forward: -0.004,
        },
        { at: at(calfPeak), width: calf, depth: calf * 1.12, side: 0.002, forward: -0.009 },
        { at: at(0.15), width: calf * 0.78, depth: calf * 0.85, forward: -0.006 },
        { at: at(0.09), width: ankleHalf * 1.15, depth: ankleHalf * 1.2, forward: -0.002 },
        { at: 1, width: ankleHalf, depth: ankleHalf * 1.05 },
      ],
      [side, 0, 0],
      [0, 0, 1],
      0.03,
    ),
    ellipsoid(
      [ankle[0] - side * ankleHalf * 0.85, p.ankleY + 0.016, ankle[2]],
      [0.007, 0.008, 0.007],
      0.012,
    ),
    ellipsoid(
      [ankle[0] + side * ankleHalf * 0.9, p.ankleY + 0.006, ankle[2] - 0.004],
      [0.007, 0.008, 0.007],
      0.012,
    ),
  ];
}
