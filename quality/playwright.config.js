import { defineConfig, devices } from '@playwright/test';

// Le stack de test (backend 5050 + frontend 4173) est démarré par run-all.js / stack.js
export default defineConfig({
  testDir: './e2e',
  outputDir: './reports/e2e-artifacts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // parcours qui partagent la même base de test
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: './reports/e2e-html', open: 'never' }],
    ['junit', { outputFile: './reports/e2e-junit.xml' }],
    ['json', { outputFile: './reports/e2e-results.json' }],
  ],
  use: {
    baseURL: process.env.QA_FRONTEND_URL || 'http://localhost:4173',
    locale: 'fr-FR',
    timezoneId: 'Africa/Tunis',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  // ISO 25010 §6.3 Compatibilité : mêmes parcours sur 2 moteurs (Chromium/Blink et Firefox/Gecko) + mobile
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] }, testMatch: /responsive\.spec\.js/ },
  ],
});
