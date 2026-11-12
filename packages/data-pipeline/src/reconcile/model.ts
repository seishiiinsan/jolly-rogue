import type { ApiOnepiecePlan, ApiOnepieceStaging, FieldSource, PlannedEntity } from '../load/plan.js';
import { inferCrewKind } from '../load/plan.js';
import { API_ONEPIECE_SOURCE } from '../parse/api-onepiece.js';
import { FANDOM_LICENSE, FANDOM_SOURCE } from '../parse/fandom/api.js';
import type { FandomCharacter, FandomCrew, FandomDevilFruit, FandomKind, FandomRecordMap } from '../parse/fandom/schemas.js';
import { slugify } from '../slug.js';
import {
  type Correction,
  type EntityName,
  type MatchedEntity,
  OVERRIDE_SOURCE,
  type ReconcileConfig,
  type ReconcileSource,
} from './config.js';
import { type ApiCandidate, type FandomCandidate, type MatchResult, matchEntity } from './match.js';
import { nameKeys, normalizeName } from './names.js';

/**
 * Réconciliation staging → état canon souhaité, sans I/O et déterministe (docs/cadrage.md §9.4) :
 * rapprochement, priorité des sources par champ, corrections manuelles, slugs des nouvelles entités.
 * Réutilisée par `reconcile` (application en base) et par `report` (non-rapprochés, conflits…).
 */

// --- Entrées -----------------------------------------------------------------

export interface FandomRow<K extends FandomKind = FandomKind> {
  kind: K;
  pageId: number;
  title: string;
  sourceUrl: string;
  fetchedAt: Date;
  data: FandomRecordMap[K];
}

export interface ExistingState {
  externalIds: { entity: string; entityId: number; source: string; externalId: string }[];
  /** id → slug, par table canon. */
  slugs: Record<EntityName, Map<number, string>>;
}

export interface ReconcileInput {
  apiStaging: ApiOnepieceStaging;
  apiPlan: ApiOnepiecePlan;
  fandom: FandomRow[];
  existing: ExistingState;
  config: ReconcileConfig;
}

// --- Sorties -----------------------------------------------------------------

/** Clé d'entité dans le modèle : `characters/api-onepiece:12` ou `crews/fandom:345` (entité et source du groupe). */
export type Key = string;

export interface Provenance {
  source: string;
  sourceUrl: string;
  fetchedAt: Date;
  license: string | null;
}

export interface DesiredEntity {
  key: Key;
  canonId: number | null;
  slug: string;
  /** Slug souhaité ; diffère de `slug` après une collision ou pour une entité déjà publiée. */
  baseSlug: string;
  label: string;
  /** Colonnes scalaires (noms Drizzle, camelCase). */
  values: Record<string, unknown>;
  /** Clés étrangères vers d'autres entités du modèle (colonne Drizzle → clé). */
  refs: Record<string, Key | null>;
  externalIds: { source: string; externalId: string }[];
  /** Provenance par champ (snake_case, comme dans field-priority.yaml). */
  provenance: Record<string, Provenance>;
}

export interface DesiredRelations {
  affiliations: { character: Key; crew: Key; role: string | null; isCurrent: boolean }[];
  fruits: { character: Key; fruit: Key; isCurrent: boolean }[];
  bounties: { character: Key; amountBerry: number; asOfChapter: number | null; isCurrent: boolean }[];
  haki: { character: Key; kind: 'observation' | 'armament' | 'conqueror' }[];
  aliases: { character: Key; alias: string; kind: string }[];
}

export interface Conflict {
  entity: EntityName;
  slug: string;
  field: string;
  chosen: { source: string; value: string };
  others: { source: string; value: string }[];
}

export type ReconcileIssueKind =
  | 'invalid-value'
  | 'id-clash'
  | 'fruit-multiple-holders'
  | 'captain-ambiguous'
  | 'bounty-multiple-current';

export interface ReconcileIssue {
  kind: ReconcileIssueKind;
  entity: EntityName;
  label: string;
  detail: string;
}

export interface UnresolvedRef {
  field: string;
  target: string;
  count: number;
}

export interface AppliedCorrection extends Correction {
  previous: unknown;
}

export interface ReconcileModel {
  entities: Record<EntityName, DesiredEntity[]>;
  relations: DesiredRelations;
  matches: Record<MatchedEntity, MatchResult>;
  /** Libellé lisible d'une page Fandom ou d'un id api, par entité. */
  labels: Record<MatchedEntity, { api: Map<string, string>; fandom: Map<number, string> }>;
  conflicts: Conflict[];
  issues: ReconcileIssue[];
  unresolved: UnresolvedRef[];
  corrections: AppliedCorrection[];
}

// --- Utilitaires -------------------------------------------------------------

/** Libellé d'une entité pour le rapport : son nom s'il est connu, sinon sa clé. */
const labelOf = (name: unknown, fallback: string | number): string =>
  typeof name === 'string' && name !== '' ? name : String(fallback);

const apiKey = (entity: EntityName, id: string): Key => `${entity}/${API_ONEPIECE_SOURCE}:${id}`;
const fandomKey = (entity: EntityName, pageId: number): Key => `${entity}/${FANDOM_SOURCE}:${pageId}`;
const camel = (field: string): string => field.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const apiProv = (src: FieldSource | undefined): Provenance | undefined =>
  src && { source: API_ONEPIECE_SOURCE, sourceUrl: src.sourceUrl, fetchedAt: src.fetchedAt, license: null };
