import { z } from 'zod';
import {
  cleanText,
  parseAge,
  parseBounty,
  parseChapterRange,
  parseFruitType,
  parseHeightCm,
  parseVitalStatus,
} from './normalize.js';

/**
 * Schémas Zod des ressources d'api-onepiece.com v2 (structure relevée sur les réponses réelles,
 * voir fixtures/api-onepiece). Chaque schéma valide une entrée brute et la transforme en
 * enregistrement normalisé, stocké tel quel dans `staging.api_onepiece.data`.
 *
 * Volontairement non conservés : descriptions (licence inconnue) et URL d'images (aucun asset).
 */

export const API_ONEPIECE_SOURCE = 'api-onepiece';
export const API_ONEPIECE_BASE_URL = 'https://api.api-onepiece.com/v2';
export const API_ONEPIECE_LANGS = ['en', 'fr'] as const;
/** Ordre de collecte : référentiels d'abord, personnages en dernier. */
export const API_ONEPIECE_RESOURCES = ['sagas', 'arcs', 'locates', 'fruits', 'crews', 'characters'] as const;

export type ApiOnepieceLang = (typeof API_ONEPIECE_LANGS)[number];
export type ApiOnepieceResource = (typeof API_ONEPIECE_RESOURCES)[number];

export const apiOnepieceUrl = (resource: ApiOnepieceResource, lang: ApiOnepieceLang): string =>
  `${API_ONEPIECE_BASE_URL}/${resource}/${lang}`;

// --- Briques -------------------------------------------------------------

const apiId = z.number().int().positive();
const optionalText = z.string().nullish();
const requiredName = z
  .string()
  .transform((s) => cleanText(s))
  .refine((s): s is string => s !== null, 'nom vide');
const ref = z.object({ id: apiId }).nullish();
const refId = (r: { id: number } | null | undefined): string | null => (r ? String(r.id) : null);

/** Applique un normaliseur ; `undefined` (format inconnu) devient une erreur Zod. */
function normalized<T>(parse: (v: string | null | undefined) => T | undefined, label: string) {
  return optionalText.transform((value, ctx): T => {
    const result = parse(value);
    if (result === undefined) {
      ctx.addIssue({ code: 'custom', message: `${label} non reconnu(e) : ${JSON.stringify(value)}` });
      return z.NEVER;
    }
    return result;
  });
}

// --- Ressources ----------------------------------------------------------

export const sagaSchema = z
  .object({
    id: apiId,
    title: requiredName,
    saga_number: z.union([z.string(), z.number()]).transform((v, ctx) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n <= 0) {
        ctx.addIssue({ code: 'custom', message: `saga_number invalide : ${JSON.stringify(v)}` });
        return z.NEVER;
      }
      return n;
    }),
    saga_chapitre: normalized(parseChapterRange, 'plage de chapitres'),
  })
  .transform((s) => ({
    title: s.title,
    number: s.saga_number,
    chapterStart: s.saga_chapitre.start,
    chapterEnd: s.saga_chapitre.end,
  }));

export const arcSchema = z
  .object({ id: apiId, title: requiredName, saga: ref })
  .transform((a) => ({ title: a.title, sagaId: refId(a.saga) }));

export const locateSchema = z
  .object({
    id: apiId,
    name: requiredName,
    roman_name: optionalText,
    sea_name: optionalText,
    region_name: optionalText,
  })
  .transform((l) => ({
    name: l.name,
    romanName: cleanText(l.roman_name),
    sea: cleanText(l.sea_name),
    region: cleanText(l.region_name),
  }));

export const fruitSchema = z
  .object({
    id: apiId,
    name: requiredName,
    roman_name: optionalText,
    type: normalized(parseFruitType, 'type de fruit'),
  })
  .transform((f) => ({
    name: f.name,
    romanName: cleanText(f.roman_name),
    type: f.type.type,
    subtype: f.type.subtype,
  }));

