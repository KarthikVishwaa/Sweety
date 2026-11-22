import { useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import type { PerspectiveCamera } from 'three';
import { FRAME_HEIGHT } from './bodyScene.constants';
import { fitDistance } from './cameraFit';

export function CameraRig() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    camera.position.set(0, FRAME_HEIGHT * 0.5, fitDistance(width, height));
    camera.lookAt(0, FRAME_HEIGHT * 0.5, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, width, height, invalidate]);

  return null;
}
