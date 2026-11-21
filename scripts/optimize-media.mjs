import { fileURLToPath } from 'node:url';
import { assertFfmpeg } from './media/ffmpeg.mjs';
import { optimizeLogo } from './media/logo.mjs';
import { optimizeMascots } from './media/mascots.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceDir = `${root}design-source`;
const assetsDir = `${root}client/src/assets`;

const target = process.argv[2];
const targets = ['mascots', 'logo'];

try {
  if (target && !targets.includes(target)) {
    throw new Error(
      `Unknown target "${target}". Use one of: ${targets.join(', ')} (or none for all).`,
    );
  }
  await assertFfmpeg();

  if (!target || target === 'mascots') {
    console.log('Optimising mascot videos...');
    console.table(await optimizeMascots({ sourceDir, outputDir: `${assetsDir}/mascot` }));
  }
  if (!target || target === 'logo') {
    console.log('Optimising the logo and favicons...');
    console.table(
      await optimizeLogo({
        sourceFile: `${sourceDir}/logo.png`,
        assetsDir,
        publicDir: `${root}client/public`,
      }),
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
