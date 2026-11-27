/**
 * Analyse statique (SAST + maintenabilité) du backend et du frontend.
 *  - eslint-plugin-security : injections, regex catastrophiques, eval, etc.
 *  - complexité cyclomatique, profondeur, taille des fonctions (dette technique)
 * Les erreurs bloquent le pipeline ; les avertissements sont comptés dans le rapport.
 */
import js from '@eslint/js';
import globals from 'globals';
import security from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';

const maintainability = {
  complexity: ['warn', 20],
  'max-depth': ['warn', 5],
  'max-lines-per-function': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
  'max-params': ['warn', 6],
};

const securityRules = {
  ...security.configs.recommended.rules,
  // Accès dynamique par clé : très fréquent et non exploitable ici (faux positifs massifs)
  'security/detect-object-injection': 'off',
  'security/detect-eval-with-expression': 'error',
  'security/detect-unsafe-regex': 'error',
  'security/detect-buffer-noassert': 'error',
  'security/detect-pseudoRandomBytes': 'error',
  'security/detect-new-buffer': 'error',
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
};

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**'] },
  {
    files: ['backend/src/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.node } },
    plugins: { security },
    rules: {
      ...js.configs.recommended.rules,
      ...securityRules,
      ...maintainability,
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['frontend/src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    plugins: { security, '@typescript-eslint': tseslint.plugin },
    rules: {
      ...securityRules,
      ...maintainability,
      'max-lines-per-function': 'off', // composants React : mesurés via la complexité
      'no-debugger': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-self-assign': 'error',
      'no-cond-assign': 'error',
    },
  },
];
