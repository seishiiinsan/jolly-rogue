import { defineConfig } from 'drizzle-kit';

// `drizzle-kit generate` compare le schéma TS aux snapshots de ./migrations :
// aucune connexion à la base n'est nécessaire.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
});
