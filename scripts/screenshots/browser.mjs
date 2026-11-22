import { chromium } from 'playwright';

// Software WebGL, so the 3D figure draws without a graphics card.
const ARGS = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--hide-scrollbars',
];

async function hasWebGL(browser) {
  const page = await browser.newPage();
  try {
    return await page.evaluate(() => {
      const canvas = globalThis.document.createElement('canvas');
      return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
    });
  } finally {
    await page.close();
  }
}

/** Headless Chromium if it can draw WebGL, otherwise a visible window; a clear error if neither can. */
export async function launchBrowser() {
  for (const headless of [true, false]) {
    const browser = await chromium.launch({ headless, args: ARGS });
    if (await hasWebGL(browser)) {
      console.log(`Chromium started ${headless ? 'headless' : 'with a window'}; WebGL works.`);
      return browser;
    }
    console.log(`WebGL is not available ${headless ? 'headless' : 'with a window'}.`);
    await browser.close();
  }
  throw new Error(
    'Chromium cannot create a WebGL context here, so the 3D figure cannot be captured.',
  );
}

export const DESKTOP = { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 };
export const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
};
