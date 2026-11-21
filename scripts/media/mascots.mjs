import { copyFile, mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { decodeGrayFrames, ffmpeg, probeVideo } from './ffmpeg.mjs';
import { assessLoop, findBestLoop, meanSquaredError } from './loops.mjs';

// The source files are numbered. `seam` says how the end of each clip joins its start:
// - trim: a pair of frames in the clip forms a seamless seam, so the clip is cut to that pair.
// - interpolate: no pair is good enough, so motion-compensated frames bridge the gap. Only used where the
//   result was inspected and has no ghosting (the pose barely changes across the seam).
// - once: the clip has no repeating motion (and interpolating it smears the arms), so it plays once and
//   rests on its last frame instead of looping.
export const CLIPS = [
  { name: 'floating', source: '1.mp4', seam: 'trim' },
  { name: 'waving', source: '2.mp4', seam: 'interpolate' },
  { name: 'bouncing', source: '3.mp4', seam: 'trim' },
  { name: 'love', source: '4.mp4', seam: 'once' },
];

// A band of the 1080x1920 source that contains every pixel of every clip, with a margin.
const CROP = 'crop=1080:1280:0:270';
const OUTPUT_HEIGHT = 720;
const ANALYSIS = { width: 152, height: 180 };
const LOOP_SEARCH = { minSeconds: 2, searchFraction: 0.4 };
const INTERPOLATION_STEPS = 8;
const STRIP_FRAMES = 4;

// Compression noise leaves the "white" background a few levels short of white. `multiply` blending can only
// darken, so that shows up as a faint box on a white page. Snap near-white luma (limited range) to white.
const WHITE_POINT = "lutyuv=y='if(gte(val,226),235,if(gt(val,215),215+(val-215)*20/11,val))'";
const COLOR_TAGS = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'];

const baseFilter = `${CROP},scale=-2:${OUTPUT_HEIGHT}:flags=lanczos:out_color_matrix=bt709,setsar=1,${WHITE_POINT}`;
const analysisFilter = `${CROP},scale=${ANALYSIS.width}:${ANALYSIS.height}:flags=area`;
const outputAnalysisFilter = `scale=${ANALYSIS.width}:${ANALYSIS.height}:flags=area`;

function trimFilter({ start, end }) {
  return `[0:v]trim=start_frame=${start}:end_frame=${end + 1},setpts=PTS-STARTPTS,${baseFilter}[v]`;
}

function encodeArgs(inputArgs, filter) {
  const input = [...inputArgs, '-filter_complex', filter, '-map', '[v]', '-an'];
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

async function writeSeamStrip(video, frames, output) {
  const tile = `scale=200:-1,tile=${STRIP_FRAMES}x1`;
  await ffmpeg([
    ...['-i', video],
    ...[
      '-filter_complex',
      `[0:v]split[late][early];` +
        `[late]select='gte(n,${frames - STRIP_FRAMES})',${tile}[end];` +
        `[early]select='lt(n,${STRIP_FRAMES})',${tile}[start];[end][start]hstack`,
    ],
    ...['-frames:v', '1', output],
  ]);
}

async function encode(inputArgs, filter, outputs) {
  const args = encodeArgs(inputArgs, filter);
  for (const format of Object.keys(outputs)) await ffmpeg([...args[format], outputs[format]]);
}

const pad = (number, digits) => String(number).padStart(digits, '0');

// Writes the frames of the loop, followed by in-between frames that carry the last frame over to the first.
async function buildInterpolatedSequence({ sourcePath, loop, fps }, directory) {
  const count = loop.end - loop.start + 1;
  await ffmpeg([
    ...['-i', sourcePath],
    ...['-vf', `select='between(n,${loop.start},${loop.end})',${baseFilter}`],
    ...['-fps_mode', 'passthrough', path.join(directory, 'frame-%04d.png')],
  ]);

  const context = path.join(directory, 'context');
  await mkdir(context);
  const neighbours = [count - 1, count, 1, 2];
  for (const [index, frame] of neighbours.entries()) {
    await copyFile(
      path.join(directory, `frame-${pad(frame, 4)}.png`),
      path.join(context, `c${index + 1}.png`),
    );
  }
  await ffmpeg([
    ...['-framerate', String(fps), '-i', path.join(context, 'c%d.png')],
    ...[
      '-vf',
      `minterpolate=fps=${fps * INTERPOLATION_STEPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`,
    ],
    path.join(context, 'o-%02d.png'),
  ]);

  // Find which interpolated frames sit between the last frame of the loop (c2) and the first (c3).
  const small = { width: ANALYSIS.width, height: ANALYSIS.height };
  const scale = `scale=${small.width}:${small.height}:flags=area`;
  const interpolated = await decodeGrayFrames(path.join(context, 'o-%02d.png'), scale, small);
  const [last] = await decodeGrayFrames(path.join(context, 'c2.png'), scale, small);
  const [first] = await decodeGrayFrames(path.join(context, 'c3.png'), scale, small);
  const closest = (target) =>
    interpolated.reduce(
      (best, frame, index) => {
        const error = meanSquaredError(frame, target);
        return error < best.error ? { index, error } : best;
      },
      { index: 0, error: Infinity },
    ).index;
  const between = [];
  for (let index = closest(last) + 1; index < closest(first); index++) between.push(index + 1);

  for (const [offset, frame] of between.entries()) {
    await copyFile(
      path.join(context, `o-${pad(frame, 2)}.png`),
      path.join(directory, `frame-${pad(count + offset + 1, 4)}.png`),
    );
  }
  return count + between.length;
}

async function analyseOutput(video) {
  return decodeGrayFrames(video, outputAnalysisFilter, ANALYSIS);
}

export async function optimizeMascots({ sourceDir, outputDir, checkDir }) {
  await mkdir(outputDir, { recursive: true });
  await mkdir(checkDir, { recursive: true });
  const tempDir = await mkdtemp(path.join(tmpdir(), 'sweety-loops-'));
  const report = [];
  const manifest = { clips: {} };

  try {
    for (const { name, source, seam } of CLIPS) {
      const sourcePath = path.join(sourceDir, source);
      const info = await probeVideo(sourcePath);
      const outputs = {
        mp4: path.join(outputDir, `${name}.mp4`),
        webm: path.join(outputDir, `${name}.webm`),
        webp: path.join(outputDir, `${name}.webp`),
      };

      let loop = { start: 0, end: info.frames - 1 };
      if (seam !== 'once') {
        const frames = await decodeGrayFrames(sourcePath, analysisFilter, ANALYSIS);
        loop = findBestLoop(frames, { fps: info.fps, ...LOOP_SEARCH });
      }

      if (seam === 'interpolate') {
        const directory = await mkdtemp(path.join(tempDir, `${name}-`));
        await buildInterpolatedSequence({ sourcePath, loop, fps: info.fps }, directory);
        const frameCount = (await readdir(directory)).filter((file) =>
          file.startsWith('frame-'),
        ).length;
        await encode(
          ['-framerate', String(info.fps), '-i', path.join(directory, 'frame-%04d.png')],
          `[0:v]trim=end_frame=${frameCount},format=yuv420p[v]`,
          outputs,
        );
      } else {
        await encode(['-i', sourcePath], trimFilter(loop), outputs);
      }

      const output = await probeVideo(outputs.mp4);
      const assessment = assessLoop(await analyseOutput(outputs.mp4));
      await writeSeamStrip(outputs.mp4, output.frames, path.join(checkDir, `${name}.png`));
      const bytes = {
        mp4: await size(outputs.mp4),
        webm: await size(outputs.webm),
        poster: await size(outputs.webp),
      };

      manifest.width = output.width;
      manifest.height = output.height;
      manifest.fps = output.fps;
      manifest.clips[name] = { seam, loop: seam !== 'once', frames: output.frames, bytes };
      report.push({
        clip: name,
        seam,
        'source frames': seam === 'once' ? 'all' : `${loop.start}-${loop.end}`,
        'output frames': output.frames,
        'last>first diff': assessment.lastToFirst.toFixed(2),
        'typical step diff': assessment.typicalStep.toFixed(2),
        'seamless loop': seam === 'once' ? 'n/a (plays once)' : assessment.accepted ? 'yes' : 'NO',
        'mp4 KB': Math.round(bytes.mp4 / 1024),
        'webm KB': Math.round(bytes.webm / 1024),
        'poster KB': Math.round(bytes.poster / 1024),
      });
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return report;
}
