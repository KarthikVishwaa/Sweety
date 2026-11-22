import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { BodyFigure } from './BodyFigure';
import type { Gender } from './bodyProportions';
import { CAMERA_FOV } from './bodyScene.constants';
import { CameraRig } from './CameraRig';
import { GroundShadow } from './GroundShadow';
import { StudioEnvironment } from './StudioEnvironment';
import { useDragRotation } from './useDragRotation';
import { useIsActive } from '@/hooks/useIsActive';

interface BodyGlucoseSceneProps {
  model: Gender;
  value: number | null;
  reducedMotion: boolean;
  onContextLost: () => void;
  onContextRestored: () => void;
}

const MAX_DPR = 2;

export default function BodyGlucoseScene({
  model,
  value,
  reducedMotion,
  onContextLost,
  onContextRestored,
}: BodyGlucoseSceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const active = useIsActive(container);
  const { drag, handlers } = useDragRotation();

  return (
    <div
      ref={container}
      className="h-full w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
      {...handlers}
    >
      <Canvas
        frameloop={active && !reducedMotion ? 'always' : 'demand'}
        dpr={[1, MAX_DPR]}
        camera={{ fov: CAMERA_FOV, near: 0.1, far: 20 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = ACESFilmicToneMapping;
          gl.outputColorSpace = SRGBColorSpace;
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            onContextLost();
          });
          gl.domElement.addEventListener('webglcontextrestored', onContextRestored);
        }}
      >
        <StudioEnvironment />
        <CameraRig />
        <GroundShadow />
        <BodyFigure model={model} value={value} reducedMotion={reducedMotion} drag={drag} />
      </Canvas>
    </div>
  );
}
