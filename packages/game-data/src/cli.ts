#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { exportsDir, loadCanon, loadRawGameFiles } from './load.js';
import { formatIssue, validateGameData } from './validate.js';

const USAGE = `Usage : game-data <commande>

Commandes :
  validate   Valide packages/game-data/game/*.yaml (schémas, slugs du canon, références, budgets)
  build      Valide puis écrit data/exports/game.json (tri stable, aucun horodatage)`;

async function main(): Promise<number> {
  const command = process.argv[2];
  if (command !== 'validate' && command !== 'build') {
    console.error(USAGE);
    return 1;
  }
  const result = validateGameData(await loadRawGameFiles(), await loadCanon());
  if (!result.ok) {
    console.error(`${result.issues.length} erreur(s) dans les données de jeu :`);
    for (const issue of result.issues) console.error(`  ✗ ${formatIssue(issue)}`);
    return 1;
  }
  const { data } = result;
  console.log(
    `✓ données de jeu valides : ${data.characters.length} persos, ${data.skills.length} compétences, ${data.enemies.length} ennemis, ${data.synergies.length} synergies`,
  );
  if (command === 'build') {
    const file = path.join(exportsDir(), 'game.json');
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`✓ ${file}`);
  }
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  },
);
