import { expect } from '@playwright/test';

export const ACCOUNTS = {
  admin: { email: 'admin@medilaw.ai', password: 'Password123!' },
  praticien: { email: 'dr.bensalem@cabinet-ai.tn', password: 'Password123!' },
  praticien2: { email: 'dr.nadia@cabinet-ai.tn', password: 'Password123!' },
};

/** Collecte les erreurs JavaScript et les réponses serveur 5xx pendant un test */
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 500) errors.push(`HTTP ${r.status()} ${r.url()}`); });
  return errors;
}

export async function freshStart(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
}

export async function login(page, { email, password }) {
  await freshStart(page);
  await page.getByRole('button', { name: /Connexion Professionnel/i }).first().click();
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.locator('input[type=password]').press('Enter');
}

export async function expectLoggedIn(page) {
  await expect(page.getByRole('button', { name: /^Rendez-vous/ }).first()).toBeVisible();
}
