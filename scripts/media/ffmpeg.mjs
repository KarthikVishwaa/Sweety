import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const MAX_BUFFER = 1024 * 1024 * 600;

export async function assertFfmpeg() {
  try {
    await execFileAsync('ffmpeg', ['-version']);
    await execFileAsync('ffprobe', ['-version']);
  } catch {
    throw new Error(
      'ffmpeg and ffprobe are required but were not found on your PATH. ' +
        'Install ffmpeg from https://ffmpeg.org/download.html and run the command again.',
    );
  }
}

export async function ffmpeg(args) {
  await execFileAsync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    maxBuffer: MAX_BUFFER,
  });
}

export async function probeVideo(file) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'stream=width,height,r_frame_rate,nb_frames',
    '-of',
    'json',
    file,
  ]);
  const stream = JSON.parse(stdout).streams[0];
  const [numerator, denominator] = stream.r_frame_rate.split('/').map(Number);

  return {
    width: stream.width,
    height: stream.height,
    fps: numerator / denominator,
    frames: Number(stream.nb_frames),
  };
}

// Decodes every frame as 8-bit grayscale at the size the filter produces, one Buffer per frame.
export async function decodeGrayFrames(file, filter, { width, height }) {
  const { stdout } = await execFileAsync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-an', '-vf', `${filter},format=gray`, '-f', 'rawvideo', '-'],
    { encoding: 'buffer', maxBuffer: MAX_BUFFER },
  );
  const frameSize = width * height;
  const frames = [];
  for (let offset = 0; offset + frameSize <= stdout.length; offset += frameSize) {
    frames.push(stdout.subarray(offset, offset + frameSize));
  }
  return frames;
}

export async function grayPixels(file) {
  const { stdout } = await execFileAsync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-frames:v', '1', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'],
    { encoding: 'buffer', maxBuffer: MAX_BUFFER },
  );
  return stdout;
}

export async function probeImage(file) {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'stream=width,height',
    '-of',
    'json',
    file,
  ]);
  const { width, height } = JSON.parse(stdout).streams[0];
  return { width, height };
}
