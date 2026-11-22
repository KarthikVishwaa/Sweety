import { useEffect, useState } from 'react';
import { CanvasTexture } from 'three';

const TEXTURE_SIZE = 128;

function createShadowTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const context = canvas.getContext('2d');
  if (context) {
    const half = TEXTURE_SIZE / 2;
    const gradient = context.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.38)');
    gradient.addColorStop(0.55, 'rgba(15, 23, 42, 0.14)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  }
  return new CanvasTexture(canvas);
}

export function GroundShadow() {
  const [texture] = useState(createShadowTexture);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} scale={[0.8, 0.42, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
