import type { BodyProportions } from '../bodyProportions.ts';
import { ellipsoid, roundCone, type Part } from './sdf.ts';

// Deltoid caps, clavicles and the trapezius slope into a conical neck that leans very slightly forward.
export function shoulderParts(p: BodyProportions): Part[] {
  const halfShoulder = p.shoulderWidth / 2;
  const parts: Part[] = [
    roundCone(
      [0, p.shoulderY - 0.004, -0.014],
      [0, p.chinY + 0.018, 0],
      (p.neckWidth / 2) * 1.12,
      (p.neckWidth / 2) * 0.95,
      0.026,
    ),
  ];

  for (const side of [1, -1] as const) {
    parts.push(
      ellipsoid(
        [side * (halfShoulder - 0.033), p.shoulderY - 0.024, -0.004],
        [0.031, 0.042, 0.036],
        0.03,
      ),
      roundCone(
        [0, p.shoulderY + 0.03, -0.02],
        [side * (halfShoulder - 0.05), p.shoulderY - 0.004, -0.012],
        0.028,
        0.02,
        0.02,
      ),
    );
  }
  return parts;
}

// A faceless head: an egg-shaped cranium that is a little deeper at the back, a tapered jaw and chin.
export function headParts(p: BodyProportions): Part[] {
  const top = p.chinY + p.headHeight;
  return [
    ellipsoid([0, top - 0.062, -0.006], [0.045, 0.062, 0.053], 0.02),
    ellipsoid([0, top - 0.06, -0.02], [0.041, 0.048, 0.042], 0.02),
    ellipsoid([0, p.chinY + 0.042, 0.008], [0.036, 0.042, 0.038], 0.022),
    roundCone([0, p.chinY + 0.03, 0.002], [0, p.chinY + 0.013, 0.022], 0.029, 0.014, 0.016),
  ];
}
