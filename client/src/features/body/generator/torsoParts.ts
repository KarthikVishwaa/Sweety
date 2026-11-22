import type { BodyProportions } from '../bodyProportions.ts';
import { loft, type LoftStation } from './loft.ts';
import { ellipsoid, type Part } from './sdf.ts';

// Pelvis, abdomen, ribcage and chest as one lofted column. The centre line moves forward at the lower
// back and back at the ribs, which gives the spine its gentle S-curve in side view.
function torsoColumn(p: BodyProportions): Part {
  const hip = (p.hipWidth / 2) * 0.9;
  const waist = (p.waistWidth / 2) * 0.96;
  const chest = p.chestWidth / 2;
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  // Both rounded ends are buried: the lower one between the thighs, the upper one under the trapezius
  // and neck, so the column's sides run on into the legs and shoulders without a seam.
  const bottomDepth = (p.hipDepth / 2) * 0.78;
  const bottom = p.crotchY + 0.03;
  const top = p.shoulderY + 0.02;
  const at = (y: number) => (y - bottom) / (top - bottom);

  const stations: LoftStation[] = [
    { at: 0, width: hip * 0.98, depth: bottomDepth, forward: -0.002 },
    { at: at(p.hipJointY), width: hip, depth: (p.hipDepth / 2) * 0.92, forward: -0.002 },
    {
      at: at((p.hipJointY + p.navelY) / 2 + 0.004),
      width: mix(hip, waist, 0.6),
      depth: (p.waistDepth / 2) * 1.03,
      forward: 0.005,
    },
    { at: at(p.navelY + 0.008), width: waist, depth: p.waistDepth / 2, forward: 0.009 },
    {
      at: at(p.navelY + 0.055),
      width: mix(waist, chest, 0.55),
      depth: (p.chestDepth / 2) * 0.93,
      forward: 0.008,
    },
    { at: at(p.chestY), width: chest, depth: p.chestDepth / 2, forward: 0.004 },
    {
      at: at(p.chestY + 0.045),
      width: chest * 1.04,
      depth: (p.chestDepth / 2) * 0.94,
      forward: -0.002,
    },
    {
      at: at(p.shoulderY - 0.022),
      width: chest * 0.84,
      depth: (p.chestDepth / 2) * 0.78,
      forward: -0.008,
    },
    { at: 1, width: chest * 0.5, depth: 0.04, forward: -0.012 },
  ];
  return loft([0, bottom, 0], [0, top, 0], stations, [1, 0, 0], [0, 0, 1], 0.02);
}

export function torsoParts(p: BodyProportions): Part[] {
  const glute = p.gluteSize;
  const contour = p.chestContour;
  const parts: Part[] = [
    torsoColumn(p),
    // A soft lower abdomen that fills the front between the thighs (no anatomical detail).
    ellipsoid([0, p.crotchY + 0.028, (p.hipDepth / 2) * 0.5], [0.046, 0.044, 0.026], 0.05),
  ];

  for (const side of [1, -1] as const) {
    parts.push(
      ellipsoid(
        [side * 0.042, p.hipJointY - 0.032, -(p.hipDepth / 2) * 0.42],
        [0.044 * glute, 0.056, 0.043 * glute],
        0.034,
      ),
    );
    // The male chest stays a broad flat plane; the female one gets a subtle, natural contour.
    if (contour > 0) {
      parts.push(
        ellipsoid(
          [side * 0.045, p.chestY - 0.006, p.chestDepth / 2 - 0.02 - 0.012 * (1 - contour)],
          [0.044, 0.04, 0.024],
          0.04,
        ),
      );
    }
  }
  return parts;
}
