import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema/index.js';

/** Dossier des migrations générées par drizzle-kit (embarqué dans le package). */
export const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url));

export type Database = ReturnType<typeof createDb>['db'];

export function createDb(databaseUrl: string, options: postgres.Options<Record<string, never>> = {}) {
  const client = postgres(databaseUrl, options);
  const db = drizzle(client, { schema });
  return { db, client };
}

/** Applique les migrations en attente. Sans effet si la base est à jour. */
export async function runMigrations(db: Database): Promise<void> {
  await migrate(db, { migrationsFolder });
}
