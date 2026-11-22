import type { BodyProportions } from '../bodyProportions.ts';
import { radians, type Vec3 } from './vec.ts';

/** The deltoid is a little fuller than the arm below it. */
const DELTOID_FULLNESS = 1.08;
const JOINT_Z = -0.014;
/** How far down the arm the deltoid reaches before it becomes the plain upper arm. */
export const DELTOID_LENGTH = 0.06;

/**
 * The outline of the shoulder girdle seen from the front. The top of the shoulder is one straight slope that
 * leaves the neck `neckLength` below the chin and falls at `trapeziusSlope`; it runs on into the round cap
 * of the shoulder joint and from there down the arm. Everything is derived from that one line, so the
 * neck, the slope, the cap and the arm cannot disagree.
 */
export function shoulderLine(p: BodyProportions) {
  const slope = radians(p.trapeziusSlope);
  const neckHalf = p.neckWidth / 2;
  const neckBaseY = p.chinY - p.neckLength;
  const radius = (p.upperArmWidth / 2) * DELTOID_FULLNESS;
  const jointX = p.shoulderWidth / 2 - radius;

  // The slope is the upper tangent of the joint sphere; it reaches height `neckBaseY` at the neck's edge.
  const tangentX = jointX + radius * Math.sin(slope);
  const jointY = neckBaseY - radius * Math.cos(slope) - (tangentX - neckHalf) * Math.tan(slope);
  const lineY = (x: number) => jointY + radius * Math.cos(slope) + (tangentX - x) * Math.tan(slope);

  // A second sphere on the same line, on the body's centre, buried in the neck.
  const neckSphere = neckHalf * 1.12;
  const neckTangentX = neckSphere * Math.sin(slope);
  const neckCentre: Vec3 = [0, lineY(neckTangentX) - neckSphere * Math.cos(slope), JOINT_Z + 0.002];

  return {
    neckBaseY,
    neckReach: neckHalf * 1.25,
    joint: [jointX, jointY, JOINT_Z] as Vec3,
    deltoidRadius: radius,
    neckCentre,
    neckSphere,
  };
}
