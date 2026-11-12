import { index, integer, jsonb, pgSchema, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { responses } from './raw.js';

/** Lignes parsées et validées par Zod, une table par source (docs/cadrage.md §9.4, étape parse). */
export const staging = pgSchema('staging');

const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * api-onepiece.com : une ligne par (ressource, langue, id API).
 * `data` contient la sortie normalisée du schéma Zod de la ressource (packages/data-pipeline/src/parse).
 */
export const apiOnepiece = staging.table(
  'api_onepiece',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    resource: text('resource').notNull(),
    lang: text('lang').notNull(),
    externalId: text('external_id').notNull(),
    data: jsonb('data').notNull(),
    rawResponseId: integer('raw_response_id')
      .notNull()
      .references(() => responses.id, { onDelete: 'restrict' }),
    ...timestamps(),
  },
  (t) => [
    unique('api_onepiece_resource_lang_external_id_key').on(t.resource, t.lang, t.externalId),
    index('api_onepiece_raw_response_id_idx').on(t.rawResponseId),
  ],
);

/** Lignes rejetées par Zod, toutes sources confondues : listées dans le rapport. */
export const rejections = staging.table(
  'rejections',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    source: text('source').notNull(),
    resource: text('resource').notNull(),
    lang: text('lang').notNull(),
    externalId: text('external_id').notNull(),
    errors: jsonb('errors').notNull(),
    rawResponseId: integer('raw_response_id')
      .notNull()
      .references(() => responses.id, { onDelete: 'restrict' }),
    ...timestamps(),
  },
  (t) => [
    unique('rejections_source_resource_lang_external_id_key').on(t.source, t.resource, t.lang, t.externalId),
    index('rejections_raw_response_id_idx').on(t.rawResponseId),
  ],
);

/**
 * One Piece Wiki (Fandom) : une ligne par (kind, page). `data` contient l'infobox normalisée
 * par le schéma Zod du kind (packages/data-pipeline/src/parse/fandom). Textes sous licence
 * CC BY-SA : `license` et `source_url` (permalien de la révision) sont renseignés sur chaque ligne.
 */
export const fandom = staging.table(
  'fandom',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    /** character | devil_fruit | crew */
    kind: text('kind').notNull(),
    pageId: integer('page_id').notNull(),
    title: text('title').notNull(),
    revId: integer('rev_id').notNull(),
    sourceUrl: text('source_url').notNull(),
    license: text('license').notNull(),
    data: jsonb('data').notNull(),
    rawResponseId: integer('raw_response_id')
      .notNull()
      .references(() => responses.id, { onDelete: 'restrict' }),
    ...timestamps(),
  },
  (t) => [
    unique('fandom_kind_page_id_key').on(t.kind, t.pageId),
    index('fandom_raw_response_id_idx').on(t.rawResponseId),
  ],
);
