import { fileURLToPath } from 'node:url';
import { assertFfmpeg } from './media/ffmpeg.mjs';
import { optimizeMascots } from './media/mascots.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceDir = `${root}design-source`;

try {
  await assertFfmpeg();
  console.log('Optimising mascot videos...');
  console.table(await optimizeMascots({ sourceDir, outputDir: `${root}client/src/assets/mascot` }));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
