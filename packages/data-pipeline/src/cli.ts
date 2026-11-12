#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { migrateCommand } from './commands/migrate.js';

const USAGE = `Usage : pipeline <commande>

Commandes :
  migrate   Applique les migrations Drizzle (schémas raw, staging, canon)

Variables d'environnement :
  DATABASE_URL   URL PostgreSQL (fournie par docker-compose)`;

const commands: Record<string, (databaseUrl: string) => Promise<void>> = {
  migrate: migrateCommand,
};

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: { help: { type: 'boolean', short: 'h' } },
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

  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    console.error('DATABASE_URL manquante');
    return 1;
  }

  await command(databaseUrl);
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
