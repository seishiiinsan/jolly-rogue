// Vérifie que les garde-fous de lint du moteur sont réellement actifs (docs/prompts/05-lint-ci.md) :
// chaque API interdite, écrite dans un fichier de packages/engine/, doit produire une erreur.
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { engineRestrictions } from '../eslint.config.js';

const FORBIDDEN = [
  'Math.random()',
  'new Date()',
  'Date.now()',
  'performance.now()',
  'setTimeout(() => {}, 0)',
  'setInterval(() => {}, 0)',
  'fetch("https://example.org")',
  'process.env',
  'window.location',
  'document.title',
];
const ALLOWED = ['Math.floor(3 / 2)', 'Math.imul(3, 5)'];

const root = new URL('..', import.meta.url).pathname;
const file = `${root}packages/engine/src/__lint_probe__.ts`;

// 1. La config du dépôt applique bien ces règles aux fichiers du moteur (et pas ailleurs).
const repo = new ESLint({ cwd: root });
const engineConfig = await repo.calculateConfigForFile(file);
const otherConfig = await repo.calculateConfigForFile(`${root}packages/db/src/index.ts`);
const failures = [];
for (const rule of ['no-restricted-globals', 'no-restricted-properties']) {
  if (!engineConfig?.rules?.[rule]) failures.push(`règle ${rule} absente pour packages/engine`);
  if (otherConfig?.rules?.[rule]) failures.push(`règle ${rule} appliquée hors du moteur`);
}

// 2. Ces règles rejettent chaque API interdite (lint d'un texte, sans fichier sur disque).
const probe = new ESLint({
  cwd: root,
  overrideConfigFile: true,
  overrideConfig: [{ ...engineRestrictions, languageOptions: { parser: tseslint.parser } }],
});
const errorsOf = async (code) => {
  const [result] = await probe.lintText(`export const probe = ${code};\n`, { filePath: file });
  return result.messages.filter((m) => m.severity === 2);
};
for (const code of FORBIDDEN) {
  if ((await errorsOf(code)).length === 0) failures.push(`« ${code} » devrait être refusé dans packages/engine`);
}
for (const code of ALLOWED) {
  const errors = await errorsOf(code);
  if (errors.length > 0) failures.push(`« ${code} » devrait être accepté : ${errors[0].message}`);
}

if (failures.length > 0) {
  console.error(failures.map((f) => `✗ ${f}`).join('\n'));
  process.exit(1);
}
console.log(`✓ garde-fous du moteur actifs (${FORBIDDEN.length} API interdites refusées)`);
