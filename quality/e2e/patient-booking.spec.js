// Parcours principal du patient sans compte : réservation → consultation → annulation
import { test, expect } from '@playwright/test';
import { watchErrors, freshStart } from './helpers.js';

test('un patient réserve, retrouve puis annule son rendez-vous', async ({ page, browserName }) => {
  const errors = watchErrors(page);
  page.on('dialog', (d) => d.accept());
  await freshStart(page);
  await page.getByRole('button', { name: /Prendre rendez-vous/i }).first().click();
  await page.getByText(/Trouver un médecin/i).first().click();

  const card = page.locator('div.rounded-3xl')
    .filter({ hasText: 'Dr. Nadia Trabelsi' })
    .filter({ has: page.getByRole('button', { name: /Prendre RDV/ }) })
    .last();
  await card.getByRole('button', { name: /Prendre RDV/ }).click();

  await page.getByRole('button', { name: /créneaux/ }).first().click();
  await page.getByRole('button', { name: /Libre/ }).first().click();
  await page.getByRole('button', { name: /Continuer avec/ }).click();

  const email = `e2e.${browserName}.${Date.now()}@test.tn`;
  const field = (label) => page.locator('label', { hasText: label }).locator('..').locator('input').first();
  await field('Nom et prénom').fill(`Patient E2E ${browserName}`);
  await field('Téléphone').fill('+216 22 333 444');
  await field('Adresse e-mail').fill(email);
  await page.getByRole('button', { name: /Confirmer la Réservation/i }).click();
  await expect(page.getByText(/Rendez-vous Confirmé/i).first()).toBeVisible();

  await page.getByRole('button', { name: /Fermer|Terminer|Retour/ }).first().click();
  await page.getByText(/Mes rendez-vous/i).first().click();
  await expect(page.getByText('Dr. Nadia Trabelsi').first()).toBeVisible();
  await page.getByRole('button', { name: /^Annuler/ }).first().click();
  await expect(page.getByText(/Annulé/i).first()).toBeVisible();
  expect(errors, errors.join('\n')).toEqual([]);
});
