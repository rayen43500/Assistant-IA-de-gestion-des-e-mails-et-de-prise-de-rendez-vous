// §6.4 Facilité d'utilisation : accessibilité de base (axe-core, règles WCAG 2.1 A/AA)
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import { freshStart, login, ACCOUNTS } from './helpers.js';

async function audit(page, name) {
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const summary = res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')), html: v.nodes.slice(0, 2).map((n) => n.html.slice(0, 160)) }));
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync(`reports/axe-${name}.json`, JSON.stringify(summary, null, 2));
  return summary;
}

test('accueil public : aucune violation WCAG critique', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium', 'audit réalisé une seule fois (Chromium)');
  await freshStart(page);
  const v = await audit(page, 'accueil');
  expect(v.filter((x) => x.impact === 'critical'), JSON.stringify(v, null, 2)).toEqual([]);
});

test('espace praticien : aucune violation WCAG critique', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium', 'audit réalisé une seule fois (Chromium)');
  await login(page, ACCOUNTS.praticien);
  await expect(page.getByRole('button', { name: /^Rendez-vous/ }).first()).toBeVisible();
  const v = await audit(page, 'praticien');
  expect(v.filter((x) => x.impact === 'critical'), JSON.stringify(v, null, 2)).toEqual([]);
});

test('navigation au clavier : le bouton de connexion est atteignable avec Tab', async ({ page }) => {
  await freshStart(page);
  let reached = false;
  for (let i = 0; i < 25 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => /Connexion Professionnel/i.test(document.activeElement?.innerText || ''));
  }
  expect(reached).toBe(true);
});
