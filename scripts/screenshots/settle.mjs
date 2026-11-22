import sharp from 'sharp';

const ANIMATION_MS = 2500;
const QUIET_TIMEOUT_MS = 20000;
/** Below this the canvas is one flat colour: nothing was drawn. */
const MIN_CANVAS_VARIATION = 1;

// Nothing that comes and goes may be on screen: a loading skeleton, a toast or the Vite error overlay.
async function assertQuiet(page, name) {
  if ((await page.locator('vite-error-overlay').count()) > 0) {
    throw new Error(`${name}: the Vite error overlay is showing.`);
  }
  try {
    await page.waitForFunction(
      () => !globalThis.document.querySelector('[data-sonner-toast], [aria-busy="true"]'),
      undefined,
      { timeout: QUIET_TIMEOUT_MS },
    );
  } catch (error) {
    throw new Error(`${name}: a toast or a loading skeleton is still showing.`, { cause: error });
  }
}

/** Waits for the network, then for mascots, the figure fill and the charts to finish moving. */
export async function settle(page, name, { extra = 0 } = {}) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(ANIMATION_MS + extra);
  await assertQuiet(page, name);
  await page.waitForTimeout(400);
}

/** Fails when the figure is missing or its canvas is one flat colour. */
export async function assertFigureDrawn(page, name) {
  const canvas = page.locator('canvas').first();
  if ((await canvas.count()) === 0) {
    throw new Error(`${name}: there is no 3D canvas (the flat fallback is showing).`);
  }
  const { channels } = await sharp(await canvas.screenshot()).stats();
  const variation = channels.slice(0, 3).reduce((sum, channel) => sum + channel.stdev, 0) / 3;
  if (variation < MIN_CANVAS_VARIATION) {
    throw new Error(`${name}: the 3D canvas is blank (variation ${variation.toFixed(2)}).`);
  }
}

/** Scrolls an element to the top of the window, a little below the edge. */
export async function scrollToTop(locator, margin = 24) {
  await locator.evaluate((element, offset) => {
    element.scrollIntoView({ block: 'start' });
    globalThis.scrollBy(0, -offset);
  }, margin);
}
