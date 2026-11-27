// §6.1 Aptitude fonctionnelle + §6.6 Sécurité : authentification réelle par l'interface
import { test, expect } from '@playwright/test';
import { ACCOUNTS, watchErrors, freshStart, login, expectLoggedIn } from './helpers.js';

test('page d’accueil publique : titre, appels à l’action, aucune erreur', async ({ page }) => {
  const errors = watchErrors(page);
  await freshStart(page);
  await expect(page).toHaveTitle(/Rendez-vous/i);
  await expect(page.getByRole('button', { name: /Prendre rendez-vous/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Connexion Professionnel/i }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('mauvais mot de passe : message d’erreur, aucune session ouverte', async ({ page }) => {
  await login(page, { email: ACCOUNTS.praticien.email, password: 'mauvais-mdp' });
  await expect(page.getByText(/Identifiants invalides/i)).toBeVisible();
  const hasToken = await page.evaluate(() => Object.keys(localStorage).some((k) => /token/i.test(k) && localStorage.getItem(k)));
  expect(hasToken).toBe(false);
});

test('connexion praticien, puis session invalide refermée proprement', async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, ACCOUNTS.praticien);
  await expectLoggedIn(page);
  // Jeton corrompu : l'API renvoie 401 et l'application revient à l'accueil sans planter
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (/token/i.test(k)) localStorage.setItem(k, 'jeton.corrompu.x'); });
  await page.reload();
  await expect(page.getByRole('button', { name: /Connexion Professionnel/i }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
