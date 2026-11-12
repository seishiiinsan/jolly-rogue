import { createDb, runMigrations } from '@jolly-rogue/db';

export async function migrateCommand(databaseUrl: string): Promise<void> {
  // max: 1 → une seule connexion ; onnotice muet → pas de bruit « already exists, skipping ».
  const { db, client } = createDb(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    await runMigrations(db);
    console.log('migrate: base à jour');
  } finally {
    await client.end();
  }
}
