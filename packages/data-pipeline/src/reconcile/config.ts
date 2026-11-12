import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { FANDOM_SOURCE } from '../parse/fandom/api.js';
import { API_ONEPIECE_SOURCE } from '../parse/api-onepiece.js';

/**
 * Fichiers de configuration de la réconciliation, validés par Zod :
 * - `config/field-priority.yaml` : priorité des sources par champ (docs/cadrage.md §9.4 étape 5) ;
 * - `overrides/aliases.yaml` : rapprochements manuels ;
 * - `overrides/corrections.yaml` : corrections de valeurs, appliquées en dernier.
 */

export const PACKAGE_DIR = fileURLToPath(new URL('../../', import.meta.url));
export const CONFIG_DIR = path.join(PACKAGE_DIR, 'config');
export const OVERRIDES_DIR = path.join(PACKAGE_DIR, 'overrides');

export const RECONCILE_SOURCES = [API_ONEPIECE_SOURCE, FANDOM_SOURCE] as const;
export type ReconcileSource = (typeof RECONCILE_SOURCES)[number];
/** Source des valeurs posées par `overrides/corrections.yaml` (provenance). */
export const OVERRIDE_SOURCE = 'override';

/** Entités canon gérées par la réconciliation, avec leurs champs (colonnes SQL ou relations). */
export const ENTITY_FIELDS = {
  locations: ['name_en', 'name_fr', 'sea', 'kind'],
  sagas: ['name_en', 'name_fr', 'chapter_start', 'chapter_end', 'sort_order'],
  arcs: ['name_en', 'name_fr', 'chapter_start', 'chapter_end', 'sort_order', 'saga_id'],
  devil_fruits: ['name_romaji', 'name_en', 'name_fr', 'type', 'subtype'],
  crews: ['name_en', 'name_fr', 'kind', 'is_yonko', 'captain_id'],
  characters: [
    'name_en',
    'name_fr',
    'name_jp',
    'epithet',
    'status',
    'age',
    'height_cm',
    'origin_location_id',
    'debut_chapter',
    'affiliations',
    'devil_fruits',
    'bounties',
    'haki',
  ],
} as const;
export type EntityName = keyof typeof ENTITY_FIELDS;
export type FieldOf<E extends EntityName> = (typeof ENTITY_FIELDS)[E][number];
export const ENTITY_NAMES = Object.keys(ENTITY_FIELDS) as EntityName[];

/** Entités présentes dans plusieurs sources, donc à rapprocher. */
export const MATCHED_ENTITIES = ['devil_fruits', 'crews', 'characters'] as const;
export type MatchedEntity = (typeof MATCHED_ENTITIES)[number];

// --- Priorité par champ ------------------------------------------------------

const sourceList = z
  .array(z.enum(RECONCILE_SOURCES))
  .min(1)
  .refine((l) => new Set(l).size === l.length, 'source en double');

const prioritySchema = z.strictObject(
  Object.fromEntries(
    ENTITY_NAMES.map((entity) => [
      entity,
      z.strictObject(Object.fromEntries(ENTITY_FIELDS[entity].map((field) => [field, sourceList]))),
    ]),
  ) as { [E in EntityName]: z.ZodObject<Record<FieldOf<E>, typeof sourceList>> },
);
export type FieldPriority = { [E in EntityName]: Record<FieldOf<E>, ReconcileSource[]> };

// --- Alias -------------------------------------------------------------------

const aliasEntry = z.strictObject({
  /** Titre exact de la page du One Piece Wiki. */
  fandom: z.string().min(1),
  /** Id api-onepiece.com, ou `null` : aucun équivalent (bloque le rapprochement par nom). */
  'api-onepiece': z.union([z.string().regex(/^\d+$/), z.number().int().positive().transform(String), z.null()]),
  note: z.string().optional(),
});
const aliasesSchema = z
  .strictObject({
    devil_fruits: z.array(aliasEntry).nullish(),
    crews: z.array(aliasEntry).nullish(),
    characters: z.array(aliasEntry).nullish(),
  })
  .nullish()
  .transform((a) => ({
    devil_fruits: a?.devil_fruits ?? [],
    crews: a?.crews ?? [],
    characters: a?.characters ?? [],
  }));
