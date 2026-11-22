// The neck, the shoulders and the armpits: where extra smoothing is applied. Everything is given as heights
// and distances from the middle, as fractions of the stature.
const HALF_WIDTH = { full: 0.125, none: 0.155 } as const;
const BOTTOM = { none: 0.655, full: 0.685 } as const;
const TOP = { full: 0.845, none: 0.865 } as const;

function smoothstep(from: number, to: number, value: number): number {
  const t = Math.min(Math.max((value - from) / (to - from), 0), 1);
  return t * t * (3 - 2 * t);
}

/** 1 inside the neck and shoulder region and 0 well outside it, fading smoothly in between. */
export function shoulderWeight(x: number, y: number): number {
  const across = 1 - smoothstep(HALF_WIDTH.full, HALF_WIDTH.none, Math.abs(x));
  const above = smoothstep(BOTTOM.none, BOTTOM.full, y);
  const below = 1 - smoothstep(TOP.full, TOP.none, y);
  return across * above * below;
}

export function shoulderWeights(positions: Float32Array): Float32Array {
  const weights = new Float32Array(positions.length / 3);
  for (let vertex = 0; vertex < weights.length; vertex++) {
    weights[vertex] = shoulderWeight(positions[vertex * 3]!, positions[vertex * 3 + 1]!);
  }
  return weights;
}
