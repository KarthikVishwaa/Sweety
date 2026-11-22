import type { BodyProportions } from '../bodyProportions.ts';
import { radians } from './vec.ts';

/**
 * The outline of the shoulder girdle seen from the front: from the acromion the trapezius rises towards
 * the neck at `trapeziusSlope`, and meets the neck `neckLength` below the chin.
 */
export function shoulderLine(p: BodyProportions) {
  const neckHalf = p.neckWidth / 2;
  // Half the shoulder width, less the deltoid that sits outside the girdle itself.
  const reach = p.shoulderWidth / 2 - 0.034;
  const neckReach = neckHalf * 1.25;
  const neckBaseY = p.chinY - p.neckLength;
  const acromionY = neckBaseY - Math.tan(radians(p.trapeziusSlope)) * (reach - neckReach);
  return { reach, neckReach, neckBaseY, acromionY };
}
