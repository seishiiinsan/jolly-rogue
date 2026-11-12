import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  index,
  integer,
  pgSchema,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Faits du lore One Piece. Alimenté uniquement par le pipeline (docs/cadrage.md §9.5).
 *
 * `updated_at` est tenu à jour par un trigger PostgreSQL (migration custom
 * `canon_updated_at_triggers`) : toute nouvelle table canon doit y être ajoutée
 * via une nouvelle migration custom.
 */
export const canon = pgSchema('canon');

// --- Enums ---------------------------------------------------------------

// Attention : drizzle-kit 0.31 prend pour un type natif tout nom de type commençant par
// un nom natif (char, text, time, date, bit, int…) et oublie alors le préfixe de schéma.
// D'où `vital_status` et non `character_status`.
export const vitalStatus = canon.enum('vital_status', ['alive', 'deceased', 'unknown']);
export const crewKind = canon.enum('crew_kind', ['pirate', 'marine', 'government', 'revolutionary', 'other']);
export const devilFruitType = canon.enum('devil_fruit_type', ['paramecia', 'zoan', 'logia']);
export const hakiKind = canon.enum('haki_kind', ['observation', 'armament', 'conqueror']);

// --- Colonnes communes ---------------------------------------------------

const id = () => integer('id').primaryKey().generatedAlwaysAsIdentity();
const slug = () => text('slug').notNull().unique();
const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Lieux ---------------------------------------------------------------

export const locations = canon.table('locations', {
  id: id(),
  slug: slug(),
  nameEn: text('name_en').notNull(),
  nameFr: text('name_fr'),
  // Listes non fermées pour l'instant : passage en enum quand les données réelles seront connues.
  sea: text('sea'),
  kind: text('kind'),
  ...timestamps(),
});

// --- Personnages ---------------------------------------------------------

export const characters = canon.table(
  'characters',
  {
    id: id(),
    slug: slug(),
    nameEn: text('name_en').notNull(),
    nameFr: text('name_fr'),
    nameJp: text('name_jp'),
    epithet: text('epithet'),
    status: vitalStatus('status').notNull().default('unknown'),
    age: smallint('age'),
    heightCm: integer('height_cm'),
    originLocationId: integer('origin_location_id').references(() => locations.id, { onDelete: 'set null' }),
    debutChapter: integer('debut_chapter'),
    ...timestamps(),
  },
  (t) => [
    check('characters_age_check', sql`${t.age} >= 0`),
    check('characters_height_cm_check', sql`${t.heightCm} > 0`),
    check('characters_debut_chapter_check', sql`${t.debutChapter} > 0`),
    index('characters_origin_location_id_idx').on(t.originLocationId),
  ],
);

export const characterAliases = canon.table(
  'character_aliases',
  {
    id: id(),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    alias: text('alias').notNull(),
    kind: text('kind').notNull(),
    ...timestamps(),
  },
  (t) => [
    unique('character_aliases_character_id_alias_kind_key').on(t.characterId, t.alias, t.kind),
    index('character_aliases_alias_idx').on(t.alias),
  ],
);

// --- Équipages et affiliations -------------------------------------------

export const crews = canon.table(
  'crews',
  {
    id: id(),
    slug: slug(),
    nameEn: text('name_en').notNull(),
    nameFr: text('name_fr'),
    kind: crewKind('kind').notNull(),
    captainId: integer('captain_id').references((): AnyPgColumn => characters.id, { onDelete: 'set null' }),
    isYonko: boolean('is_yonko').notNull().default(false),
    ...timestamps(),
  },
  (t) => [index('crews_captain_id_idx').on(t.captainId)],
);

export const characterAffiliations = canon.table(
  'character_affiliations',
  {
    id: id(),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    crewId: integer('crew_id')
      .notNull()
      .references(() => crews.id, { onDelete: 'cascade' }),
    role: text('role'),
    isCurrent: boolean('is_current').notNull(),
    ...timestamps(),
  },
  (t) => [
    // NULLS NOT DISTINCT : un rôle inconnu (NULL) ne doit pas permettre de doublon.
    unique('character_affiliations_character_id_crew_id_role_key')
      .on(t.characterId, t.crewId, t.role)
      .nullsNotDistinct(),
    index('character_affiliations_crew_id_idx').on(t.crewId),
  ],
);

// --- Fruits du démon -----------------------------------------------------

export const devilFruits = canon.table('devil_fruits', {
  id: id(),
  slug: slug(),
  nameRomaji: text('name_romaji').notNull(),
  nameEn: text('name_en'),
  nameFr: text('name_fr'),
  // NULL = type non révélé dans le canon.
  type: devilFruitType('type'),
  subtype: text('subtype'),
  ...timestamps(),
});

