import { z } from 'zod';
import { type RefIndex, cleanText, firstChapter, firstLinkTarget, splitForms, splitItems } from './clean.js';
import {
  type Bounty,
  type FruitClass,
  firstName,
  hakiFromCategories,
  parseBounties,
  parseFruitTypes,
  parseMaxAge,
  parseMaxHeightCm,
  parseMemberships,
  parseNames,
  parsePageRefs,
  parseStatus,
  text,
} from './values.js';

/**
 * Schémas Zod des infobox du One Piece Wiki. Paramètres relevés sur le wikitext réel
 * (Template:Char Box, Template:Devil Fruit Box, Template:Crew Box et fixtures/fandom).
 * Entrée : paramètres bruts de l'infobox ; sortie : enregistrement normalisé stocké dans
 * `staging.fandom.data`. Les paramètres de présentation (couleurs, images, doubleurs) sont ignorés.
 */

export const FANDOM_KINDS = ['character', 'devil_fruit', 'crew'] as const;
export type FandomKind = (typeof FANDOM_KINDS)[number];

/** Nom du template d'infobox de chaque kind. */
export const INFOBOX_TEMPLATES: Record<FandomKind, string> = {
  character: 'Char Box',
  devil_fruit: 'Devil Fruit Box',
  crew: 'Crew Box',
};

export interface InfoboxInput {
  title: string;
  params: Record<string, string>;
  categories: string[];
  refs: RefIndex;
}

const inputSchema = z.object({
  title: z.string().min(1),
  params: z.record(z.string(), z.string()),
  categories: z.array(z.string()),
  refs: z.custom<RefIndex>((v) => v instanceof Map),
});

type Ctx = z.core.$RefinementCtx;

/** Applique un normaliseur ; `undefined` (format inconnu) devient une issue Zod sur le paramètre. */
function read<T>(ctx: Ctx, params: Record<string, string>, key: string, parse: (raw: string | undefined) => T | undefined): T {
  const raw = params[key];
  const value = parse(raw);
  if (value === undefined) {
    const shown = cleanText(raw ?? '').slice(0, 120);
    ctx.addIssue({ code: 'custom', path: ['params', key], message: `format non reconnu : ${JSON.stringify(shown)}` });
    return undefined as T;
  }
  return value;
}

// --- Personnage --------------------------------------------------------------

export interface FandomFruitRef {
  name: string;
  page: string | null;
  nameEn: string | null;
  types: FruitClass[];
}

export const characterSchema = inputSchema.transform((input, ctx) => {
  const p = input.params;
  const fruits: FandomFruitRef[] = [];
  for (const suffix of ['', '2']) {
    const rawName = p[`dfname${suffix}`];
    const first = rawName === undefined ? undefined : splitItems(rawName)[0];
    if (first === undefined) continue;
    fruits.push({
      name: cleanText(first),
      page: firstLinkTarget(first),
      nameEn: firstName(p[`dfename${suffix}`]),
      types: read(ctx, p, `dftype${suffix}`, parseFruitTypes),
    });
  }

  const status = read(ctx, p, 'status', parseStatus);
  return {
    name: text(p['name']) ?? input.title,
    nameJp: text(p['jname']),
    // Défauts du template : rname et ename valent le titre de la page quand ils sont absents.
    nameRomaji: text(p['rname']) ?? input.title,
    nameEn: firstName(p['ename']) ?? input.title,
    birthName: firstName(p['birthname']),
    epithets: parseNames(p['epithet']),
    aliases: parseNames(p['alias']),
    status,
    // Mort : l'âge au décès est dans `age2`, `age` est alors en général absent.
    age: read(ctx, p, p['age2'] !== undefined && cleanText(p['age2']) !== '' ? 'age2' : 'age', parseMaxAge),
    heightCm: read(ctx, p, 'height', parseMaxHeightCm),
    birthday: text(p['birth']),
    debutChapter: firstChapter(p['first'] ?? ''),
    origin: text(p['origin']),
    originPage: firstLinkTarget(p['origin'] ?? ''),
    affiliations: parseMemberships(p['affiliation']),
    occupations: parseMemberships(p['occupation']),
    bounties: read(ctx, p, 'bounty', (raw) => parseBounties(raw, input.refs)) satisfies Bounty[],
    fruits,
    haki: hakiFromCategories(input.categories),
  };
});

// --- Fruit du démon ----------------------------------------------------------

/** Première forme (avant `----`) d'un paramètre de Devil Fruit Box. */
const firstForm = (raw: string | undefined): string | undefined => (raw === undefined ? undefined : splitForms(raw)[0]);

export const devilFruitSchema = inputSchema.transform((input, ctx) => {
  const p = input.params;
  const types = read(ctx, p, 'type', (raw) => {
    if (raw === undefined) return [];
    const all: FruitClass[] = [];
    for (const form of splitForms(raw)) {
      const parsed = parseFruitTypes(form);
      if (parsed === undefined) return undefined;
      all.push(...parsed.filter((c) => !all.some((a) => a.type === c.type && a.subtype === c.subtype)));
    }
    return all;
  });
  const titleItem = p['title'] === undefined ? undefined : splitItems(p['title'])[0];
  return {
    name: (titleItem === undefined ? null : cleanText(titleItem)) || input.title,
    nameJp: text(firstForm(p['jname'])),
    nameRomaji: text(firstForm(p['rname'])) ?? input.title,
    nameEn: firstName(firstForm(p['ename'])) ?? input.title,
    meaning: text(firstForm(p['meaning'])),
    types,
    /** Toutes les identités du fruit (Gomu Gomu no Mi / Hito Hito no Mi, Model: Nika). */
    // Vide pour un fruit à une seule identité.
    forms: (splitForms(p['rname'] ?? '').length > 1 ? splitForms(p['rname'] ?? '') : []).flatMap((r, i) => {
      const romaji = text(r);
      return romaji ? [{ nameRomaji: romaji, nameEn: firstName(splitForms(p['ename'] ?? '')[i]) }] : [];
    }),
    fruitDebutChapter: firstChapter(p['fruit'] ?? ''),
    usageDebutChapter: firstChapter(p['first'] ?? ''),
    users: parsePageRefs(p['user']),
    previousUsers: parsePageRefs(p['previous']),
  };
});

// --- Équipage ----------------------------------------------------------------

export const crewSchema = inputSchema.transform((input, ctx) => {
  const p = input.params;
  const bounties = read(ctx, p, 'bounty', (raw) => parseBounties(raw, input.refs, false));
  return {
    name: text(p['name']) ?? input.title,
    nameJp: text(p['jname']),
    nameRomaji: text(p['rname']),
    nameEn: firstName(p['ename']),
    debutChapter: firstChapter(p['first'] ?? ''),
    captains: parsePageRefs(p['captain']),
    status: text(p['status'])?.toLowerCase() ?? null,
    /** Prime totale actuelle (somme affichée par le wiki), `null` si aucune non barrée. */
    totalBounty: bounties?.find((b) => b.isCurrent)?.amount ?? null,
  };
});

export const fandomSchemas = {
  character: characterSchema,
  devil_fruit: devilFruitSchema,
  crew: crewSchema,
} satisfies Record<FandomKind, z.ZodType>;

export type FandomRecordMap = { [K in FandomKind]: z.output<(typeof fandomSchemas)[K]> };
export type FandomCharacter = FandomRecordMap['character'];
export type FandomDevilFruit = FandomRecordMap['devil_fruit'];
export type FandomCrew = FandomRecordMap['crew'];
