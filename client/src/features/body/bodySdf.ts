import { BODY_PROPORTIONS, type BodyModel, type BodyProportions } from './bodyProportions';

type Vec3 = readonly [number, number, number];
type Sdf = (x: number, y: number, z: number) => number;

interface Part {
  distance: Sdf;
  /** Bounding sphere: parts further away than this (plus the blend) cannot change the union. */
  center: Vec3;
  radius: number;
  /** Blend radius used when this part is smoothly joined to the parts before it. */
  blend: number;
}

interface TorsoStation {
  y: number;
  halfWidth: number;
  halfDepth: number;
}

const TORSO_LOOKUP_SIZE = 96;

function smoothMin(a: number, b: number, blend: number): number {
  const h = Math.max(blend - Math.abs(a - b), 0) / blend;
  return Math.min(a, b) - h * h * blend * 0.25;
}

function ellipsoid(center: Vec3, radii: Vec3, blend: number): Part {
  const [cx, cy, cz] = center;
  const [rx, ry, rz] = radii;
  return {
    distance: (x, y, z) => {
      const px = x - cx;
      const py = y - cy;
      const pz = z - cz;
      const ax = px / rx;
      const ay = py / ry;
      const az = pz / rz;
      const bx = px / (rx * rx);
      const by = py / (ry * ry);
      const bz = pz / (rz * rz);
      const k0 = Math.sqrt(ax * ax + ay * ay + az * az);
      const k1 = Math.sqrt(bx * bx + by * by + bz * bz);
      return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
    },
    center,
    radius: Math.max(rx, ry, rz),
    blend,
  };
}

