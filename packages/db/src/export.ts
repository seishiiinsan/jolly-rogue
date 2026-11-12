import { z } from 'zod';

/**
 * Format de `data/exports/canon.json`, consommé par le moteur et le back (docs/cadrage.md §9.6).
 * Références entre entités par slug ; listes triées par slug pour des diffs Git lisibles.
 * Toute rupture de format incrémente `CANON_EXPORT_SCHEMA_VERSION`.
 */
export const CANON_EXPORT_SCHEMA_VERSION = 1;

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const nullableText = z.string().nullable();
const nullableInt = z.number().int().nullable();

export const exportLocationSchema = z.object({
  slug,
  nameEn: z.string(),
  nameFr: nullableText,
  sea: nullableText,
  kind: nullableText,
});

export const exportSagaSchema = z.object({
  slug,
  nameEn: z.string(),
  nameFr: nullableText,
  chapterStart: nullableInt,
  chapterEnd: nullableInt,
  sortOrder: z.number().int(),
});

export const exportArcSchema = exportSagaSchema.extend({ saga: slug });

export const exportDevilFruitSchema = z.object({
  slug,
  nameRomaji: z.string(),
  nameEn: nullableText,
  nameFr: nullableText,
  type: z.enum(['paramecia', 'zoan', 'logia']).nullable(),
  subtype: nullableText,
});

export const exportCrewSchema = z.object({
  slug,
  nameEn: z.string(),
  nameFr: nullableText,
  kind: z.enum(['pirate', 'marine', 'government', 'revolutionary', 'other']),
  captain: slug.nullable(),
  isYonko: z.boolean(),
});

export const exportCharacterSchema = z.object({
  slug,
  nameEn: z.string(),
  nameFr: nullableText,
  nameJp: nullableText,
  epithet: nullableText,
  status: z.enum(['alive', 'deceased', 'unknown']),
  age: nullableInt,
  heightCm: nullableInt,
  originLocation: slug.nullable(),
  debutChapter: nullableInt,
  affiliations: z.array(z.object({ crew: slug, role: nullableText, isCurrent: z.boolean() })),
  devilFruits: z.array(z.object({ fruit: slug, isCurrent: z.boolean() })),
  bounties: z.array(
    z.object({ amountBerry: z.number().int().nonnegative(), asOfChapter: nullableInt, isCurrent: z.boolean() }),
  ),
  haki: z.array(z.enum(['observation', 'armament', 'conqueror'])),
});

export const canonExportSchema = z.object({
  schemaVersion: z.literal(CANON_EXPORT_SCHEMA_VERSION),
  sources: z.array(z.object({ name: z.string(), url: z.string(), license: nullableText })),
  locations: z.array(exportLocationSchema),
  sagas: z.array(exportSagaSchema),
  arcs: z.array(exportArcSchema),
  devilFruits: z.array(exportDevilFruitSchema),
  crews: z.array(exportCrewSchema),
  characters: z.array(exportCharacterSchema),
});

export type CanonExport = z.infer<typeof canonExportSchema>;
export type ExportCharacter = z.infer<typeof exportCharacterSchema>;
export type ExportCrew = z.infer<typeof exportCrewSchema>;
export type ExportDevilFruit = z.infer<typeof exportDevilFruitSchema>;
