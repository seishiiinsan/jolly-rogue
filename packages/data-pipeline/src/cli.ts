#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { allCommand } from './commands/all.js';
import { exportCommand } from './commands/export.js';
import { ingestCommand } from './commands/ingest.js';
import { migrateCommand } from './commands/migrate.js';
import { reconcileCommand } from './commands/reconcile.js';
import { reportCommand } from './commands/report.js';
import type { CommandContext } from './commands/types.js';

const USAGE = `Usage : pipeline <commande> [options]

Commandes :
  all                           Tout reconstruire : migrate, ingest (toutes sources), reconcile, export, report
  migrate                       Applique les migrations Drizzle (schémas raw, staging, canon)
  ingest --source=api-onepiece  Collecte (raw) et parse (staging) api-onepiece.com (FR + EN)
  ingest --source=fandom        Collecte (raw) et parse (staging) les infobox du One Piece Wiki
  reconcile                     staging → canon : rapprochement, priorité par champ, overrides
  export                        Écrit data/exports/canon.json (tri stable)
  report                        Écrit data/exports/report.md

Options d'ingest et de all :
  --offline   Lit uniquement le cache disque (aucune requête réseau)
  --refresh   Ignore le cache en lecture et re-télécharge (1 requête/s par domaine)

Variables d'environnement :
  DATABASE_URL          URL PostgreSQL (fournie par docker-compose)
  DATA_DIR              Dossier data (défaut : <repo>/data ; /data dans Docker)
  PIPELINE_USER_AGENT   User-Agent des requêtes HTTP (défaut : jolly-rogue-data-pipeline/…)`;

const commands: Record<string, (ctx: CommandContext) => Promise<void>> = {
  all: allCommand,
  migrate: migrateCommand,
  ingest: ingestCommand,
  reconcile: reconcileCommand,
  export: exportCommand,
  report: reportCommand,
};

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      source: { type: 'string' },
      offline: { type: 'boolean', default: false },
      refresh: { type: 'boolean', default: false },
    },
  });

  const [name] = positionals;
  if (values.help || name === undefined) {
    console.log(USAGE);
    return values.help ? 0 : 1;
  }

  const command = commands[name];
  if (command === undefined) {
    console.error(`Commande inconnue : ${name}\n\n${USAGE}`);
    return 1;
  }
  if (values.offline && values.refresh) {
    console.error('--offline et --refresh sont incompatibles');
    return 1;
  }

  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    console.error('DATABASE_URL manquante');
    return 1;
  }

  await command({
    databaseUrl,
    options: { source: values.source, offline: values.offline, refresh: values.refresh },
  });
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