export const crewSchema = z
  .object({
    id: apiId,
    name: requiredName,
    roman_name: optionalText,
    is_yonko: z.boolean().nullish(),
  })
  .transform((c) => ({
    name: c.name,
    romanName: cleanText(c.roman_name),
    isYonko: c.is_yonko ?? false,
  }));

export const characterSchema = z
  .object({
    id: apiId,
    name: requiredName,
    size: normalized(parseHeightCm, 'taille'),
    age: normalized(parseAge, 'âge'),
    bounty: normalized(parseBounty, 'prime'),
    job: optionalText,
    status: normalized(parseVitalStatus, 'statut'),
    crew: ref,
    fruit: ref,
  })
  .transform((c) => ({
    name: c.name,
    heightCm: c.size,
    age: c.age,
    bounty: c.bounty,
    job: cleanText(c.job),
    status: c.status,
    crewId: refId(c.crew),
    fruitId: refId(c.fruit),
  }));

export const apiOnepieceSchemas = {
  sagas: sagaSchema,
  arcs: arcSchema,
  locates: locateSchema,
  fruits: fruitSchema,
  crews: crewSchema,
  characters: characterSchema,
} satisfies Record<ApiOnepieceResource, z.ZodType>;

export type SagaRecord = z.output<typeof sagaSchema>;
export type ArcRecord = z.output<typeof arcSchema>;
export type LocateRecord = z.output<typeof locateSchema>;
export type FruitRecord = z.output<typeof fruitSchema>;
export type CrewRecord = z.output<typeof crewSchema>;
export type CharacterRecord = z.output<typeof characterSchema>;

export interface ApiOnepieceRecordMap {
  sagas: SagaRecord;
  arcs: ArcRecord;
  locates: LocateRecord;
  fruits: FruitRecord;
  crews: CrewRecord;
  characters: CharacterRecord;
}

// --- Parsing d'une réponse -----------------------------------------------

export interface ParsedRecord<T> {
  externalId: string;
  data: T;
}

export interface RejectedRecord {
  externalId: string;
  errors: { path: string; message: string }[];
}

export interface ParseResult<T> {
  records: ParsedRecord<T>[];
  rejections: RejectedRecord[];
}

/**
 * Parse le body d'une réponse liste. Une entrée invalide est rejetée sans bloquer le lot ;
 * un body qui n'est pas un tableau JSON lève une erreur (réponse inexploitable).
 */
export function parseApiOnepieceResponse<R extends ApiOnepieceResource>(
  resource: R,
  body: string,
): ParseResult<ApiOnepieceRecordMap[R]> {
  const json: unknown = JSON.parse(body);
  if (!Array.isArray(json)) throw new Error(`api-onepiece ${resource} : tableau JSON attendu`);

  // Le lien ressource → schéma est garanti par `satisfies` plus haut ; TS ne sait pas le corréler ici.
  const schema = apiOnepieceSchemas[resource] as unknown as z.ZodType<ApiOnepieceRecordMap[R]>;
  const records: ParsedRecord<ApiOnepieceRecordMap[R]>[] = [];
  const rejections: RejectedRecord[] = [];
  const seen = new Set<string>();

  json.forEach((entry: unknown, index) => {
    const rawId = typeof entry === 'object' && entry !== null ? (entry as { id?: unknown }).id : undefined;
    const externalId = typeof rawId === 'number' || typeof rawId === 'string' ? String(rawId) : `#${index}`;

    if (seen.has(externalId)) {
      rejections.push({ externalId: `${externalId}#${index}`, errors: [{ path: 'id', message: 'id en double dans la réponse' }] });
      return;
    }
    seen.add(externalId);

    const result = schema.safeParse(entry);
    if (result.success) {
      records.push({ externalId, data: result.data });
    } else {
      rejections.push({
        externalId,
        errors: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      });
    }
  });

  return { records, rejections };
}
