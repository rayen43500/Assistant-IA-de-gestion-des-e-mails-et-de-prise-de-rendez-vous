// §6.1 / §6.4 : chaque espace du praticien s'ouvre et affiche des données réelles sans erreur
import { test, expect } from '@playwright/test';
import { ACCOUNTS, watchErrors, login, expectLoggedIn } from './helpers.js';

const TABS = ['Dashboard', 'Rendez-vous', 'Disponibilités', 'Patients', 'E-mails', 'Assistant IA', 'Documents', 'Notifications', 'Statistiques', 'Paramètres'];

test('navigation complète dans l’espace praticien', async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, ACCOUNTS.praticien);
  await expectLoggedIn(page);
  for (const tab of TABS) {
    await page.getByRole('button', { name: new RegExp(`^${tab}`) }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#root')).not.toBeEmpty();
  }
  expect(errors, errors.join('\n')).toEqual([]);
});

test('le tableau de bord affiche les indicateurs du jour', async ({ page }) => {
  await login(page, ACCOUNTS.praticien);
  await expectLoggedIn(page);
  await page.getByRole('button', { name: /^Dashboard/ }).first().click();
  await expect(page.getByText(/rendez-vous/i).first()).toBeVisible();
});

test('recherche dans la liste des patients (filtrage)', async ({ page }) => {
  await login(page, ACCOUNTS.praticien);
  await expectLoggedIn(page);
  await page.getByRole('button', { name: /^Patients/ }).first().click();
  const search = page.getByRole('textbox', { name: 'Rechercher un patient' });
  await expect(search).toBeVisible();
  await search.fill('zzz-aucun-patient-zzz');
  await expect(page.getByText(/Aucun patient ne correspond/i)).toBeVisible();
});
