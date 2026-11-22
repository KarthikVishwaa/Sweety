// The three sign-up steps, driven the way a person would.
const PASSWORD = 'Shots-1234';

export const throwawayEmail = (offset = 0) => `shots+${Date.now() + offset}@example.com`;

export async function fillAccount(page, email) {
  await page.goto('/signup');
  await page.locator('#name').fill('Ramesh Kumar');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(PASSWORD);
}

export async function continueStep(page) {
  await page.getByRole('button', { name: 'Continue' }).click();
}

export async function fillBirth(page) {
  const date = page.locator('input[type="date"]');
  await date.waitFor();
  await date.fill('1968-05-14');
  await page.getByText(/You are \d+ years/).waitFor();
}

export async function chooseGender(page, label) {
  await page.getByRole('button', { name: 'Create my account' }).waitFor();
  await page.getByText(label, { exact: true }).click();
}

export async function createAccount(page) {
  await page.getByRole('button', { name: 'Create my account' }).click();
  await page.getByRole('heading', { name: /welcome/i }).waitFor({ timeout: 15000 });
}
