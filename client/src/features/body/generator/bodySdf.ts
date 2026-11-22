import { BODY_PROPORTIONS, type Gender } from '../bodyProportions.ts';
import { armParts } from './armParts.ts';
import { footParts } from './footParts.ts';
import { headParts, shoulderParts } from './headParts.ts';
import { legParts } from './legParts.ts';
import { smoothMax, smoothMin, type Part, type Sdf } from './sdf.ts';
import { torsoParts } from './torsoParts.ts';

/** The sole is cut flat on the ground with a slightly rounded edge. */
const SOLE_EDGE_BLEND = 0.003;

function bodyParts(gender: Gender): Part[] {
  const p = BODY_PROPORTIONS[gender];
  return [
    ...torsoParts(p),
    ...shoulderParts(p),
    ...headParts(p),
    ...([1, -1] as const).flatMap((side) => [
      ...armParts(p, side),
      ...legParts(p, side),
      ...footParts(p, side),
    ]),
  ];
}

const distanceToBound = (part: Part, x: number, y: number, z: number) =>
  Math.hypot(x - part.center[0], y - part.center[1], z - part.center[2]) - part.radius;

/** One signed-distance field for the whole figure, at unit height, standing on y = 0 and facing +z. */
export function createBodySdf(gender: Gender): Sdf {
  const parts = bodyParts(gender);
  const added = parts.filter((part) => !part.carve);
  const carved = parts.filter((part) => part.carve);

  // Evaluated on |x|, so the field (and therefore the mesh) is exactly symmetric left to right.
  return (signedX, y, z) => {
    const x = Math.abs(signedX);
    let result = Infinity;
    for (const part of added) {
      if (distanceToBound(part, x, y, z) - part.blend >= result) continue;
      const distance = part.distance(x, y, z);
      result = result === Infinity ? distance : smoothMin(result, distance, part.blend);
    }
    for (const part of carved) {
      if (distanceToBound(part, x, y, z) >= part.blend - result) continue;
      result = smoothMax(result, -part.distance(x, y, z), part.blend);
    }
    return smoothMax(result, -y, SOLE_EDGE_BLEND);
  };
}