export type AliasEntry = z.output<typeof aliasEntry>;
export type Aliases = z.output<typeof aliasesSchema>;

// --- Corrections -------------------------------------------------------------

const text = z.string().min(1).nullable();
const positiveInt = z.number().int().positive().nullable();

/** Champs corrigeables (colonnes scalaires, plus les affiliations) et leur schéma de valeur. */
export const CORRECTABLE_FIELDS = {
  locations: { name_en: z.string().min(1), name_fr: text, sea: text, kind: text },
  sagas: { name_en: z.string().min(1), name_fr: text, chapter_start: positiveInt, chapter_end: positiveInt },
  arcs: { name_en: z.string().min(1), name_fr: text, chapter_start: positiveInt, chapter_end: positiveInt },
  devil_fruits: {
    name_romaji: z.string().min(1),
    name_en: text,
    name_fr: text,
    type: z.enum(['paramecia', 'zoan', 'logia']).nullable(),
    subtype: text,
  },
  crews: {
    name_en: z.string().min(1),
    name_fr: text,
    kind: z.enum(['pirate', 'marine', 'government', 'revolutionary', 'other']),
    is_yonko: z.boolean(),
  },
  characters: {
    name_en: z.string().min(1),
    name_fr: text,
    name_jp: text,
    epithet: text,
    status: z.enum(['alive', 'deceased', 'unknown']),
    age: z.number().int().nonnegative().nullable(),
    height_cm: positiveInt,
    debut_chapter: positiveInt,
    /** Relation : `{ crew: <slug>, is_current: true|false }`. */
    affiliations: z.strictObject({ crew: z.string().min(1), is_current: z.boolean() }),
  },
} satisfies Record<EntityName, Record<string, z.ZodType>>;

const correctionEntry = z
  .strictObject({
    entity: z.enum(ENTITY_NAMES as [EntityName, ...EntityName[]]),
    slug: z.string().min(1),
    field: z.string().min(1),
    value: z.unknown(),
    reason: z.string().min(1),
    /** Date de la correction (AAAA-MM-JJ) : sert de `fetched_at` dans la provenance. */
    date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date().transform((d) => d.toISOString().slice(0, 10))]),
  })
  .superRefine((c, ctx) => {
    const fields: Record<string, z.ZodType> = CORRECTABLE_FIELDS[c.entity];
    const schema = fields[c.field];
    if (!schema) {
      ctx.addIssue({
        code: 'custom',
        path: ['field'],
        message: `champ non corrigeable pour ${c.entity} (possibles : ${Object.keys(fields).join(', ')})`,
      });
      return;
    }
    const result = schema.safeParse(c.value);
    if (!result.success) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: result.error.issues.map((i) => i.message).join(' ; ') });
    }
  });
const correctionsSchema = z
  .array(correctionEntry)
  .nullish()
  .transform((c) => c ?? []);
export type Correction = z.output<typeof correctionEntry>;

// --- Chargement --------------------------------------------------------------

export interface ReconcileConfig {
  priority: FieldPriority;
  aliases: Aliases;
  corrections: Correction[];
}

async function readYaml<T extends z.ZodType>(file: string, schema: T): Promise<z.output<T>> {
  const text = await readFile(file, 'utf8');
  const result = schema.safeParse(parseYaml(text));
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.') || '(racine)'} : ${i.message}`).join('\n');
    throw new Error(`${file} invalide :\n${issues}`);
  }
  return result.data;
}

export async function loadReconcileConfig(
  dirs: { config: string; overrides: string } = { config: CONFIG_DIR, overrides: OVERRIDES_DIR },
): Promise<ReconcileConfig> {
  const [priority, aliases, corrections] = await Promise.all([
    readYaml(path.join(dirs.config, 'field-priority.yaml'), prioritySchema),
    readYaml(path.join(dirs.overrides, 'aliases.yaml'), aliasesSchema),
    readYaml(path.join(dirs.overrides, 'corrections.yaml'), correctionsSchema),
  ]);
  return { priority: priority as FieldPriority, aliases, corrections };
}
