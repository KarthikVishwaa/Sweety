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

export async function extractFrame(video, frameIndex, outputPng) {
  await ffmpeg(['-i', video, '-vf', `select=eq(n\\,${frameIndex})`, '-frames:v', '1', outputPng]);
}

export async function ssim(first, second) {
  const { stderr } = await execFileAsync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'info',
      '-i',
      first,
      '-i',
      second,
      '-lavfi',
      'ssim',
      '-f',
      'null',
      '-',
    ],
    { maxBuffer: MAX_BUFFER },
  );
  const match = /All:([0-9.]+)/.exec(stderr);
  if (!match) throw new Error('Could not read the SSIM result from ffmpeg.');
  return Number(match[1]);
}
