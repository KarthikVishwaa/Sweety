import type { BodyProportions } from '../bodyProportions.ts';
import { armFrame } from './armParts.ts';
import { roundCone, type Part } from './sdf.ts';
import { shoulderLine } from './shoulderLine.ts';
import { along } from './vec.ts';

// The neck, a soft clavicle ridge and the deltoid as one teardrop that follows the top of the upper arm,
// with a generous blend into the girdle so there is no ball and no armpit-style groove.
export function shoulderParts(p: BodyProportions): Part[] {
  const neck = p.neckWidth / 2;
  const parts: Part[] = [
    roundCone(
      [0, shoulderLine(p).neckBaseY - 0.045, -0.014],
      [0, p.chinY + 0.018, 0.002],
      neck * 1.12,
      neck * 0.95,
      0.03,
    ),
  ];

  // The whole field is evaluated on |x|, so only the right-hand side is built.
  const { shoulder, upper } = armFrame(p, 1);
  parts.push(
    roundCone(
      [0.014, p.shoulderY - 0.036, 0.04],
      [shoulder[0] - 0.01, p.shoulderY - 0.012, 0.022],
      0.0065,
      0.006,
      0.04,
    ),
    roundCone(along(shoulder, upper, -0.004), along(shoulder, upper, 0.05), 0.028, 0.0215, 0.04),
  );
  return parts;
}
