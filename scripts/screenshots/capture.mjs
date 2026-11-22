// Captures the screenshots in docs/screenshots from the running app (see "Screenshots" in the README).
// Usage: npm run screenshots              every screenshot
//        npm run screenshots -- 05 11     only the groups that contain these numbers (or group names)
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launchBrowser, DESKTOP, MOBILE } from './browser.mjs';
import { deleteThrowawayUsers } from './cleanup.mjs';
import { demoSession, pickDates } from './demo.mjs';
import { optimiseAll } from './optimise.mjs';
import {
  chooseGender,
  continueStep,
  createAccount,
  fillAccount,
  fillBirth,
  throwawayEmail,
} from './onboarding.mjs';
import { CLIENT_URL, preflight } from './preflight.mjs';
import { assertFigureDrawn, scrollToTop, settle } from './settle.mjs';

const OUTPUT = path.resolve('docs/screenshots');
const FIGURE_FILL_MS = 1500;
const CROP_MARGIN = 80;

async function newPage(browser, options, storageState) {
  const context = await browser.newContext({ ...options, baseURL: CLIENT_URL, storageState });
  return { context, page: await context.newPage() };
}

// A page that ends well above the bottom of the window is cropped to its content instead of showing blank space.
async function clipFor(page, fitTo) {
  const { width, height } = page.viewportSize();
  if (!fitTo) return { x: 0, y: 0, width, height };
  const bottom = await page
    .locator(fitTo)
    .evaluate((element) => element.getBoundingClientRect().bottom);
  return { x: 0, y: 0, width, height: Math.min(Math.ceil(bottom) + CROP_MARGIN, height) };
}

// The report's numbers, and its chart when it has one, must be on the page before it is scrolled into place.
async function reportLoaded(page, withChart) {
  await page.locator('#reports-heading').waitFor();
  await page.getByText('Highest', { exact: true }).first().waitFor();
  if (withChart) await page.getByRole('img', { name: /Daily average glucose/ }).waitFor();
}

function shooter(directory) {
  return async (page, name, { figure = false, fitTo } = {}) => {
    await settle(page, name, figure ? { extra: FIGURE_FILL_MS } : {});
    if (figure) await assertFigureDrawn(page, name);
    await page.screenshot({
      path: path.join(directory, `${name}.png`),
      clip: await clipFor(page, fitTo),
    });
    console.log(`captured ${name}`);
  };
}

// Each group is a short run in one browser context; a number picks the group that holds it.
function groups(browser, demo, shoot) {
  return [
    {
      name: 'login',
      ids: ['01'],
      async run() {
        const { context, page } = await newPage(browser, DESKTOP);
        await page.goto('/login');
        await shoot(page, '01-login');
        await context.close();
      },
    },
    {
      name: 'onboarding',
      ids: ['02', '03', '04'],
      async run() {
        const { context, page } = await newPage(browser, DESKTOP);
        await fillAccount(page, throwawayEmail());
        await shoot(page, '02-onboarding-account');
        await continueStep(page);
        await fillBirth(page);
        await shoot(page, '03-onboarding-dob-age');
        await continueStep(page);
        await chooseGender(page, 'Male');
        await shoot(page, '04-onboarding-gender-figure', { figure: true });
        await createAccount(page);
        await context.close();
      },
    },
    {
      name: 'dashboard',
      ids: ['05', '06', '07', '08', '09', '10'],
      async run() {
        const { context, page } = await newPage(browser, DESKTOP, await demo());
        const { full, partial } = await pickDates(page);

        await page.goto(`/?date=${full}`);
        await shoot(page, '05-dashboard-readings', { figure: true });

        await page.goto(`/?date=${partial}`);
        await page
          .getByRole('button', { name: /^Add .* reading$/ })
          .first()
          .click();
        await page.locator('#reading-value').fill('39');
        await page.getByRole('button', { name: 'Save reading' }).click();
        await page.getByText(/must be between 40 and 600/).waitFor();
        await shoot(page, '06-add-reading-validation');
        await page.keyboard.press('Escape');

        await page.goto(`/?date=${full}&report=daily`);
        await reportLoaded(page, false);
        await scrollToTop(page.locator('#reports-heading'));
        await shoot(page, '07-daily-report');

        await page.goto(`/?date=${full}&report=mtd`);
        await reportLoaded(page, true);
        await scrollToTop(page.locator('#reports-heading'));
        await shoot(page, '08-month-to-date-chart');

        await page.goto(`/?date=${full}&report=monthly`);
        await reportLoaded(page, true);
        await scrollToTop(page.locator('#reports-heading'));
        await shoot(page, '09-previous-month');

        await page.goto('/history?page=2&limit=10');
        await page.locator('nav[aria-label="Pagination"]').waitFor();
        await shoot(page, '10-history-pagination', { fitTo: 'nav[aria-label="Pagination"]' });
        await context.close();
      },
    },
    {
      name: 'profile',
      ids: ['11', '11b'],
      async run() {
        const { context, page } = await newPage(browser, DESKTOP, await demo());
        await page.goto('/profile');
        await shoot(page, '11-profile-insights', { figure: true });
        await scrollToTop(page.getByRole('heading', { name: 'Average by meal slot' }), 96);
        await shoot(page, '11b-profile-insights-charts', { figure: true });
        await context.close();
      },
    },
    {
      name: 'mobile',
      ids: ['12'],
      async run() {
        const { context, page } = await newPage(browser, MOBILE, await demo());
        const { full } = await pickDates(page);
        await page.goto(`/?date=${full}`);
        await shoot(page, '12-mobile', { figure: true });
        await context.close();
      },
    },
    {
      name: 'mobile-onboarding',
      ids: ['13'],
      async run() {
        const { context, page } = await newPage(browser, MOBILE);
        await fillAccount(page, throwawayEmail(1));
        await continueStep(page);
        await fillBirth(page);
        await continueStep(page);
        await chooseGender(page, 'Female');
        await shoot(page, '13-mobile-onboarding', { figure: true });
        await context.close();
      },
    },
  ];
}

async function main() {
  await preflight();
  const wanted = process.argv.slice(2).filter((argument) => argument !== '--');
  const raw = await mkdtemp(path.join(tmpdir(), 'sweety-shots-'));
  let browser;
  try {
    browser = await launchBrowser();
    let session;
    const demo = async () => (session ??= await demoSession(browser, DESKTOP));
    for (const group of groups(browser, demo, shooter(raw))) {
      const selected =
        wanted.length === 0 ||
        wanted.some((item) => item === group.name || group.ids.includes(item));
      if (selected) await group.run();
    }
    console.table(await optimiseAll(raw, OUTPUT));
  } finally {
    await browser?.close();
    await rm(raw, { recursive: true, force: true });
    await deleteThrowawayUsers();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
