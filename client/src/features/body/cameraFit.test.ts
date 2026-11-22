import { describe, expect, it } from 'vitest';
import { CAMERA_FOV, FRAME_HALF_WIDTH, FRAME_HEIGHT } from './bodyScene.constants';
import { fitDistance } from './cameraFit';

function visible(distance: number, width: number, height: number) {
  const halfHeight = distance * Math.tan((CAMERA_FOV * Math.PI) / 360);
  return { halfHeight, halfWidth: (halfHeight * width) / height };
}

describe('fitDistance', () => {
  it.each([
    [280, 560],
    [320, 280],
    [900, 560],
    [200, 800],
    [1200, 200],
  ])('shows the whole body in a %i by %i container', (width, height) => {
    const { halfHeight, halfWidth } = visible(fitDistance(width, height), width, height);
    expect(halfHeight).toBeGreaterThanOrEqual(FRAME_HEIGHT / 2);
    expect(halfWidth).toBeGreaterThanOrEqual(FRAME_HALF_WIDTH);
  });

  it('survives an empty container', () => {
    expect(Number.isFinite(fitDistance(0, 0))).toBe(true);
  });
});
