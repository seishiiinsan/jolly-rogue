#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { gameDataSchema } from '@jolly-rogue/game-data';
import { BOTS, botByName } from './bots.js';
import { renderReport } from './report.js';
import { playRuns } from './simulate.js';

const USAGE = `Usage : sim [options]

Options :
  --bot <nom>        Bot à faire jouer : ${BOTS.map((b) => b.name).join(', ')} ou all (défaut : all)
  --runs <n>         Parties par bot (défaut : 10000)
  --seed-from <n>    Première seed ; les suivantes sont consécutives (défaut : 1)
  --out <fichier>    Rapport Markdown (défaut : data/sim/report.md)

Variables d'environnement :
  DATA_DIR           Dossier data (défaut : <repo>/data ; /data dans Docker)`;

async function main(): Promise<number> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      help: { type: 'boolean', short: 'h' },
      bot: { type: 'string', default: 'all' },
      runs: { type: 'string', default: '10000' },
      'seed-from': { type: 'string', default: '1' },
      out: { type: 'string' },
    },
  });
  if (values.help) {
    console.log(USAGE);
    return 0;
  }
  const runs = Number(values.runs);
  const seedFrom = Number(values['seed-from']);
  if (!Number.isInteger(runs) || runs < 1 || !Number.isInteger(seedFrom) || seedFrom < 0) {
    console.error(`--runs et --seed-from : entiers positifs attendus\n\n${USAGE}`);
    return 1;
  }
  const bots = values.bot === 'all' ? BOTS : [botByName(values.bot)];
  if (bots.some((b) => b === undefined)) {
    console.error(`Bot inconnu : ${values.bot}\n\n${USAGE}`);
    return 1;
  }

  const dataDir = process.env['DATA_DIR'] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'data');
  const data = gameDataSchema.parse(JSON.parse(await readFile(path.join(dataDir, 'exports', 'game.json'), 'utf8')));

  const results = [];
  for (const bot of bots) {
    if (!bot) continue;
    const started = performance.now();
    const summaries = playRuns(bot, data, runs, seedFrom);
    const avg = summaries.reduce((sum, r) => sum + r.wavesCleared, 0) / summaries.length;
    console.log(`${bot.name.padEnd(10)} ${runs} parties en ${((performance.now() - started) / 1000).toFixed(1)} s, ${avg.toFixed(1)} vagues en moyenne`);
    results.push({ bot, runs: summaries });
  }

  const out = values.out ?? path.join(dataDir, 'sim', 'report.md');
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, `${renderReport(results, data, runs, seedFrom)}\n`);
  console.log(`✓ ${out}`);
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
