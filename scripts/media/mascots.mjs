import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { extractFrame, ffmpeg, probeVideo, ssim } from './ffmpeg.mjs';

// The source files are numbered. `loop` is 'crossfade' when the last frame does not flow into the
// first one (checked with SSIM, see the report this script prints) and 'native' when it already does.
export const CLIPS = [
  { name: 'floating', source: '1.mp4', loop: 'crossfade' },
  { name: 'waving', source: '2.mp4', loop: 'crossfade' },
  { name: 'bouncing', source: '3.mp4', loop: 'native' },
  { name: 'love', source: '4.mp4', loop: 'crossfade' },
];

// A band of the 1080x1920 source that contains every pixel of every clip, with a margin.
const CROP = { width: 1080, height: 1280, x: 0, y: 270 };
const OUTPUT_HEIGHT = 720;
const CROSSFADE_FRAMES = 10;
const COLOR_TAGS = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'];

function buildFilter({ loop, frames, fps }) {
  const base =
    `crop=${CROP.width}:${CROP.height}:${CROP.x}:${CROP.y},` +
    `scale=-2:${OUTPUT_HEIGHT}:flags=lanczos:out_color_matrix=bt709,setsar=1`;
  if (loop === 'native') return `[0:v]${base}[v]`;

  const mainFrames = frames - CROSSFADE_FRAMES;
  const duration = (CROSSFADE_FRAMES / fps).toFixed(6);
  const offset = ((mainFrames - CROSSFADE_FRAMES) / fps).toFixed(6);
  return (
    `[0:v]${base},split[a][b];` +
    `[a]trim=start_frame=${CROSSFADE_FRAMES},setpts=PTS-STARTPTS[main];` +
    `[b]trim=end_frame=${CROSSFADE_FRAMES},setpts=PTS-STARTPTS[head];` +
    `[main][head]xfade=transition=fade:duration=${duration}:offset=${offset}[v]`
  );
}

function encodeArgs(source, filter) {
  const input = ['-i', source, '-filter_complex', filter, '-map', '[v]', '-an'];
  return {
    mp4: [
      ...input,
      ...['-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p'],
      ...COLOR_TAGS,
      ...['-movflags', '+faststart'],
    ],
    webm: [
      ...input,
      ...['-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-row-mt', '1', '-pix_fmt', 'yuv420p'],
      ...COLOR_TAGS,
    ],
    webp: [
      ...input,
      ...['-frames:v', '1', '-c:v', 'libwebp', '-quality', '90', '-compression_level', '6'],
    ],
  };
}

async function size(file) {
  return (await stat(file)).size;
}

async function loopScores(video, frames, tempDir) {
  const frame = (index) => path.join(tempDir, `${path.basename(video)}-${index}.png`);
  await Promise.all(
    [0, frames - 2, frames - 1].map((index) => extractFrame(video, index, frame(index))),
  );
  return {
    lastToFirst: await ssim(frame(frames - 1), frame(0)),
    adjacent: await ssim(frame(frames - 2), frame(frames - 1)),
  };
}

export async function optimizeMascots({ sourceDir, outputDir }) {
  await mkdir(outputDir, { recursive: true });
  const tempDir = await mkdtemp(path.join(tmpdir(), 'sweety-media-'));
  const report = [];
  const manifest = { clips: {} };

  try {
    for (const { name, source, loop } of CLIPS) {
      const sourcePath = path.join(sourceDir, source);
      const info = await probeVideo(sourcePath);
      const filter = buildFilter({ loop, frames: info.frames, fps: info.fps });
      const outputs = {
        mp4: path.join(outputDir, `${name}.mp4`),
        webm: path.join(outputDir, `${name}.webm`),
        webp: path.join(outputDir, `${name}.webp`),
      };
      const args = encodeArgs(sourcePath, filter);
      for (const format of Object.keys(outputs)) await ffmpeg([...args[format], outputs[format]]);

      const output = await probeVideo(outputs.mp4);
      const before = await loopScores(sourcePath, info.frames, tempDir);
      const after = await loopScores(outputs.mp4, output.frames, tempDir);
      const bytes = {
        mp4: await size(outputs.mp4),
        webm: await size(outputs.webm),
        poster: await size(outputs.webp),
      };

      manifest.width = output.width;
      manifest.height = output.height;
      manifest.fps = output.fps;
      manifest.clips[name] = { loop, frames: output.frames, bytes };
      report.push({
        clip: name,
        loop,
        'source KB': Math.round((await size(sourcePath)) / 1024),
        'mp4 KB': Math.round(bytes.mp4 / 1024),
        'webm KB': Math.round(bytes.webm / 1024),
        'poster KB': Math.round(bytes.poster / 1024),
        'SSIM last>first (source)': before.lastToFirst.toFixed(3),
        'SSIM last>first (output)': after.lastToFirst.toFixed(3),
        'SSIM adjacent frames (output)': after.adjacent.toFixed(3),
      });
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return report;
}
