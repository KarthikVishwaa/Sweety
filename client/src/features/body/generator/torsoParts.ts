import type { BodyProportions } from '../bodyProportions.ts';
import { loft, type LoftStation } from './loft.ts';
import { ellipsoid, roundCone, type Part } from './sdf.ts';
import { shoulderLine } from './shoulderLine.ts';

// Pelvis, abdomen, ribcage and chest as one lofted column. The centre line moves forward at the lower
// back and back at the ribs, which gives the spine its gentle S-curve in side view.
function torsoColumn(p: BodyProportions): Part {
  const hip = (p.hipWidth / 2) * 0.96;
  const waist = (p.waistWidth / 2) * 0.96;
  const chest = p.chestWidth / 2;
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  // Both rounded ends are buried: the lower one between the thighs, the upper one inside the neck, so the
  // sides run on into the legs and the neck without a seam.
  const glute = 0.004 * p.gluteSize;
  const bottomDepth = (p.hipDepth / 2) * 0.78;
  const bottom = p.crotchY + 0.03;
  const line = shoulderLine(p);
  const top = line.neckBaseY + 0.02;
  const at = (y: number) => (y - bottom) / (top - bottom);

  // The waist flares into the hips over the whole height of the pelvis, with no plateau at the hip joint
  // (a plateau reads as a belt line). `flare` runs from 0 at the waist to 1 at the bottom of the pelvis.
  const pelvis = (y: number, flare: number): LoftStation => ({
    at: at(y),
    width: mix(waist, hip, flare),
    depth: mix(p.waistDepth / 2, (p.hipDepth / 2) * 0.92 + glute, flare),
    forward: mix(0.009, -0.002 - glute, flare),
  });

  const stations: LoftStation[] = [
    { ...pelvis(bottom, 1), width: hip * 0.985, depth: bottomDepth + glute },
    pelvis(p.hipJointY, 0.96),
    pelvis(p.hipJointY + 0.027, 0.72),
    pelvis(p.hipJointY + 0.054, 0.4),
    pelvis(p.navelY + 0.008, 0),
    {
      at: at(p.navelY + 0.055),
      width: mix(waist, chest, 0.55),
      depth: (p.chestDepth / 2) * 0.93,
      forward: 0.008,
    },
    { at: at(p.chestY), width: chest, depth: p.chestDepth / 2, forward: 0.004 },
    {
      at: at(p.chestY + 0.04),
      width: chest * 1.03,
      depth: (p.chestDepth / 2) * 0.92,
      forward: -0.002,
    },
    // The ribcage narrows under the shoulder tube (which makes the shoulders themselves) and into the neck.
    {
      at: at(line.neckBaseY - 0.03),
      width: chest * 0.66,
      depth: (p.chestDepth / 2) * 0.6,
      forward: -0.008,
    },
    {
      at: at(line.neckBaseY),
      width: line.neckReach,
      depth: p.neckWidth / 2,
      forward: -0.012,
    },
    { at: 1, width: p.neckWidth / 2, depth: p.neckWidth / 2, forward: -0.012 },
  ];
  return loft([0, bottom, 0], [0, top, 0], stations, [1, 0, 0], [0, 0, 1], 0.02);
}

export function torsoParts(p: BodyProportions): Part[] {
  const parts: Part[] = [
    torsoColumn(p),
    // Fills the front of the pelvis between the thighs; it tapers into the crotch, so it has no edge.
    roundCone([0, p.hipJointY - 0.02, 0.01], [0, p.crotchY + 0.012, 0.012], 0.038, 0.026, 0.05),
  ];
  // The male chest stays a broad flat plane. The female one is a low, soft contour that projects about
  // 0.012 beyond the ribcage line, is narrower than the ribcage and is blended in over a large radius. (The
  // whole field is evaluated on |x|, so one side is enough.)
  if (p.chestContour > 0) {
    parts.push(
      ellipsoid(
        [0.04, p.chestY - 0.018, 0.0035 + p.chestDepth / 2 - 0.02 + 0.012 * p.chestContour],
        [0.036, 0.036, 0.02],
        0.03,
      ),
    );
  }
  return parts;
}
