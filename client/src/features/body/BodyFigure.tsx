import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { MathUtils, type BufferGeometry, type Group } from 'three';
import { getBodyGeometry } from './bodyGeometry';
import { BODY_PROPORTIONS, type BodyModel } from './bodyProportions';
import { SWAY_RADIANS } from './bodyScene.constants';
import { RING_FILLS, glucoseBandColor, glucoseToFill } from './glucoseLevel';
import {
  createGlucoseMaterials,
  createGlucoseUniforms,
  easeGlucose,
  fadeFigure,
  levelHeight,
  setReducedMotion,
  setRings,
  snapGlucose,
} from './glucoseMaterial';
import type { DragState } from './useDragRotation';

interface BodyFigureProps {
  model: BodyModel;
  value: number | null;
  reducedMotion: boolean;
  drag: RefObject<DragState>;
}

interface Shown {
  model: BodyModel;
  geometry: BufferGeometry;
}

const SWAY_RADIANS_PER_SECOND = 0.6;
const DRAG_LAMBDA = 8;
const SWAPPED_BELOW_OPACITY = 0.04;

export function BodyFigure({ model, value, reducedMotion, drag }: BodyFigureProps) {
  const invalidate = useThree((state) => state.invalidate);
  const group = useRef<Group>(null);
  const [shown, setShown] = useState<Shown>();
  const pending = useRef<Shown>(undefined);
  const hasShown = useRef(false);
  const sway = useRef({ weight: 1, drag: 0 });
  const uniforms = useMemo(
    () => createGlucoseUniforms(glucoseBandColor(value), reducedMotion),
    // The uniforms are created once; later values are eased towards inside useFrame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const materials = useMemo(() => createGlucoseMaterials(uniforms), [uniforms]);

  useEffect(() => {
    let cancelled = false;
    void getBodyGeometry(model).then((geometry) => {
      if (cancelled) return;
      if (hasShown.current) {
        pending.current = { model, geometry };
      } else {
        hasShown.current = true;
        setShown({ model, geometry });
      }
      invalidate();
    });
    return () => {
      cancelled = true;
    };
  }, [model, invalidate]);

  useEffect(() => {
    setReducedMotion(uniforms, reducedMotion);
  }, [reducedMotion, uniforms]);

  // With reduced motion nothing is eased: a new value is applied at once and one frame is drawn.
  useEffect(() => {
    if (!reducedMotion) return;
    const stature = BODY_PROPORTIONS[shown?.model ?? model].stature;
    snapGlucose(uniforms, levelHeight(glucoseToFill(value), stature), glucoseBandColor(value));
    setRings(uniforms, RING_FILLS.low * stature, RING_FILLS.high * stature);
    invalidate();
  }, [value, reducedMotion, shown, model, uniforms, invalidate]);

  useEffect(
    () => () => {
      materials.back.dispose();
      materials.front.dispose();
    },
    [materials],
  );

  useFrame((state, delta) => {
    const stature = BODY_PROPORTIONS[shown?.model ?? model].stature;
    setRings(uniforms, RING_FILLS.low * stature, RING_FILLS.high * stature);

    // The old figure fades out, the new one is swapped in, then it fades in.
    if (pending.current && reducedMotion) {
      setShown(pending.current);
      pending.current = undefined;
    }
    if (!reducedMotion) {
      const opacity = fadeFigure(uniforms, pending.current ? 0 : 1, delta);
      if (pending.current && opacity < SWAPPED_BELOW_OPACITY) {
        setShown(pending.current);
        pending.current = undefined;
      }
      easeGlucose(
        uniforms,
        levelHeight(glucoseToFill(value), stature),
        glucoseBandColor(value),
        delta,
        state.clock.elapsedTime,
      );
    }

    if (reducedMotion) return;

    sway.current.weight = MathUtils.damp(
      sway.current.weight,
      drag.current.active ? 0 : 1,
      DRAG_LAMBDA,
      delta,
    );
    sway.current.drag = MathUtils.damp(sway.current.drag, drag.current.target, DRAG_LAMBDA, delta);
    if (group.current) {
      group.current.rotation.y =
        Math.sin(state.clock.elapsedTime * SWAY_RADIANS_PER_SECOND) *
          SWAY_RADIANS *
          sway.current.weight +
        sway.current.drag;
    }
  });

  if (!shown) return null;

  return (
    <group ref={group}>
      <mesh geometry={shown.geometry} material={materials.back} renderOrder={1} />
      <mesh geometry={shown.geometry} material={materials.front} renderOrder={2} />
    </group>
  );
}
