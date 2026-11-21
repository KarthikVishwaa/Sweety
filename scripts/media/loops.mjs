// Frame-difference helpers used to find, and to check, seamless loops. Frames are 8-bit grayscale buffers.

export function meanSquaredError(a, b) {
  let sum = 0;
  for (let index = 0; index < a.length; index++) {
    const difference = a[index] - b[index];
    sum += difference * difference;
  }
  return sum / a.length;
}

function median(values) {
  const sorted = [...values].sort((x, y) => x - y);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function typicalStepDifference(frames) {
  const steps = frames.slice(1).map((frame, index) => meanSquaredError(frames[index], frame));
  return median(steps);
}

// Picks the start frame i (early) and end frame j (late) whose seam, j followed by i, looks most like a
// normal step: frame j must resemble frame i, and so must the frames on either side of them, which
// keeps the direction of motion consistent across the seam.
export function findBestLoop(frames, { fps, minSeconds, searchFraction }) {
  const lastStart = Math.floor(frames.length * searchFraction);
  const firstEnd = Math.ceil(frames.length * (1 - searchFraction));
  const minLength = Math.ceil(minSeconds * fps);
  let best = null;

  for (let start = 1; start <= lastStart; start++) {
    for (let end = firstEnd; end <= frames.length - 2; end++) {
      if (end - start + 1 < minLength) continue;
      const score =
        meanSquaredError(frames[end], frames[start]) +
        0.5 *
          (meanSquaredError(frames[end - 1], frames[start - 1]) +
            meanSquaredError(frames[end + 1], frames[start + 1]));
      if (!best || score < best.score) best = { start, end, score };
    }
  }
  return best;
}

export function assessLoop(frames) {
  const lastToFirst = meanSquaredError(frames[frames.length - 1], frames[0]);
  const typicalStep = typicalStepDifference(frames);
  return { lastToFirst, typicalStep, accepted: lastToFirst <= typicalStep };
}
