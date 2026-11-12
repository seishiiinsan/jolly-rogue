import { pgSchema } from 'drizzle-orm/pg-core';

/** Réponses HTTP brutes, stockées avant tout parsing (tables ajoutées à la tâche 2). */
export const raw = pgSchema('raw');
