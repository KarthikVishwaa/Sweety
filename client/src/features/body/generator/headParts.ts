import type { BodyProportions } from '../bodyProportions.ts';
import { ellipsoid, roundCone, type Part } from './sdf.ts';

export function headParts(p: BodyProportions): Part[] {
  const top = p.chinY + p.headHeight;
  return [
    ellipsoid([0, top - 0.062, -0.006], [0.045, 0.062, 0.053], 0.02),
    ellipsoid([0, top - 0.06, -0.02], [0.041, 0.048, 0.042], 0.02),
    ellipsoid([0, p.chinY + 0.042, 0.008], [0.036, 0.042, 0.038], 0.022),
    roundCone([0, p.chinY + 0.03, 0.002], [0, p.chinY + 0.013, 0.022], 0.029, 0.014, 0.016),
  ];
}
