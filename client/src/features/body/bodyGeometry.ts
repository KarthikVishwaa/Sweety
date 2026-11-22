import type { BufferGeometry } from 'three';
import femaleUrl from '@/assets/models/female.glb?url';
import maleUrl from '@/assets/models/male.glb?url';
import otherUrl from '@/assets/models/other.glb?url';
import { parseBodyGlb } from './bodyGlb';
import type { Gender } from './bodyProportions';

const MODEL_URLS: Record<Gender, string> = { male: maleUrl, female: femaleUrl, other: otherUrl };

const geometries = new Map<Gender, Promise<BufferGeometry>>();

async function load(gender: Gender): Promise<BufferGeometry> {
  const response = await fetch(MODEL_URLS[gender]);
  if (!response.ok) throw new Error(`Could not load the ${gender} figure (${response.status}).`);
  return parseBodyGlb(await response.arrayBuffer());
}

/**
 * The figure for a gender at unit height, loaded once and kept for the life of the page. The figures
 * are baked by `npm run models:generate`; a hand-made GLB with the same name would load the same way.
 */
export function getBodyGeometry(gender: Gender): Promise<BufferGeometry> {
  let geometry = geometries.get(gender);
  if (!geometry) {
    geometry = load(gender);
    geometry.catch(() => geometries.delete(gender));
    geometries.set(gender, geometry);
  }
  return geometry;
}
