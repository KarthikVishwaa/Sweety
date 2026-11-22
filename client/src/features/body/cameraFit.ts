import { CAMERA_FOV, FRAME_HALF_WIDTH, FRAME_HEIGHT, FRAME_MARGIN } from './bodyScene.constants';

/** Camera distance at which the whole body fits a container of this width and height. */
export function fitDistance(width: number, height: number): number {
  const tan = Math.tan((CAMERA_FOV * Math.PI) / 360);
  const aspect = Math.max(width, 1) / Math.max(height, 1);
  const forHeight = (FRAME_HEIGHT * FRAME_MARGIN) / 2 / tan;
  const forWidth = (FRAME_HALF_WIDTH * FRAME_MARGIN) / (tan * aspect);
  return Math.max(forHeight, forWidth);
}