export const characterFruits = canon.table(
  'character_fruits',
  {
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    fruitId: integer('fruit_id')
      .notNull()
      .references(() => devilFruits.id, { onDelete: 'cascade' }),
    isCurrent: boolean('is_current').notNull(),
    ...timestamps(),
  },
  (t) => [
    primaryKey({ columns: [t.characterId, t.fruitId] }),
    // Un fruit n'a qu'un porteur actuel ; un perso peut en avoir plusieurs (Barbe Noire).
    uniqueIndex('character_fruits_current_fruit_key').on(t.fruitId).where(sql`${t.isCurrent}`),
  ],
);

// --- Primes et haki ------------------------------------------------------

export const bounties = canon.table(
  'bounties',
  {
    id: id(),
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    // bigint côté SQL ; mode number côté TS (la plus grosse prime reste très loin de 2^53).
    amountBerry: bigint('amount_berry', { mode: 'number' }).notNull(),
    asOfChapter: integer('as_of_chapter'),
    isCurrent: boolean('is_current').notNull(),
    ...timestamps(),
  },
  (t) => [
    check('bounties_amount_berry_check', sql`${t.amountBerry} >= 0`),
    check('bounties_as_of_chapter_check', sql`${t.asOfChapter} > 0`),
    unique('bounties_character_id_amount_berry_key').on(t.characterId, t.amountBerry),
    uniqueIndex('bounties_current_character_key').on(t.characterId).where(sql`${t.isCurrent}`),
  ],
);

export const haki = canon.table(
  'haki',
  {
    characterId: integer('character_id')
      .notNull()
      .references(() => characters.id, { onDelete: 'cascade' }),
    kind: hakiKind('kind').notNull(),
    ...timestamps(),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.kind] })],
);

// --- Sagas et arcs -------------------------------------------------------

export const sagas = canon.table(
  'sagas',
  {
    id: id(),
    slug: slug(),
    nameEn: text('name_en').notNull(),
    nameFr: text('name_fr'),
    chapterStart: integer('chapter_start'),
    chapterEnd: integer('chapter_end'),
    sortOrder: integer('sort_order').notNull().unique(),
    ...timestamps(),
  },
  (t) => [check('sagas_chapter_range_check', sql`${t.chapterEnd} >= ${t.chapterStart}`)],
);

export const arcs = canon.table(
  'arcs',
  {
    id: id(),
    slug: slug(),
    nameEn: text('name_en').notNull(),
    nameFr: text('name_fr'),
    sagaId: integer('saga_id')
      .notNull()
      .references(() => sagas.id, { onDelete: 'restrict' }),
    chapterStart: integer('chapter_start'),
    chapterEnd: integer('chapter_end'),
    sortOrder: integer('sort_order').notNull().unique(),
    ...timestamps(),
  },
  (t) => [
    check('arcs_chapter_range_check', sql`${t.chapterEnd} >= ${t.chapterStart}`),
    index('arcs_saga_id_idx').on(t.sagaId),
  ],
);

// --- Provenance ----------------------------------------------------------

export const provenance = canon.table(
  'provenance',
  {
    id: id(),
    // Référence polymorphe (nom de table + id) : pas de clé étrangère possible.
    entity: text('entity').notNull(),
    entityId: integer('entity_id').notNull(),
    field: text('field').notNull(),
    source: text('source').notNull(),
    sourceUrl: text('source_url').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    license: text('license'),
    ...timestamps(),
  },
  (t) => [unique('provenance_entity_entity_id_field_source_key').on(t.entity, t.entityId, t.field, t.source)],
);

// --- Correspondance des identifiants par source ---------------------------

/**
 * Table de correspondance « id dans la source » → entité canon (docs/cadrage.md §9.4, étape 1 du
 * rapprochement). Garantit des upserts par clé source et des slugs figés à la création.
 */
export const externalIds = canon.table(
  'external_ids',
  {
    id: id(),
    // Nom de table canon (characters, crews, devil_fruits…).
    entity: text('entity').notNull(),
    entityId: integer('entity_id').notNull(),
    source: text('source').notNull(),
    externalId: text('external_id').notNull(),
    ...timestamps(),
  },
  (t) => [
    unique('external_ids_source_entity_external_id_key').on(t.source, t.entity, t.externalId),
    index('external_ids_entity_entity_id_idx').on(t.entity, t.entityId),
  ],
);