const fandomProv = (row: FandomRow): Provenance => ({
  source: FANDOM_SOURCE,
  sourceUrl: row.sourceUrl,
  fetchedAt: row.fetchedAt,
  license: FANDOM_LICENSE,
});

/** Contraintes CHECK de canon : une valeur qui les viole est ignorée (et signalée). */
const CONSTRAINTS: Record<string, (v: unknown) => boolean> = {
  age: (v) => typeof v === 'number' && v >= 0,
  height_cm: (v) => typeof v === 'number' && v > 0,
  debut_chapter: (v) => typeof v === 'number' && v > 0,
  chapter_start: (v) => typeof v === 'number' && v > 0,
  chapter_end: (v) => typeof v === 'number' && v > 0,
};

type Candidates<T> = Partial<Record<ReconcileSource, { value: T | null; prov: Provenance | undefined }>>;

const display = (value: unknown): string => (Array.isArray(value) ? value.join(', ') : String(value));

/** Égalité tolérante pour les conflits : textes comparés après normalisation. */
function sameValue(a: unknown, b: unknown): boolean {
  if (typeof a === 'string' && typeof b === 'string') return normalizeName(a) === normalizeName(b);
  return JSON.stringify(a) === JSON.stringify(b);
}

// --- Modèle ------------------------------------------------------------------

