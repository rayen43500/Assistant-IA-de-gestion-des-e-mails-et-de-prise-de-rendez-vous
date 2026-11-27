// §6.6 Contrôle d'accès par rôle visible dans l'interface
import { test, expect } from '@playwright/test';
import { ACCOUNTS, watchErrors, login } from './helpers.js';

test('le super-admin accède à la console d’administration', async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, ACCOUNTS.admin);
  await expect(page.getByText(/Super Admin|Administration|Cabinets/i).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('un praticien ne voit pas l’entrée Super Admin', async ({ page }) => {
  await login(page, ACCOUNTS.praticien);
  await expect(page.getByRole('button', { name: /^Rendez-vous/ }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /^Super Admin/ })).toHaveCount(0);
});
