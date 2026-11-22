import { CLIENT_URL } from './preflight.mjs';

const DEMO = { email: 'demo@sweety.app', password: 'Demo@1234' };
const SLOTS_PER_DAY = 4;

/** Logs in as the demo account through the form and returns the browser state, so other contexts can reuse it. */
export async function demoSession(browser, contextOptions) {
  const context = await browser.newContext({ ...contextOptions, baseURL: CLIENT_URL });
  try {
    const page = await context.newPage();
    await page.goto('/login');
    await page.locator('input[type="email"], #email').first().fill(DEMO.email);
    await page.locator('input[type="password"]').fill(DEMO.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(`${CLIENT_URL}/`, { timeout: 15000 });
    return await context.storageState();
  } finally {
    await context.close();
  }
}

// A representative day reads well in a picture: nothing extreme, so the figure and the charts look typical.
const TYPICAL = { lowest: 70, highest: 250 };

/** The newest typical day with all four readings and the newest day that still has an empty slot. */
export async function pickDates(page) {
  const response = await page.request.get('/api/readings?page=1&limit=100');
  if (!response.ok()) {
    throw new Error(`Could not list the demo readings (HTTP ${response.status()}).`);
  }
  const { data } = await response.json();
  const perDay = new Map();
  for (const { date, value } of data) perDay.set(date, [...(perDay.get(date) ?? []), value]);
  const days = [...perDay.entries()].sort(([a], [b]) => b.localeCompare(a));
  const full = days.find(
    ([, values]) =>
      values.length === SLOTS_PER_DAY &&
      values.every((value) => value >= TYPICAL.lowest && value <= TYPICAL.highest),
  )?.[0];
  const partial = days.find(([, values]) => values.length < SLOTS_PER_DAY)?.[0];
  if (!full || !partial) {
    throw new Error(
      'The demo account needs a typical day with four readings and a day with fewer. Run "npm run seed".',
    );
  }
  return { full, partial };
}
