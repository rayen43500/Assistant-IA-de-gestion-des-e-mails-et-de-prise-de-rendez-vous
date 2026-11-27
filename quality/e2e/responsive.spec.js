// §6.3 Compatibilité multi-environnement : affichage mobile (Pixel 7)
import { test, expect } from '@playwright/test';
import { freshStart } from './helpers.js';

test('accueil sur mobile : pas de défilement horizontal, actions visibles', async ({ page }) => {
  await freshStart(page);
  await expect(page.getByRole('button', { name: /Prendre rendez-vous/i }).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
