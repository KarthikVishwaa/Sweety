import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { PMREMGenerator, type Scene, type Texture } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const BLUR = 0.04;

function setEnvironment(scene: Scene, texture: Texture | null): void {
  scene.environment = texture;
}

// Soft studio light for the glass: an image-based light from three's neutral room, prefiltered once.
export function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = generator.fromScene(room, BLUR).texture;
    setEnvironment(scene, environment);
    invalidate();
    return () => {
      setEnvironment(scene, null);
      environment.dispose();
      room.dispose();
      generator.dispose();
    };
  }, [gl, scene, invalidate]);

  return null;
}
