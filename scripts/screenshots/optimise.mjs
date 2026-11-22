import { readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const MAX_BYTES = 500 * 1024;
// Fewer colours until the file is small enough; the dimensions never change.
const PALETTES = [256, 192, 128, 96, 64];

async function quantise(buffer) {
  let best;
  for (const colours of PALETTES) {
    best = await sharp(buffer)
      .png({ palette: true, colours, quality: 85, effort: 10, dither: 0.6 })
      .toBuffer();
    if (best.length <= MAX_BYTES) break;
  }
  return best;
}

/** Writes a palette-quantised copy of every PNG in `from` to `to` and returns their sizes. */
export async function optimiseAll(from, to) {
  await mkdir(to, { recursive: true });
  const rows = [];
  for (const file of (await readdir(from)).filter((name) => name.endsWith('.png')).sort()) {
    const raw = path.join(from, file);
    const original = (await stat(raw)).size;
    const buffer = await quantise(raw);
    const { width, height } = await sharp(buffer).metadata();
    await writeFile(path.join(to, file), buffer);
    rows.push({
      file,
      size: `${width}x${height}`,
      'before KB': Math.round(original / 1024),
      'after KB': Math.round(buffer.length / 1024),
    });
  }
  return rows;
}