export function buildReconcileModel(input: ReconcileInput): ReconcileModel {
  const { apiPlan, config, existing } = input;
  const conflicts: Conflict[] = [];
  const issues: ReconcileIssue[] = [];
  const unresolved = new Map<string, UnresolvedRef>();
  const noteUnresolved = (field: string, target: string) => {
    const id = `${field}|${target}`;
    const entry = unresolved.get(id) ?? { field, target, count: 0 };
    entry.count++;
    unresolved.set(id, entry);
  };

  // Ids canon connus par (source, entité, id source).
  const knownIds = new Map<string, number>();
  for (const e of existing.externalIds) knownIds.set(`${e.source}|${e.entity}|${e.externalId}`, e.entityId);
  const known = (source: string, entity: EntityName, id: string): number | null =>
    knownIds.get(`${source}|${entity}|${id}`) ?? null;

  const fandomOf = <K extends FandomKind>(kind: K): FandomRow<K>[] =>
    input.fandom.filter((r): r is FandomRow<K> => r.kind === kind).sort((a, b) => a.pageId - b.pageId);
  const fandomRows = {
    devil_fruits: fandomOf('devil_fruit'),
    crews: fandomOf('crew'),
    characters: fandomOf('character'),
  };

  // Slugs : figés pour les entités existantes, attribués dans l'ordre pour les nouvelles.
  const taken: Record<EntityName, Set<string>> = Object.fromEntries(
    (Object.keys(existing.slugs) as EntityName[]).map((e) => [e, new Set(existing.slugs[e].values())]),
  ) as Record<EntityName, Set<string>>;
  const slugFor = (entity: EntityName, canonId: number | null, base: string, suffix: string, fallback: string): string => {
    if (canonId !== null) {
      const slug = existing.slugs[entity].get(canonId);
      if (slug === undefined) throw new Error(`${entity} ${canonId} référencé par external_ids mais introuvable`);
      return slug;
    }
    let slug = base === '' ? fallback : base;
    if (taken[entity].has(slug)) slug = `${slug}-${suffix}`;
    if (taken[entity].has(slug)) throw new Error(`${entity} : slug ${slug} déjà pris, ajoute un alias dans overrides/aliases.yaml`);
    taken[entity].add(slug);
    return slug;
  };

  /** Applique la priorité d'un champ : première source avec une valeur, conflits tracés. */
  const resolve = <T>(
    entity: EntityName,
    slug: string,
    field: string,
    candidates: Candidates<T>,
    differs: (a: T, b: T) => boolean = (a, b) => !sameValue(a, b),
    show: (v: T) => string = display,
  ): { value: T | null; prov: Provenance | undefined } => {
    const order = config.priority[entity][field as never] as ReconcileSource[];
    const check = CONSTRAINTS[field];
    const present = order.flatMap((source) => {
      const c = candidates[source];
      if (!c || c.value === null || (Array.isArray(c.value) && c.value.length === 0)) return [];
      if (check && !check(c.value)) {
        issues.push({ kind: 'invalid-value', entity, label: slug, detail: `${field} = ${display(c.value)} (${source}) hors contrainte : ignoré` });
        return [];
      }
      return [{ source, ...c }];
    });
    const [chosen, ...rest] = present;
    if (!chosen) return { value: null, prov: undefined };
    const others = rest.filter((o) => differs(chosen.value as T, o.value as T));
    if (others.length > 0) {
      conflicts.push({
        entity,
        slug,
        field,
        chosen: { source: chosen.source, value: show(chosen.value as T) },
        others: others.map((o) => ({ source: o.source, value: show(o.value as T) })),
      });
    }
    return { value: chosen.value, prov: chosen.prov };
  };

  // --- Rapprochement ------------------------------------------------------------

  const apiCrewRoman = new Map(input.apiStaging.crews.en.map((r) => [r.externalId, r.data.romanName]));
  const apiCandidates: Record<MatchedEntity, ApiCandidate[]> = {
    devil_fruits: apiPlan.devilFruits.map((p) => ({
      id: p.externalId,
      label: p.values.nameEn,
      keys: nameKeys([p.values.nameRomaji, p.values.nameEn]),
      canonId: known(API_ONEPIECE_SOURCE, 'devil_fruits', p.externalId),
      excluded: p.values.subtype === 'clone',
    })),
    crews: apiPlan.crews.map((p) => ({
      id: p.externalId,
      label: p.values.nameEn,
      keys: nameKeys([p.values.nameEn, p.values.nameEn.replace(/^the\s+/i, ''), apiCrewRoman.get(p.externalId)]),
      canonId: known(API_ONEPIECE_SOURCE, 'crews', p.externalId),
      excluded: false,
    })),
    characters: apiPlan.characters.map((p) => ({
      id: p.externalId,
      label: p.values.nameEn,
      // « Marchall D. Teach / Barbe Noire » : plusieurs noms séparés par une barre oblique.
      keys: nameKeys(p.values.nameEn.split(/\s+\/\s+/)),
      canonId: known(API_ONEPIECE_SOURCE, 'characters', p.externalId),
      excluded: false,
    })),
  };
  const fandomNames = {
    devil_fruits: (d: FandomDevilFruit, title: string) => [
      title,
      d.nameRomaji,
      d.nameEn,
      ...d.forms.flatMap((f) => [f.nameRomaji, f.nameEn]),
    ],
    crews: (d: FandomCrew, title: string) => [title, d.name, d.nameRomaji, d.nameEn],
    characters: (d: FandomCharacter, title: string) => [title, d.name, d.nameRomaji, d.nameEn],
  };
  const fandomCandidates = (entity: MatchedEntity): FandomCandidate[] =>
    fandomRows[entity].map((r) => ({
      pageId: r.pageId,
      title: r.title,
      titleKey: normalizeName(r.title),
      keys: nameKeys((fandomNames[entity] as (d: unknown, t: string) => (string | null)[])(r.data, r.title)),
      canonId: known(FANDOM_SOURCE, entity, String(r.pageId)),
    }));
  const fruitMatch = matchEntity('devil_fruits', apiCandidates.devil_fruits, fandomCandidates('devil_fruits'), config.aliases.devil_fruits);
  // Indice pour les personnages : même fruit du démon des deux côtés (« Jozu » / « Diamond Joz »).
  const fruitPageToApi = new Map<string, string>();
  for (const p of fruitMatch.pairs) {
    const title = fandomRows.devil_fruits.find((r) => r.pageId === p.fandom)?.title;
    if (title) fruitPageToApi.set(normalizeName(title), p.api);
  }
  const apiHoldersOf = new Map<string, string[]>();
  for (const c of apiPlan.characters) {
    if (c.fruit) apiHoldersOf.set(c.fruit.fruitExternalId, [...(apiHoldersOf.get(c.fruit.fruitExternalId) ?? []), c.externalId]);
  }
  const characterHints = new Map<number, string[]>();
  for (const r of fandomRows.characters) {
    const ids = r.data.fruits.flatMap((ref) => apiHoldersOf.get(fruitPageToApi.get(normalizeName(ref.page ?? ref.name)) ?? '') ?? []);
    if (ids.length > 0) characterHints.set(r.pageId, ids);
  }
  const matches = {
    devil_fruits: fruitMatch,
    crews: matchEntity('crews', apiCandidates.crews, fandomCandidates('crews'), config.aliases.crews),
    characters: matchEntity('characters', apiCandidates.characters, fandomCandidates('characters'), config.aliases.characters, characterHints),
  };
  const labels = Object.fromEntries(
    (['devil_fruits', 'crews', 'characters'] as const).map((e) => [
      e,
      {
        api: new Map(apiCandidates[e].map((a) => [a.id, a.label])),
        fandom: new Map(fandomRows[e].map((r) => [r.pageId, r.title])),
      },
    ]),
  ) as ReconcileModel['labels'];

  /** Groupes d'une entité rapprochée : api (+ Fandom) puis Fandom seul, avec leur clé. */
  interface Group<A, F extends FandomKind> {
    key: Key;
    api: A | undefined;
    fandom: FandomRow<F> | undefined;
  }
  const groupsOf = <A extends { externalId: string }, F extends FandomKind>(
    entity: MatchedEntity,
    planned: A[],
    rows: FandomRow<F>[],
  ): Group<A, F>[] => {
    const m = matches[entity];
    const rowById = new Map(rows.map((r) => [r.pageId, r]));
    const fandomOfApi = new Map(m.pairs.map((p) => [p.api, p.fandom]));
    const groups: Group<A, F>[] = planned.map((a) => {
      const pageId = fandomOfApi.get(a.externalId);
      return { key: apiKey(entity, a.externalId), api: a, fandom: pageId === undefined ? undefined : rowById.get(pageId) };
    });
    for (const f of m.fandomOnly) groups.push({ key: fandomKey(entity, f.pageId), api: undefined, fandom: rowById.get(f.pageId) });
    return groups;
  };

  /** Id canon d'un groupe ; deux ids différents (alias tardif) → on garde celui d'api-onepiece. */
  const claimedIds: Record<EntityName, Set<number>> = Object.fromEntries(
    (Object.keys(existing.slugs) as EntityName[]).map((e) => [e, new Set<number>()]),
  ) as Record<EntityName, Set<number>>;
  const canonIdOf = (entity: MatchedEntity, label: string, apiId: string | undefined, pageId: number | undefined): number | null => {
    const fromApi = apiId === undefined ? null : known(API_ONEPIECE_SOURCE, entity, apiId);
    const fromFandom = pageId === undefined ? null : known(FANDOM_SOURCE, entity, String(pageId));
    if (fromApi !== null && fromFandom !== null && fromApi !== fromFandom) {
      issues.push({
        kind: 'id-clash',
        entity,
        label,
        detail: `api-onepiece → ${existing.slugs[entity].get(fromApi)}, fandom → ${existing.slugs[entity].get(fromFandom)} : ` +
          `${existing.slugs[entity].get(fromApi)} conservé, l'autre entité n'a plus de source`,
      });
    }
    let id = fromApi ?? fromFandom;
    if (id !== null && claimedIds[entity].has(id)) id = null;
    if (id !== null) claimedIds[entity].add(id);
    return id;
  };
  const externalIdsOf = (apiId: string | undefined, pageId: number | undefined) => [
    ...(apiId === undefined ? [] : [{ source: API_ONEPIECE_SOURCE, externalId: apiId }]),
    ...(pageId === undefined ? [] : [{ source: FANDOM_SOURCE, externalId: String(pageId) }]),
  ];

  // --- Entités api-onepiece seules : lieux, sagas, arcs ---------------------------

  const single = <V extends object>(entity: EntityName, planned: PlannedEntity<V>[], refs?: (p: PlannedEntity<V>) => Record<string, Key | null>) =>
    planned.map((p): DesiredEntity => {
      const canonId = known(API_ONEPIECE_SOURCE, entity, p.externalId);
      const values = p.values as Record<string, unknown>;
      return {
        key: apiKey(entity, p.externalId),
        canonId,
        slug: slugFor(entity, canonId, p.baseSlug, p.externalId, `${entity.replace(/_/g, '-')}-${p.externalId}`),
        baseSlug: p.baseSlug,
        label: labelOf(values['nameEn'], p.externalId),
        values,
        refs: refs?.(p) ?? {},
        externalIds: externalIdsOf(p.externalId, undefined),
        provenance: Object.fromEntries(
          Object.entries(p.provenance).flatMap(([field, src]) => {
            const prov = apiProv(src);
            return prov ? [[field, prov]] : [];
          }),
        ),
      };
    });

  // Les entités existantes passent d'abord : un nouveau slug ne peut pas prendre celui d'une entité existante.
  const existingFirst = <T>(items: T[], isExisting: (t: T) => boolean): T[] => [
    ...items.filter(isExisting),
    ...items.filter((t) => !isExisting(t)),
  ];
  const plannedFirst = <V extends object, P extends PlannedEntity<V>>(entity: EntityName, planned: P[]): P[] =>
    existingFirst(planned, (p) => known(API_ONEPIECE_SOURCE, entity, p.externalId) !== null);

  const locations = single('locations', plannedFirst('locations', apiPlan.locations));
  const sagas = single('sagas', plannedFirst('sagas', apiPlan.sagas));
  const arcs = single('arcs', plannedFirst('arcs', apiPlan.arcs), (p) => ({
    sagaId: apiKey('sagas', (p as (typeof apiPlan.arcs)[number]).sagaExternalId),
  }));

  // --- Groupes rapprochés : slugs -------------------------------------------------

  const prepare = <A extends PlannedEntity<object>, F extends FandomKind>(entity: MatchedEntity, planned: A[], rows: FandomRow<F>[]) => {
    const groups = groupsOf<A, F>(entity, planned, rows).map((g) => ({
      ...g,
      canonId: canonIdOf(entity, g.api ? apiCandidates[entity].find((a) => a.id === g.api?.externalId)?.label ?? g.key : g.fandom?.title ?? g.key, g.api?.externalId, g.fandom?.pageId),
    }));
    return existingFirst(groups, (g) => g.canonId !== null).map((g) => ({
      ...g,
      baseSlug: g.api ? g.api.baseSlug : slugify(g.fandom?.title ?? ''),
      slug: slugFor(
        entity,
        g.canonId,
        g.api ? g.api.baseSlug : slugify(g.fandom?.title ?? ''),
        g.api ? g.api.externalId : String(g.fandom?.pageId),
        `${entity.replace(/_/g, '-')}-${g.api?.externalId ?? `f${g.fandom?.pageId}`}`,
      ),
    }));
  };
  const fruitGroups = prepare('devil_fruits', apiPlan.devilFruits, fandomRows.devil_fruits);
  const crewGroups = prepare('crews', apiPlan.crews, fandomRows.crews);
  const characterGroups = prepare('characters', apiPlan.characters, fandomRows.characters);

  // Index de résolution des références Fandom (liens de pages) vers les clés du modèle.
  const indexByTitle = <G extends { key: Key; fandom: FandomRow | undefined }>(groups: G[]) => {
    const map = new Map<string, Key>();
    for (const g of groups) if (g.fandom) map.set(normalizeName(g.fandom.title), g.key);
    return map;
  };
  const fruitByTitle = indexByTitle(fruitGroups);
  const fruitArtificial = new Map(fruitGroups.map((g) => [g.key, g.fandom?.data.types.some((t) => t.subtype === 'artificial') ?? false]));
  // Clones api-onepiece (« Clone of the Pawpaw Fruit ») par nom romanisé du fruit original.
  const cloneByName = new Map<string, Key>();
  for (const g of fruitGroups) {
    if (g.api?.values.subtype !== 'clone') continue;
    for (const k of nameKeys([g.api.values.nameRomaji])) cloneByName.set(k, g.key);
  }
  const crewByTitle = indexByTitle(crewGroups);
  // Repli : nom d'équipage connu d'api-onepiece seulement (Baroque Works, Cipher Pol…), s'il est unique.
  const crewByApiName = new Map<string, Key | null>();
  for (const g of crewGroups) {
    if (!g.api) continue;
    for (const k of apiCandidates.crews.find((a) => a.id === g.api?.externalId)?.keys ?? []) {
      crewByApiName.set(k, crewByApiName.has(k) && crewByApiName.get(k) !== g.key ? null : g.key);
    }
  }
  const characterByTitle = indexByTitle(characterGroups);
  const apiFruitKey = new Map(fruitGroups.flatMap((g) => (g.api ? [[g.api.externalId, g.key] as const] : [])));
  const apiCrewKey = new Map(crewGroups.flatMap((g) => (g.api ? [[g.api.externalId, g.key] as const] : [])));
  const apiCharacterKey = new Map(characterGroups.flatMap((g) => (g.api ? [[g.api.externalId, g.key] as const] : [])));
  const locationByName = new Map<string, Key | null>();
  for (const l of locations) {
    const k = normalizeName(String(l.values['nameEn']));
    locationByName.set(k, locationByName.has(k) ? null : l.key); // homonymes : non résolu
  }

  // --- Fruits ---------------------------------------------------------------------

  const devilFruits = fruitGroups.map((g): DesiredEntity => {
    const a = g.api?.values;
    const f = g.fandom?.data;
    const ap = g.api?.provenance ?? {};
    const fp = g.fandom ? fandomProv(g.fandom) : undefined;
    const field = <T>(name: string, api: T | null | undefined, fandom: T | null | undefined) =>
      resolve<T>('devil_fruits', g.slug, name, {
        ...(g.api ? { [API_ONEPIECE_SOURCE]: { value: api ?? null, prov: apiProv(ap[name]) } } : {}),
        ...(g.fandom ? { [FANDOM_SOURCE]: { value: fandom ?? null, prov: fp } } : {}),
      });
    const firstType = f?.types[0];
    const resolved = {
      name_romaji: field('name_romaji', a?.nameRomaji, f?.nameRomaji),
      name_en: field('name_en', a?.nameEn, f?.nameEn),
      name_fr: field('name_fr', a?.nameFr, null),
      type: field('type', a?.type, firstType?.type),
      subtype: field('subtype', a?.subtype, firstType?.subtype),
    };
    return entityOf(g, resolved, {}, (r) => ({
      nameRomaji: r.name_romaji ?? r.name_en ?? g.fandom?.title ?? '',
      nameEn: r.name_en,
      nameFr: r.name_fr,
      type: r.type,
      subtype: r.subtype,
    }));
  });

  // --- Personnages : valeurs et relations -----------------------------------------

  const relations: DesiredRelations = { affiliations: [], fruits: [], bounties: [], haki: [], aliases: [] };
  const fruitUsers = new Map<Key, { current: Set<string>; previous: Set<string> }>();
  for (const g of fruitGroups) {
    if (!g.fandom) continue;
    fruitUsers.set(g.key, {
      current: new Set(g.fandom.data.users.map((u) => normalizeName(u.page ?? u.name))),
      previous: new Set(g.fandom.data.previousUsers.map((u) => normalizeName(u.page ?? u.name))),
    });
  }
  const crewLabel = (key: Key): string => crewGroups.find((c) => c.key === key)?.slug ?? key;
  const fruitLabel = (key: Key): string => fruitGroups.find((c) => c.key === key)?.slug ?? key;

  const characters = characterGroups.map((g): DesiredEntity => {
    const a = g.api;
    const f = g.fandom?.data;
    const ap = a?.provenance ?? {};
    const fp = g.fandom ? fandomProv(g.fandom) : undefined;
    const cands = <T>(name: string, api: T | null | undefined, fandom: T | null | undefined, apiSrc?: FieldSource): Candidates<T> => ({
      ...(a ? { [API_ONEPIECE_SOURCE]: { value: api ?? null, prov: apiProv(apiSrc ?? ap[name]) } } : {}),
      ...(g.fandom ? { [FANDOM_SOURCE]: { value: fandom ?? null, prov: fp } } : {}),
    });
    const field = <T>(name: string, api: T | null | undefined, fandom: T | null | undefined) =>
      resolve<T>('characters', g.slug, name, cands(name, api, fandom));
    const vital = (s: string | null | undefined) => (s === 'unknown' ? null : s);

    // Origine : lien de l'infobox → lieu api-onepiece du même nom.
    let originKey: Key | null = null;
    // « East Blue (Foosha Village) » : le lieu le plus précis (entre parenthèses) d'abord.
    const originNames = [...(f?.origin?.match(/\(([^()]+)\)/g) ?? []).map((x) => x.slice(1, -1)).reverse(), f?.originPage, f?.origin]
      .filter((x): x is string => !!x);
    for (const name of originNames) {
      originKey = locationByName.get(normalizeName(name)) ?? null;
      if (originKey !== null) break;
    }
    if (originKey === null && originNames[0]) noteUnresolved('characters.origin_location_id', originNames[0]);

    const resolved = {
      name_en: field('name_en', a?.values.nameEn, f?.nameEn),
      name_fr: field('name_fr', a?.values.nameFr, null),
      name_jp: field('name_jp', null, f?.nameJp),
      epithet: field('epithet', null, f?.epithets[0]),
      status: field('status', vital(a?.values.status), vital(f?.status)),
      age: field('age', a?.values.age, f?.age),
      height_cm: field('height_cm', a?.values.heightCm, f?.heightCm),
      origin_location_id: field('origin_location_id', null, originKey),
      debut_chapter: field('debut_chapter', null, f?.debutChapter),
    };

    // Affiliations
    type Aff = { crew: Key; role: string | null; isCurrent: boolean };
    const apiAffs: Aff[] = [];
    if (a?.affiliation) {
      const crew = apiCrewKey.get(a.affiliation.crewExternalId);
      if (crew) apiAffs.push({ crew, role: a.affiliation.role, isCurrent: true });
    }
    const fandomAffs: Aff[] = [];
    for (const m of f?.affiliations ?? []) {
      const target = normalizeName(m.page ?? m.name);
      const crew = crewByTitle.get(target) ?? crewByApiName.get(target);
      if (!crew) {
        noteUnresolved('characters.affiliations', m.page ?? m.name);
        continue;
      }
      // Le rôle (métier) n'est connu que d'api-onepiece : repris s'il s'agit du même équipage.
      const role = apiAffs.find((x) => x.crew === crew)?.role ?? null;
      const same = fandomAffs.find((x) => x.crew === crew && x.role === role);
      if (same) same.isCurrent ||= m.isCurrent;
      else fandomAffs.push({ crew, role, isCurrent: m.isCurrent });
    }
    const affs = resolve<Aff[]>(
      'characters',
      g.slug,
      'affiliations',
      cands('affiliations', apiAffs, fandomAffs, a?.affiliation?.source),
      (chosen, other) => other.some((o) => o.isCurrent && !chosen.some((c) => c.crew === o.crew && c.isCurrent)),
      (v) => v.filter((x) => x.isCurrent).map((x) => crewLabel(x.crew)).join(', ') || '(aucune actuelle)',
    );

    // Fruits : porteur actuel d'après la page du fruit (utilisateurs / anciens), sinon le statut.
    type Fr = { fruit: Key; isCurrent: boolean };
    const deceased = resolved.status.value === 'deceased';
    const apiFruits: Fr[] = [];
    if (a?.fruit) {
      const fruit = apiFruitKey.get(a.fruit.fruitExternalId);
      if (fruit) apiFruits.push({ fruit, isCurrent: a.fruit.isCurrent && !deceased });
    }
    const fandomFruits: Fr[] = [];
    for (const ref of f?.fruits ?? []) {
      const target = normalizeName(ref.page ?? ref.name);
      let fruit = fruitByTitle.get(target);
      if (!fruit) {
        noteUnresolved('characters.devil_fruits', ref.page ?? ref.name);
        continue;
      }
      // Copie artificielle (Seraphim, « Nikyu Nikyu no Mi (Artificial) ») : le clone api-onepiece
      // s'il existe, sinon le fruit original mais jamais comme porteur actuel (c'est l'original qui l'est).
      // Repère : « (Artificial) » dans le nom (parfois mal orthographié sur le wiki) ou type
      // « artificial » alors que la page du fruit ne l'est pas.
      const pageArtificial = fruitArtificial.get(fruit) ?? false;
      const artificial = /\(artifi?c?ial\)/i.test(ref.name) || (!pageArtificial && ref.types.some((t) => t.subtype === 'artificial'));
      if (artificial) fruit = cloneByName.get(target) ?? fruit;
      if (fandomFruits.some((x) => x.fruit === fruit)) continue;
      const users = fruitUsers.get(fruit);
      const me = normalizeName(g.fandom?.title ?? '');
      const listed = users && (users.current.has(me) || users.previous.has(me));
      const isCurrent = !deceased && !(artificial && fruitByTitle.get(target) === fruit) && (listed ? (users?.current.has(me) ?? false) : true);
      fandomFruits.push({ fruit, isCurrent });
    }
    const fruits = resolve<Fr[]>(
      'characters',
      g.slug,
      'devil_fruits',
      cands('devil_fruits', apiFruits, fandomFruits, a?.fruit?.source),
      (chosen, other) => other.some((o) => !chosen.some((c) => c.fruit === o.fruit)),
      (v) => v.map((x) => fruitLabel(x.fruit)).join(', '),
    );

    // Primes : historique Fandom (montants connus) ; prime actuelle unique.
    type Bt = { amountBerry: number; asOfChapter: number | null; isCurrent: boolean };
    const apiBounties: Bt[] = a?.bounty ? [{ amountBerry: a.bounty.amountBerry, asOfChapter: null, isCurrent: true }] : [];
    const fandomBounties: Bt[] = [];
    for (const b of f?.bounties ?? []) {
      if (b.amount === null) continue;
      const same = fandomBounties.find((x) => x.amountBerry === b.amount);
      if (same) {
        same.isCurrent ||= b.isCurrent;
        same.asOfChapter ??= b.chapter && b.chapter > 0 ? b.chapter : null;
      } else fandomBounties.push({ amountBerry: b.amount, asOfChapter: b.chapter && b.chapter > 0 ? b.chapter : null, isCurrent: b.isCurrent });
    }
    const currentOf = (v: Bt[]) => v.find((x) => x.isCurrent)?.amountBerry ?? null;
    const bounties = resolve<Bt[]>(
      'characters',
      g.slug,
      'bounties',
      cands('bounties', apiBounties, fandomBounties, a?.bounty?.source),
      (chosen, other) => currentOf(other) !== null && currentOf(other) !== currentOf(chosen),
      (v) => currentOf(v)?.toString() ?? '(aucune actuelle)',
    );
    const currents = (bounties.value ?? []).filter((b) => b.isCurrent);
    if (currents.length > 1) {
      issues.push({
        kind: 'bounty-multiple-current',
        entity: 'characters',
        label: g.slug,
        detail: `primes actuelles : ${currents.map((b) => b.amountBerry).join(', ')} → la plus élevée est retenue`,
      });
      const max = Math.max(...currents.map((b) => b.amountBerry));
      for (const b of currents) b.isCurrent = b.amountBerry === max;
    }

    const hakiList = resolve('characters', g.slug, 'haki', cands('haki', null, f?.haki ?? []));

    for (const x of affs.value ?? []) relations.affiliations.push({ character: g.key, ...x });
    for (const x of fruits.value ?? []) relations.fruits.push({ character: g.key, ...x });
    for (const x of bounties.value ?? []) relations.bounties.push({ character: g.key, ...x });
    for (const kind of hakiList.value ?? []) relations.haki.push({ character: g.key, kind });

    // Alias : tous les noms connus (rapprochement futur, recherche), sans priorité.
    const aliasRows = new Map<string, { alias: string; kind: string }>();
    const addAlias = (alias: string | null | undefined, kind: string) => {
      if (alias && alias.trim() !== '') aliasRows.set(`${kind}|${alias}`, { alias: alias.trim(), kind });
    };
    if (a) for (const n of a.values.nameEn.split(/\s+\/\s+/)) addAlias(n, 'api_name');
    if (a?.values.nameFr) addAlias(a.values.nameFr, 'api_name_fr');
    if (f) {
      addAlias(g.fandom?.title, 'fandom_title');
      addAlias(f.nameRomaji, 'romaji');
      addAlias(f.nameJp, 'japanese');
      addAlias(f.birthName, 'birth_name');
      for (const e of f.epithets) addAlias(e, 'epithet');
      for (const x of f.aliases) addAlias(x, 'alias');
    }
    for (const x of [...aliasRows.values()].sort((p, q) => (p.kind + p.alias < q.kind + q.alias ? -1 : 1))) {
      relations.aliases.push({ character: g.key, ...x });
    }

    const entity = entityOf(g, resolved, { originLocationId: resolved.origin_location_id.value }, (r) => ({
      nameEn: r.name_en ?? g.fandom?.title ?? '',
      nameFr: r.name_fr,
      nameJp: r.name_jp,
      epithet: r.epithet,
      status: r.status ?? 'unknown',
      age: r.age,
      heightCm: r.height_cm,
      debutChapter: r.debut_chapter,
    }));
    for (const [name, r] of [
      ['affiliations', affs],
      ['devil_fruits', fruits],
      ['bounties', bounties],
      ['haki', hakiList],
    ] as const) {
      if (r.prov) entity.provenance[name] = r.prov;
    }
    return entity;
  });

  // Un fruit n'a qu'un porteur actuel : plusieurs → aucun (à trancher dans le rapport).
  const holders = new Map<Key, string[]>();
  for (const r of relations.fruits) if (r.isCurrent) holders.set(r.fruit, [...(holders.get(r.fruit) ?? []), r.character]);
  const slugOfCharacter = new Map(characters.map((c) => [c.key, c.slug]));
  for (const [fruit, keys] of holders) {
    if (keys.length < 2) continue;
    issues.push({
      kind: 'fruit-multiple-holders',
      entity: 'devil_fruits',
      label: fruitLabel(fruit),
      detail: `porteurs actuels : ${keys.map((k) => slugOfCharacter.get(k)).join(', ')} → aucun marqué actuel`,
    });
    for (const r of relations.fruits) if (r.fruit === fruit) r.isCurrent = false;
  }

  // --- Équipages (après les personnages : capitaines) -------------------------------

  const crews = crewGroups.map((g): DesiredEntity => {
    const a = g.api;
    const f = g.fandom?.data;
    const ap = a?.provenance ?? {};
    const fp = g.fandom ? fandomProv(g.fandom) : undefined;
    const field = <T>(name: string, api: T | null | undefined, fandom: T | null | undefined, apiSrc?: FieldSource) =>
      resolve<T>('crews', g.slug, name, {
        ...(a ? { [API_ONEPIECE_SOURCE]: { value: api ?? null, prov: apiProv(apiSrc ?? ap[name]) } } : {}),
        ...(g.fandom ? { [FANDOM_SOURCE]: { value: fandom ?? null, prov: fp } } : {}),
      });

    let fandomCaptain: Key | null = null;
    if (f) {
      const found = [...new Set(f.captains.flatMap((c) => {
        const key = characterByTitle.get(normalizeName(c.page ?? c.name));
        if (!key) noteUnresolved('crews.captain_id', c.page ?? c.name);
        return key ? [key] : [];
      }))];
      if (found.length > 1) {
        issues.push({
          kind: 'captain-ambiguous',
          entity: 'crews',
          label: g.slug,
          detail: `plusieurs capitaines Fandom : ${found.map((k) => slugOfCharacter.get(k)).join(', ')} → non retenu`,
        });
      } else fandomCaptain = found[0] ?? null;
    }
    const apiCaptain = a?.captainExternalId ? (apiCharacterKey.get(a.captainExternalId) ?? null) : null;
    const apiKind = a ? (inferCrewKind(a.values.nameEn, a.values.nameFr) ?? null) : null;
    const fandomKind = f ? (inferCrewKind(f.nameEn ?? f.name, null) ?? null) : null;
    const resolved = {
      name_en: field('name_en', a?.values.nameEn, f?.nameEn ?? f?.name),
      name_fr: field('name_fr', a?.values.nameFr, null),
      kind: field('kind', apiKind, fandomKind),
      is_yonko: field('is_yonko', a?.values.isYonko, null),
      captain_id: resolve<Key>(
        'crews',
        g.slug,
        'captain_id',
        {
          ...(a ? { [API_ONEPIECE_SOURCE]: { value: apiCaptain, prov: apiProv(ap['captain_id']) } } : {}),
          ...(g.fandom ? { [FANDOM_SOURCE]: { value: fandomCaptain, prov: fp } } : {}),
        },
        (x, y) => x !== y,
        (k) => slugOfCharacter.get(k) ?? k,
      ),
    };
    return entityOf(g, resolved, { captainId: resolved.captain_id.value }, (r) => ({
      nameEn: r.name_en ?? g.fandom?.title ?? '',
      nameFr: r.name_fr,
      kind: r.kind ?? 'other',
      isYonko: r.is_yonko ?? false,
    }));
  });

  // --- Corrections manuelles (en dernier) ------------------------------------------

  const entities: Record<EntityName, DesiredEntity[]> = { locations, sagas, arcs, devil_fruits: devilFruits, crews, characters };
  const corrections: AppliedCorrection[] = [];
  for (const c of config.corrections) {
    const target = entities[c.entity].find((e) => e.slug === c.slug);
    if (!target) throw new Error(`overrides/corrections.yaml : ${c.entity} « ${c.slug} » introuvable`);
    if (c.field === 'affiliations') {
      // Relation : statut « actuel » d'une affiliation (ajoutée si absente des sources).
      const v = c.value as { crew: string; is_current: boolean };
      const crew = crews.find((x) => x.slug === v.crew);
      if (!crew) throw new Error(`overrides/corrections.yaml : équipage « ${v.crew} » introuvable (${c.slug})`);
      const rows = relations.affiliations.filter((x) => x.character === target.key && x.crew === crew.key);
      corrections.push({ ...c, previous: rows.length === 0 ? null : { crew: v.crew, is_current: rows.some((x) => x.isCurrent) } });
      if (rows.length === 0) relations.affiliations.push({ character: target.key, crew: crew.key, role: null, isCurrent: v.is_current });
      for (const x of rows) x.isCurrent = v.is_current;
    } else {
      const column = camel(c.field);
      corrections.push({ ...c, previous: target.values[column] ?? null });
      target.values[column] = c.value;
    }
    target.provenance[c.field] = {
      source: OVERRIDE_SOURCE,
      sourceUrl: 'packages/data-pipeline/overrides/corrections.yaml',
      fetchedAt: new Date(`${c.date}T00:00:00.000Z`),
      license: null,
    };
    // La valeur corrigée remplace celle des sources : plus un conflit à trancher.
    const i = conflicts.findIndex((x) => x.entity === c.entity && x.slug === c.slug && x.field === c.field);
    if (i >= 0) conflicts.splice(i, 1);
  }

  return {
    entities,
    relations,
    matches,
    labels,
    conflicts,
    issues,
    unresolved: [...unresolved.values()].sort((x, y) => y.count - x.count || (x.field + x.target < y.field + y.target ? -1 : 1)),
    corrections,
  };

  function entityOf<R extends Record<string, { value: unknown; prov: Provenance | undefined }>>(
    g: { key: Key; slug: string; baseSlug: string; canonId: number | null; api: { externalId: string } | undefined; fandom: FandomRow | undefined },
    resolved: R,
    refs: Record<string, Key | null>,
    build: (values: { [K in keyof R]: R[K]['value'] }) => Record<string, unknown>,
  ): DesiredEntity {
    const values = Object.fromEntries(Object.entries(resolved).map(([k, v]) => [k, v.value])) as { [K in keyof R]: R[K]['value'] };
    const provenance: Record<string, Provenance> = {};
    for (const [k, v] of Object.entries(resolved)) if (v.prov && v.value !== null) provenance[k] = v.prov;
    return {
      key: g.key,
      canonId: g.canonId,
      slug: g.slug,
      baseSlug: g.baseSlug,
      label: g.fandom?.title ?? labelOf(build(values)['nameEn'], g.key),
      values: build(values),
      refs,
      externalIds: externalIdsOf(g.api?.externalId, g.fandom?.pageId),
      provenance,
    };
  }
}

