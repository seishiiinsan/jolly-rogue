// Lint du monorepo : ESLint flat config + typescript-eslint (règles type-aware).
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/** API interdites dans le moteur : il doit rester déterministe et sans environnement (CLAUDE.md). */
const ENGINE_FORBIDDEN_GLOBALS = [
  'Date',
  'performance',
  'setTimeout',
  'setInterval',
  'fetch',
  'process',
  'window',
  'document',
].map((name) => ({
  name,
  message: `« ${name} » est interdit dans le moteur : il doit rester déterministe, sans horloge ni environnement.`,
}));

/** Garde-fous du moteur, exportés pour `scripts/check-engine-lint.mjs`. */
export const engineRestrictions = {
  files: ['packages/engine/**/*.ts'],
  ignores: ['packages/engine/test/**', 'packages/engine/*.config.ts'],
  rules: {
    'no-restricted-globals': ['error', ...ENGINE_FORBIDDEN_GLOBALS],
    'no-restricted-properties': [
      'error',
      { object: 'Math', property: 'random', message: 'Math.random() est interdit dans le moteur : utilise le RNG seedé injecté.' },
      { object: 'globalThis', property: 'Date', message: 'Date est interdit dans le moteur.' },
      { object: 'globalThis', property: 'performance', message: 'performance est interdit dans le moteur.' },
      { object: 'globalThis', property: 'process', message: 'process est interdit dans le moteur.' },
      { object: 'globalThis', property: 'fetch', message: 'fetch est interdit dans le moteur.' },
    ],
  },
};

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', 'data/**', '**/migrations/**', '**/playwright-report/**', '**/test-results/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // `any` explicite interdit ; une exception doit être désactivée ligne à ligne avec une justification.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Un `eslint-disable` doit toujours porter sa justification.
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  engineRestrictions,
  {
    // Fichiers JS de config (hors projet TypeScript) : pas de règles type-aware.
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // Scripts Node hors TypeScript : globales Node déclarées à la main (évite la dépendance `globals`).
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly', URL: 'readonly' } },
  },
);
