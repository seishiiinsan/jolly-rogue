import { pgSchema } from 'drizzle-orm/pg-core';

/** Lignes parsées et validées par Zod, une table par source (tables ajoutées aux tâches 2 et 3). */
export const staging = pgSchema('staging');
