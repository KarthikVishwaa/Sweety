import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ffmpeg, grayPixels, probeImage } from './ffmpeg.mjs';

const BACKGROUND_THRESHOLD = 235;
// Snap near-white to white so the multiply-blended logo leaves no faint box on a white page.
const WHITE_POINT =
  "lutrgb=r='if(gte(val,244),255,val)':g='if(gte(val,244),255,val)':b='if(gte(val,244),255,val)'";
const PADDING_RATIO = 0.08;
const LOGO_WIDTHS = [
  { file: 'logo.webp', width: 240 },
  { file: 'logo@2x.webp', width: 480 },
];

// The droplet with the heart that replaces the second "e" in the wordmark, in source pixels. The gap
// between its neighbouring letters is narrower than the droplet is tall, so it is cropped exactly and
// padded to a square instead of cropping a square.
const MARK = { x: 940, y: 291, width: 230, height: 252 };
const FAVICONS = [
  { file: 'favicon-32.png', size: 32 },
  { file: 'favicon-192.png', size: 192 },
  { file: 'apple-touch-icon.png', size: 180 },
];

function findContentBounds(pixels, width, height) {
  let left = width;
  let right = 0;
  let top = height;
  let bottom = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[y * width + x] < BACKGROUND_THRESHOLD) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  return { left, right, top, bottom };
}

function paddedCrop(bounds, width, height) {
  const padding = Math.round((bounds.bottom - bounds.top + 1) * PADDING_RATIO);
  const x = Math.max(0, bounds.left - padding);
  const y = Math.max(0, bounds.top - padding);
  return {
    x,
    y,
    width: Math.min(width, bounds.right + padding + 1) - x,
    height: Math.min(height, bounds.bottom + padding + 1) - y,
  };
}

export async function optimizeLogo({ sourceFile, assetsDir, publicDir }) {
  await mkdir(assetsDir, { recursive: true });
  await mkdir(publicDir, { recursive: true });

  const { width, height } = await probeImage(sourceFile);
  const crop = paddedCrop(
    findContentBounds(await grayPixels(sourceFile), width, height),
    width,
    height,
  );
  const cropFilter = `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`;
  const report = [
    { file: 'logo.png (source)', 'size KB': Math.round((await stat(sourceFile)).size / 1024) },
  ];

  for (const { file, width: outputWidth } of LOGO_WIDTHS) {
    const output = path.join(assetsDir, file);
    await ffmpeg([
      ...['-i', sourceFile],
      ...['-vf', `${cropFilter},scale=${outputWidth}:-1:flags=lanczos,${WHITE_POINT}`],
      ...['-c:v', 'libwebp', '-quality', '92', '-compression_level', '6', output],
    ]);
    report.push({ file, 'size KB': Math.round((await stat(output)).size / 1024) });
  }

  for (const { file, size } of FAVICONS) {
    const output = path.join(publicDir, file);
    await ffmpeg([
      ...['-i', sourceFile],
      ...[
        '-vf',
        `crop=${MARK.width}:${MARK.height}:${MARK.x}:${MARK.y},` +
          `pad=${MARK.height}:${MARK.height}:${(MARK.height - MARK.width) / 2}:0:white,` +
          `scale=${size}:${size}:flags=lanczos,${WHITE_POINT}`,
      ],
      ...['-frames:v', '1', output],
    ]);
    report.push({ file, 'size KB': Math.round((await stat(output)).size / 1024) });
  }

  const [{ width: logoWidth }] = LOGO_WIDTHS;
  const logoHeight = Math.round((crop.height / crop.width) * logoWidth);
  await writeFile(
    path.join(assetsDir, 'logo.json'),
    `${JSON.stringify({ width: logoWidth, height: logoHeight }, null, 2)}\n`,
  );
  return report;
}
