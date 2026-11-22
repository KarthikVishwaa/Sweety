import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseBodyGlb } from './bodyGlb';
import { BODY_PROPORTIONS, GENDERS } from './bodyProportions';
import { bodyMeshProblems, measureBodyMesh } from './generator/meshValidation';

const MAX_FILE_BYTES = 700 * 1024;

function readModel(gender: string): ArrayBuffer {
  // Tests run from the client package root.
  const file = readFileSync(resolve('src/assets/models', `${gender}.glb`));
  // Copied into this realm's ArrayBuffer: the loader checks `instanceof ArrayBuffer`.
  return Uint8Array.from(file).buffer;
}

// The committed figures must stay watertight, single, upright and in proportion: a broken bake fails CI.
describe.each(GENDERS)('the committed %s figure', (gender) => {
  it('is small enough to ship', () => {
    expect(readModel(gender).byteLength).toBeLessThan(MAX_FILE_BYTES);
  });

  it('decodes to a valid, watertight, well-proportioned mesh', async () => {
    const geometry = await parseBodyGlb(readModel(gender));
    const positions = geometry.getAttribute('position').array;
    const indices = geometry.getIndex()!.array;
    const report = measureBodyMesh(positions, indices, BODY_PROPORTIONS[gender]);

    expect(bodyMeshProblems(report, BODY_PROPORTIONS[gender])).toEqual([]);
    expect(report.triangles).toBeGreaterThan(80_000);
    expect(report.triangles).toBeLessThan(120_000);
    expect(geometry.getAttribute('normal').count).toBe(geometry.getAttribute('position').count);
  });
});