// A cone with rounded ends between two points (a capsule when the radii are equal).
function roundCone(a: Vec3, b: Vec3, radiusA: number, radiusB: number, blend: number): Part {
  const bax = b[0] - a[0];
  const bay = b[1] - a[1];
  const baz = b[2] - a[2];
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = radiusA - radiusB;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;

  return {
    distance: (x, y, z) => {
      const pax = x - a[0];
      const pay = y - a[1];
      const paz = z - a[2];
      const along = pax * bax + pay * bay + paz * baz;
      const beyond = along - l2;
      const qx = pax * l2 - bax * along;
      const qy = pay * l2 - bay * along;
      const qz = paz * l2 - baz * along;
      const x2 = qx * qx + qy * qy + qz * qz;
      const y2 = along * along * l2;
      const z2 = beyond * beyond * l2;
      const k = Math.sign(rr) * rr * rr * x2;
      if (Math.sign(beyond) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - radiusB;
      if (Math.sign(along) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - radiusA;
      return (Math.sqrt(x2 * a2 * il2) + along * rr) * il2 - radiusA;
    },
    center: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    radius: Math.sqrt(l2) / 2 + Math.max(radiusA, radiusB),
    blend,
  };
}

// Cubic Hermite interpolation with Catmull-Rom tangents, so the outline has no flat spot at a station.
function hermite(stations: TorsoStation[], y: number, key: 'halfWidth' | 'halfDepth'): number {
  let segment = 0;
  while (segment < stations.length - 2 && y > stations[segment + 1]!.y) segment++;
  const from = stations[segment]!;
  const to = stations[segment + 1]!;
  const before = stations[Math.max(segment - 1, 0)]!;
  const after = stations[Math.min(segment + 2, stations.length - 1)]!;
  const span = to.y - from.y;
  const t = Math.min(Math.max((y - from.y) / span, 0), 1);
  const tangentFrom = ((to[key] - before[key]) / (to.y - before.y)) * span;
  const tangentTo = ((after[key] - from[key]) / (after.y - from.y)) * span;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * from[key] +
    (t3 - 2 * t2 + t) * tangentFrom +
    (-2 * t3 + 3 * t2) * to[key] +
    (t3 - t2) * tangentTo
  );
}

// An elliptical column whose width and depth change smoothly with height.
function loftedTorso(stations: TorsoStation[], blend: number): Part {
  const bottom = stations[0]!.y;
  const top = stations[stations.length - 1]!.y;
  const halfWidths = new Float32Array(TORSO_LOOKUP_SIZE);
  const halfDepths = new Float32Array(TORSO_LOOKUP_SIZE);

  for (let index = 0; index < TORSO_LOOKUP_SIZE; index++) {
    const y = bottom + ((top - bottom) * index) / (TORSO_LOOKUP_SIZE - 1);
    halfWidths[index] = hermite(stations, y, 'halfWidth');
    halfDepths[index] = hermite(stations, y, 'halfDepth');
  }

  const middle = (top + bottom) / 2;
  const halfHeight = (top - bottom) / 2;
  const widest = Math.max(...halfWidths);

  return {
    distance: (x, y, z) => {
      const position =
        ((Math.min(Math.max(y, bottom), top) - bottom) / (top - bottom)) * (TORSO_LOOKUP_SIZE - 1);
      const lower = Math.floor(position);
      const upper = Math.min(lower + 1, TORSO_LOOKUP_SIZE - 1);
      const mix = position - lower;
      const halfWidth = halfWidths[lower]! + (halfWidths[upper]! - halfWidths[lower]!) * mix;
      const halfDepth = halfDepths[lower]! + (halfDepths[upper]! - halfDepths[lower]!) * mix;

      const nx = x / halfWidth;
      const nz = z / halfDepth;
      const section = (Math.sqrt(nx * nx + nz * nz) - 1) * Math.min(halfWidth, halfDepth);
      const vertical = Math.abs(y - middle) - halfHeight;
      const outsideSection = Math.max(section, 0);
      const outsideVertical = Math.max(vertical, 0);
      return (
        Math.min(Math.max(section, vertical), 0) +
        Math.sqrt(outsideSection * outsideSection + outsideVertical * outsideVertical)
      );
    },
    center: [0, middle, 0],
    radius: Math.hypot(halfHeight, widest) * 1.1,
    blend,
  };
}

function normalised(x: number, y: number, z: number): Vec3 {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

function along(from: Vec3, direction: Vec3, length: number): Vec3 {
  return [
    from[0] + direction[0] * length,
    from[1] + direction[1] * length,
    from[2] + direction[2] * length,
  ];
}

function torsoStations(p: BodyProportions, S: number): TorsoStation[] {
  const chestHalfWidth = p.shoulderWidth * 0.4 * S;
  const chestHalfDepth = (p.chestDepth / 2) * S;
  const waistHalfWidth = (p.waistWidth / 2) * S;
  const hipHalfWidth = (p.hipWidth / 2) * S * 0.9;
  const hipHalfDepth = chestHalfDepth * 0.95;
  const waistHalfDepth = chestHalfDepth * (p.bust > 0 ? 0.8 : 0.84);
  const neckHalfWidth = (p.neckWidth / 2) * S;

  return [
    {
      y: (p.crotchHeight - 0.01) * S,
      halfWidth: hipHalfWidth * 0.8,
      halfDepth: hipHalfDepth * 0.8,
    },
    { y: (p.hipY + 0.005) * S, halfWidth: hipHalfWidth * 0.97, halfDepth: hipHalfDepth },
    { y: p.waistY * S, halfWidth: waistHalfWidth, halfDepth: waistHalfDepth },
    {
      y: ((p.waistY + p.chestY) / 2) * S,
      halfWidth: waistHalfWidth + (chestHalfWidth - waistHalfWidth) * 0.5,
      halfDepth: chestHalfDepth * 0.92,
    },
    { y: p.chestY * S, halfWidth: chestHalfWidth, halfDepth: chestHalfDepth },
    {
      y: (p.shoulderY - 0.035) * S,
      halfWidth: chestHalfWidth * 1.03,
      halfDepth: chestHalfDepth * 0.86,
    },
    { y: p.shoulderY * S, halfWidth: neckHalfWidth * 2.7, halfDepth: chestHalfDepth * 0.55 },
    {
      y: (p.shoulderY + 0.025) * S,
      halfWidth: neckHalfWidth * 1.5,
      halfDepth: neckHalfWidth * 1.3,
    },
  ];
}

function armParts(p: BodyProportions, S: number, side: 1 | -1): Part[] {
  const angle = (p.armAngle * Math.PI) / 180;
  const shoulderX = (p.shoulderWidth / 2 - p.shoulderRadius) * S;
  const shoulder: Vec3 = [side * shoulderX, (p.shoulderY - 0.012) * S, -0.004 * S];
  const upperDirection = normalised(side * Math.sin(angle), -Math.cos(angle), 0.06);
  const elbow = along(shoulder, upperDirection, 0.186 * S);
  const foreDirection = normalised(side * Math.sin(angle + 0.05), -Math.cos(angle + 0.05), 0.14);
  const wrist = along(elbow, foreDirection, 0.146 * S);
  const palm = along(wrist, foreDirection, 0.048 * S);
  const thumbBase = along(wrist, foreDirection, 0.028 * S);
  const thumbTip = along(wrist, foreDirection, 0.07 * S);

  return [
    ellipsoid(
      shoulder,
      [p.shoulderRadius * S, p.shoulderRadius * S * 1.05, p.shoulderRadius * S],
      0.03 * S,
    ),
    roundCone(shoulder, elbow, p.upperArmRadius * S, p.elbowRadius * S, 0.03 * S),
    roundCone(elbow, wrist, p.elbowRadius * S * 0.97, p.wristRadius * S, 0.025 * S),
    ellipsoid(palm, [0.0135 * S, 0.056 * S, 0.0255 * S], 0.02 * S),
    roundCone(
      [thumbBase[0], thumbBase[1], thumbBase[2] + 0.014 * S],
      [thumbTip[0], thumbTip[1], thumbTip[2] + 0.02 * S],
      0.0075 * S,
      0.0058 * S,
      0.012 * S,
    ),
  ];
}

function legParts(p: BodyProportions, S: number, side: 1 | -1): Part[] {
  const hipX = p.hipWidth * 0.275 * S;
  const hipY = (p.crotchHeight + 0.05) * S;
  const kneeY = p.kneeY * S;
  const ankleY = p.ankleY * S;
  const kneeRadius = p.kneeRadius * S;
  const ankleRadius = 0.024 * S;
  const footCenterX = side * (hipX - 0.006 * S);

  // The thighs meet where their radius equals the hip offset, which puts the crotch at the table value.
  const crotchFraction = (hipY - p.crotchHeight * S) / (hipY - kneeY);
  const thighRadius = (hipX - kneeRadius * crotchFraction) / (1 - crotchFraction);

  return [
    roundCone(
      [side * hipX, hipY, 0],
      [side * (hipX - 0.004 * S), kneeY, 0.006 * S],
      thighRadius,
      kneeRadius,
      0.04 * S,
    ),
    roundCone(
      [side * (hipX - 0.004 * S), kneeY, 0.006 * S],
      [footCenterX, ankleY, -0.004 * S],
      kneeRadius * 0.98,
      ankleRadius,
      0.03 * S,
    ),
    ellipsoid(
      [side * (hipX - 0.004 * S), 0.205 * S, -0.012 * S],
      [0.034 * S, 0.07 * S, 0.038 * S],
      0.035 * S,
    ),
    roundCone(
      [footCenterX, 0.027 * S, -0.03 * S],
      [side * (hipX + 0.004 * S), 0.019 * S, 0.085 * S],
      0.027 * S,
      0.019 * S,
      0.025 * S,
    ),
  ];
}

function bodyParts(p: BodyProportions): Part[] {
  const S = p.stature;
  const headHeight = p.headHeight * S;
  const headRadiusY = headHeight / 2;
  const headCenterY = S - headRadiusY;
  const neckHalfWidth = (p.neckWidth / 2) * S;
  const glute = p.gluteSize;

  const parts: Part[] = [
    loftedTorso(torsoStations(p, S), 0.03 * S),
    roundCone(
      [0, (p.shoulderY - 0.02) * S, -0.004 * S],
      [0, headCenterY - headRadiusY * 0.55, 0.012 * S],
      neckHalfWidth * 1.05,
      neckHalfWidth * 0.95,
      0.03 * S,
    ),
    ellipsoid([0, headCenterY, 0.008 * S], [0.0475 * S, headRadiusY, 0.056 * S], 0.02 * S),
    ellipsoid([0, headCenterY - 0.032 * S, 0.02 * S], [0.036 * S, 0.034 * S, 0.04 * S], 0.02 * S),
    ellipsoid(
      [-0.036 * S, (p.hipY - 0.03) * S, -0.04 * S],
      [0.034 * S * glute, 0.055 * S, 0.034 * S * glute],
      0.035 * S,
    ),
    ellipsoid(
      [0.036 * S, (p.hipY - 0.03) * S, -0.04 * S],
      [0.034 * S * glute, 0.055 * S, 0.034 * S * glute],
      0.035 * S,
    ),
  ];

  for (const side of [1, -1] as const) {
    const trapStart: Vec3 = [0, (p.shoulderY + 0.012) * S, -0.006 * S];
    const trapEnd: Vec3 = [
      side * (p.shoulderWidth / 2 - p.shoulderRadius * 1.6) * S,
      (p.shoulderY - 0.014) * S,
      -0.004 * S,
    ];
    parts.push(
      roundCone(trapStart, trapEnd, neckHalfWidth * 0.75, p.shoulderRadius * S * 0.8, 0.03 * S),
    );
    parts.push(...armParts(p, S, side), ...legParts(p, S, side));
    if (p.bust > 0) {
      parts.push(
        ellipsoid(
          [side * 0.044 * S, p.chestY * S, (p.chestDepth / 2 - 0.012) * S],
          [0.036 * S, 0.034 * S, 0.016 * S * p.bust],
          0.025 * S,
        ),
      );
    }
  }
  return parts;
}

export function createBodySdf(model: BodyModel): Sdf {
  const parts = bodyParts(BODY_PROPORTIONS[model]);

  return (x, y, z) => {
    let result = Infinity;
    for (const part of parts) {
      const dx = x - part.center[0];
      const dy = y - part.center[1];
      const dz = z - part.center[2];
      const lowerBound = Math.sqrt(dx * dx + dy * dy + dz * dz) - part.radius;
      if (lowerBound - part.blend >= result) continue;
      const distance = part.distance(x, y, z);
      result = result === Infinity ? distance : smoothMin(result, distance, part.blend);
    }
    return result;
  };
}

export type { Sdf };
