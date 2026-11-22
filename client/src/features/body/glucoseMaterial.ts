import { BackSide, Color, FrontSide, MathUtils, MeshPhysicalMaterial } from 'three';
import {
  fragmentColour,
  fragmentDeclarations,
  fragmentGlow,
  vertexDeclarations,
  vertexWorldPosition,
} from './glucoseShaderChunks';

export interface GlucoseUniforms {
  [uniform: string]: { value: unknown };
  uLevelY: { value: number };
  uColor: { value: Color };
  uTime: { value: number };
  uReduceMotion: { value: number };
  uOpacity: { value: number };
  uRingLow: { value: number };
  uRingHigh: { value: number };
}

export function createGlucoseUniforms(color: string, reducedMotion: boolean): GlucoseUniforms {
  return {
    uLevelY: { value: -1 },
    uColor: { value: new Color(color) },
    uTime: { value: 0 },
    uReduceMotion: { value: reducedMotion ? 1 : 0 },
    uOpacity: { value: 1 },
    uRingLow: { value: 0 },
    uRingHigh: { value: 0 },
  };
}

function createGlucoseMaterial(
  uniforms: GlucoseUniforms,
  side: typeof BackSide | typeof FrontSide,
) {
  const material = new MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.28,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
    envMapIntensity: 1,
    transparent: true,
    depthWrite: side === FrontSide,
    side,
  });
  const backFace = { value: side === BackSide ? 1 : 0 };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, { uBackFace: backFace });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', vertexDeclarations)
      .replace('#include <begin_vertex>', vertexWorldPosition);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', fragmentDeclarations)
      .replace('#include <color_fragment>', fragmentColour)
      .replace('#include <emissivemap_fragment>', fragmentGlow);
  };
  material.customProgramCacheKey = () => `glucose-${side}`;
  return material;
}

// The body is drawn in two passes that share the uniforms: the inside back wall first, then the front,
// so the liquid shows depth without any triangle-sorting artefacts.
export function createGlucoseMaterials(uniforms: GlucoseUniforms): {
  back: MeshPhysicalMaterial;
  front: MeshPhysicalMaterial;
} {
  return {
    back: createGlucoseMaterial(uniforms, BackSide),
    front: createGlucoseMaterial(uniforms, FrontSide),
  };
}

const BELOW_FEET = -0.03;
const ABOVE_HEAD = 0.03;
const FADE_LAMBDA = 9;
const EASE_LAMBDA = 4.5;
const scratch = new Color();

/** World height of the liquid surface for a fill fraction on a body of this stature. */
export function levelHeight(fill: number, stature: number): number {
  if (fill === 0) return BELOW_FEET;
  return fill * stature + (fill === 1 ? ABOVE_HEAD : 0);
}

export function setReducedMotion(uniforms: GlucoseUniforms, reducedMotion: boolean): void {
  uniforms.uReduceMotion.value = reducedMotion ? 1 : 0;
}

export function setRings(uniforms: GlucoseUniforms, low: number, high: number): void {
  uniforms.uRingLow.value = low;
  uniforms.uRingHigh.value = high;
}

/** Jumps straight to a level and colour, for people who asked for less motion. */
export function snapGlucose(uniforms: GlucoseUniforms, level: number, color: string): void {
  uniforms.uLevelY.value = level;
  uniforms.uColor.value.set(color);
  uniforms.uOpacity.value = 1;
}

/** Eases the level and colour towards their targets; call once per frame. */
export function easeGlucose(
  uniforms: GlucoseUniforms,
  level: number,
  color: string,
  delta: number,
  time: number,
): void {
  uniforms.uTime.value = time;
  uniforms.uLevelY.value = MathUtils.damp(uniforms.uLevelY.value, level, EASE_LAMBDA, delta);
  scratch.set(color);
  const current = uniforms.uColor.value;
  current.r = MathUtils.damp(current.r, scratch.r, EASE_LAMBDA, delta);
  current.g = MathUtils.damp(current.g, scratch.g, EASE_LAMBDA, delta);
  current.b = MathUtils.damp(current.b, scratch.b, EASE_LAMBDA, delta);
}

/** Eases the figure's opacity towards 1 or 0 (used to cross-fade between models) and returns it. */
export function fadeFigure(uniforms: GlucoseUniforms, target: 0 | 1, delta: number): number {
  uniforms.uOpacity.value = MathUtils.damp(uniforms.uOpacity.value, target, FADE_LAMBDA, delta);
  return uniforms.uOpacity.value;
}
