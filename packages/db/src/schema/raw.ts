import { index, integer, pgSchema, smallint, text, timestamp } from 'drizzle-orm/pg-core';

/** Réponses HTTP brutes, stockées avant tout parsing (docs/cadrage.md §9.4, étape fetch). */
export const raw = pgSchema('raw');

/**
 * Append-only : une nouvelle ligne n'est insérée que si le hash du body diffère
 * de la dernière réponse connue pour la même URL.
 */
export const responses = raw.table(
  'responses',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    source: text('source').notNull(),
    url: text('url').notNull(),
    status: smallint('status').notNull(),
    body: text('body').notNull(),
    // sha256 hexadécimal du body.
    hash: text('hash').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('responses_url_fetched_at_idx').on(t.url, t.fetchedAt), index('responses_source_idx').on(t.source)],
);
