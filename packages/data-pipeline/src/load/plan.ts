import type {
  ApiOnepieceLang,
  ApiOnepieceRecordMap,
  ApiOnepieceResource,
  CharacterRecord,
  CrewRecord,
  FruitRecord,
} from '../parse/api-onepiece.js';
import { slugify } from '../slug.js';

/**
 * Planification pure staging → canon pour api-onepiece : aucune I/O, entièrement déterministe.
 * Réutilisée par `ingest` (application en base) et par `report` (liste des anomalies).
 */

export interface StagingRow<T> {
  externalId: string;
  data: T;
  sourceUrl: string;
  fetchedAt: Date;
}

export type ApiOnepieceStaging = {
  [R in ApiOnepieceResource]: Record<ApiOnepieceLang, StagingRow<ApiOnepieceRecordMap[R]>[]>;
};

export interface FieldSource {
  sourceUrl: string;
  fetchedAt: Date;
}

export interface PlannedEntity<V> {
  externalId: string;
  /** Slug souhaité ; le slug réel est figé à la création (suffixe `-{id}` en cas de collision). */
  baseSlug: string;
  values: V;
  /** Provenance par colonne SQL (`name_fr`, `status`…), seulement pour les valeurs non nulles. */
  provenance: Record<string, FieldSource>;
}

export type IssueKind =
  | 'missing-translation'
  | 'orphan-translation'
  | 'missing-reference'
  | 'duplicate-sort-order'
  | 'crew-kind-default'
  | 'captain-ambiguous'
  | 'fruit-clone-unresolved'
  | 'fruit-romaji-fallback'
  | 'fruit-multiple-holders'
  | 'empty-slug';

export interface PlanIssue {
  kind: IssueKind;
  entity: string;
  externalId: string;
  label: string;
  detail: string;
}

type Vital = CharacterRecord['status'];
type CrewKind = 'pirate' | 'marine' | 'government' | 'revolutionary' | 'other';

export interface LocationValues {
  nameEn: string;
  nameFr: string | null;
  sea: string | null;
  kind: string | null;
}
export interface SagaValues {
  nameEn: string;
  nameFr: string | null;
  chapterStart: number | null;
  chapterEnd: number | null;
  sortOrder: number;
}
export interface ArcValues {
  nameEn: string;
  nameFr: string | null;
  chapterStart: number | null;
  chapterEnd: number | null;
  sortOrder: number;
}
export interface FruitValues {
  nameRomaji: string;
  nameEn: string;
  nameFr: string | null;
  type: FruitRecord['type'];
  subtype: string | null;
}
export interface CrewValues {
  nameEn: string;
  nameFr: string | null;
  kind: CrewKind;
  isYonko: boolean;
}
export interface CharacterValues {
  nameEn: string;
  nameFr: string | null;
  status: Vital;
  age: number | null;
  heightCm: number | null;
}

export interface PlannedArc extends PlannedEntity<ArcValues> {
  sagaExternalId: string;
}
export interface PlannedCrew extends PlannedEntity<CrewValues> {
  captainExternalId: string | null;
}
export interface PlannedCharacter extends PlannedEntity<CharacterValues> {
  affiliation: { crewExternalId: string; role: string | null; source: FieldSource } | null;
  fruit: { fruitExternalId: string; isCurrent: boolean; source: FieldSource } | null;
  bounty: { amountBerry: number; source: FieldSource } | null;
}

export interface ApiOnepiecePlan {
  locations: PlannedEntity<LocationValues>[];
  sagas: PlannedEntity<SagaValues>[];
  arcs: PlannedArc[];
  devilFruits: PlannedEntity<FruitValues>[];
  crews: PlannedCrew[];
  characters: PlannedCharacter[];
  issues: PlanIssue[];
}

// --- Règles ----------------------------------------------------------------

/** Type d'équipage déduit du nom (l'API ne le fournit pas). Non reconnu → `other`, listé au rapport. */
export function inferCrewKind(nameEn: string, nameFr: string | null): CrewKind | undefined {
  const names = [nameEn, nameFr ?? ''].join(' | ');
  if (/\bmarines?\b/i.test(names)) return 'marine';
  if (/\b(crew|pirates?|armada|fleet|flotte)\b|équipage/i.test(names)) return 'pirate';
  return undefined;
}

const CAPTAIN_JOB = /^(captain|capitaine)$/i;

const byNumericId = <T extends { externalId: string }>(a: T, b: T): number =>
  Number(a.externalId) - Number(b.externalId) || (a.externalId < b.externalId ? -1 : a.externalId > b.externalId ? 1 : 0);

const source = (row: StagingRow<unknown>): FieldSource => ({ sourceUrl: row.sourceUrl, fetchedAt: row.fetchedAt });

/** Associe chaque ligne EN à sa traduction FR (l'EN est la base : il porte les données non traduites). */
function pairLangs<T>(
  entity: string,
  rows: Record<ApiOnepieceLang, StagingRow<T>[]>,
  labelOf: (data: T) => string,
  issues: PlanIssue[],
): { en: StagingRow<T>; fr: StagingRow<T> | undefined }[] {
  const fr = new Map(rows.fr.map((r) => [r.externalId, r]));
  const enIds = new Set(rows.en.map((r) => r.externalId));
  for (const row of [...rows.fr].sort(byNumericId)) {
    if (!enIds.has(row.externalId)) {
      issues.push({
        kind: 'orphan-translation',
        entity,
        externalId: row.externalId,
        label: labelOf(row.data),
        detail: 'présent en FR mais absent (ou rejeté) en EN : ignoré',
      });
    }
  }
  return [...rows.en].sort(byNumericId).map((en) => {
    const match = fr.get(en.externalId);
    if (!match) {
      issues.push({
        kind: 'missing-translation',
        entity,
        externalId: en.externalId,
        label: labelOf(en.data),
        detail: 'absent (ou rejeté) en FR : name_fr vide',
      });
    }
    return { en, fr: match };
  });
}

/** Provenance des colonnes non nulles ; `name_fr` vient de la réponse FR, le reste de la réponse EN. */
function provenanceOf(values: object, en: StagingRow<unknown>, fr: StagingRow<unknown> | undefined): Record<string, FieldSource> {
  const result: Record<string, FieldSource> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === null) continue;
    const column = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[column] = source(column === 'name_fr' && fr ? fr : en);
  }
  return result;
}

function checkSlug(entity: string, externalId: string, label: string, base: string, issues: PlanIssue[]): string {
  if (base !== '') return base;
  issues.push({ kind: 'empty-slug', entity, externalId, label, detail: `slug vide, remplacé par ${entity}-${externalId}` });
  return `${entity.replace(/_/g, '-')}-${externalId}`;
}

// --- Plan ------------------------------------------------------------------

export function planApiOnepiece(staging: ApiOnepieceStaging): ApiOnepiecePlan {
  const issues: PlanIssue[] = [];

  // Lieux
  const locations = pairLangs('locations', staging.locates, (d) => d.name, issues).map(({ en, fr }) => {
    const values: LocationValues = { nameEn: en.data.name, nameFr: fr?.data.name ?? null, sea: en.data.sea, kind: null };
    return {
      externalId: en.externalId,
      baseSlug: checkSlug('locations', en.externalId, en.data.name, slugify(en.data.romanName ?? en.data.name), issues),
      values,
      provenance: provenanceOf(values, en, fr),
    };
  });

  // Sagas
  const sagas: PlannedEntity<SagaValues>[] = [];
  const sagaOrders = new Set<number>();
  for (const { en, fr } of pairLangs('sagas', staging.sagas, (d) => d.title, issues)) {
    if (sagaOrders.has(en.data.number)) {
      issues.push({
        kind: 'duplicate-sort-order',
        entity: 'sagas',
        externalId: en.externalId,
        label: en.data.title,
        detail: `numéro de saga ${en.data.number} déjà utilisé : ignorée`,
      });
      continue;
    }
    sagaOrders.add(en.data.number);
    const values: SagaValues = {
      nameEn: en.data.title,
      nameFr: fr?.data.title ?? null,
      chapterStart: en.data.chapterStart,
      chapterEnd: en.data.chapterEnd,
      sortOrder: en.data.number,
    };
    sagas.push({
      externalId: en.externalId,
      baseSlug: checkSlug('sagas', en.externalId, en.data.title, slugify(en.data.title), issues),
      values,
      provenance: provenanceOf(values, en, fr),
    });
  }
  const sagaIds = new Set(sagas.map((s) => s.externalId));

  // Arcs (l'API ne donne pas de chapitres ; ordre = id API, chronologique)
  const arcs: PlannedArc[] = [];
  for (const { en, fr } of pairLangs('arcs', staging.arcs, (d) => d.title, issues)) {
    const sagaExternalId = en.data.sagaId;
    if (sagaExternalId === null || !sagaIds.has(sagaExternalId)) {
      issues.push({
        kind: 'missing-reference',
        entity: 'arcs',
        externalId: en.externalId,
        label: en.data.title,
        detail: `saga ${sagaExternalId ?? '(aucune)'} inconnue : arc ignoré`,
      });
      continue;
    }
    const values: ArcValues = {
      nameEn: en.data.title,
      nameFr: fr?.data.title ?? null,
      chapterStart: null,
      chapterEnd: null,
      sortOrder: Number(en.externalId),
    };
    arcs.push({
      externalId: en.externalId,
      baseSlug: checkSlug('arcs', en.externalId, en.data.title, slugify(en.data.title), issues),
      values,
      provenance: provenanceOf(values, en, fr),
      sagaExternalId,
    });
  }

  // Fruits
  const fruitPairs = pairLangs('devil_fruits', staging.fruits, (d) => d.name, issues);
  const originalTypeByRoman = new Map<string, FruitRecord['type']>();
  for (const { en } of fruitPairs) {
    if (en.data.subtype !== 'clone' && en.data.romanName && en.data.type) {
      // Rapprochement sur le nom slugifié : « Supā Supā no Mi » et « Supa Supa no Mi » sont le même fruit.
      const key = slugify(en.data.romanName);
      if (!originalTypeByRoman.has(key)) originalTypeByRoman.set(key, en.data.type);
    }
  }
  const devilFruits = fruitPairs.map(({ en, fr }) => {
    const d = en.data;
    let type = d.type;
    if (d.subtype === 'clone') {
      type = d.romanName ? (originalTypeByRoman.get(slugify(d.romanName)) ?? null) : null;
      if (type === null) {
        issues.push({
          kind: 'fruit-clone-unresolved',
          entity: 'devil_fruits',
          externalId: en.externalId,
          label: d.name,
          detail: `fruit original « ${d.romanName ?? '?'} » introuvable : type laissé vide`,
        });
      }
    }
    if (d.romanName === null) {
      issues.push({
        kind: 'fruit-romaji-fallback',
        entity: 'devil_fruits',
        externalId: en.externalId,
        label: d.name,
        detail: 'pas de nom romanisé : name_romaji = nom EN',
      });
    }
    const values: FruitValues = {
      nameRomaji: d.romanName ?? d.name,
      nameEn: d.name,
      nameFr: fr?.data.name ?? null,
      type,
      subtype: d.subtype,
    };
    const slugBase = slugify(d.romanName ?? d.name) + (d.subtype === 'clone' ? '-clone' : '');
    return {
      externalId: en.externalId,
      baseSlug: checkSlug('devil_fruits', en.externalId, d.name, slugBase, issues),
      values,
      provenance: provenanceOf(values, en, fr),
    };
  });
  const fruitIds = new Set(devilFruits.map((f) => f.externalId));

  // Personnages (avant les équipages : les capitaines en dépendent)
  const characterPairs = pairLangs('characters', staging.characters, (d) => d.name, issues);
  const crewIds = new Set(staging.crews.en.map((c) => c.externalId));

  // Porteurs actuels : décédé → non actuel ; plusieurs porteurs vivants → aucun actuel (rapport).
  const livingHolders = new Map<string, StagingRow<CharacterRecord>[]>();
  for (const { en } of characterPairs) {
    const fruitId = en.data.fruitId;
    if (fruitId === null || !fruitIds.has(fruitId) || en.data.status === 'deceased') continue;
    livingHolders.set(fruitId, [...(livingHolders.get(fruitId) ?? []), en]);
  }
  for (const [fruitId, holders] of [...livingHolders].sort(([a], [b]) => Number(a) - Number(b))) {
    if (holders.length < 2) continue;
    const fruit = devilFruits.find((f) => f.externalId === fruitId);
    issues.push({
      kind: 'fruit-multiple-holders',
      entity: 'devil_fruits',
      externalId: fruitId,
      label: fruit?.values.nameEn ?? fruitId,
      detail: `porteurs non décédés : ${holders.map((h) => `${h.data.name} (#${h.externalId})`).join(', ')} → aucun marqué actuel`,
    });
  }

  const characters: PlannedCharacter[] = characterPairs.map(({ en, fr }) => {
    const d = en.data;
    const values: CharacterValues = {
      nameEn: d.name,
      nameFr: fr?.data.name ?? null,
      status: d.status,
      age: d.age,
      heightCm: d.heightCm,
    };
    const src = source(en);

    let affiliation: PlannedCharacter['affiliation'] = null;
    if (d.crewId !== null) {
      if (crewIds.has(d.crewId)) affiliation = { crewExternalId: d.crewId, role: d.job, source: src };
      else
        issues.push({
          kind: 'missing-reference',
          entity: 'characters',
          externalId: en.externalId,
          label: d.name,
          detail: `équipage ${d.crewId} inconnu : affiliation ignorée`,
        });
    }

    let fruit: PlannedCharacter['fruit'] = null;
    if (d.fruitId !== null) {
      if (fruitIds.has(d.fruitId)) {
        const isCurrent = d.status !== 'deceased' && livingHolders.get(d.fruitId)?.length === 1;
        fruit = { fruitExternalId: d.fruitId, isCurrent, source: src };
      } else
        issues.push({
          kind: 'missing-reference',
          entity: 'characters',
          externalId: en.externalId,
          label: d.name,
          detail: `fruit ${d.fruitId} inconnu : ignoré`,
        });
    }

    return {
      externalId: en.externalId,
      baseSlug: checkSlug('characters', en.externalId, d.name, slugify(d.name), issues),
      values,
      provenance: provenanceOf(values, en, fr),
      affiliation,
      fruit,
      bounty: d.bounty === null ? null : { amountBerry: d.bounty, source: src },
    };
  });

  // Équipages
  const captainsByCrew = new Map<string, StagingRow<CharacterRecord>[]>();
  for (const { en } of characterPairs) {
    if (en.data.crewId !== null && en.data.job !== null && CAPTAIN_JOB.test(en.data.job)) {
      captainsByCrew.set(en.data.crewId, [...(captainsByCrew.get(en.data.crewId) ?? []), en]);
    }
  }
  const crews: PlannedCrew[] = pairLangs('crews', staging.crews, (d: CrewRecord) => d.name, issues).map(({ en, fr }) => {
    const d = en.data;
    const nameFr = fr?.data.name ?? null;
    let kind = inferCrewKind(d.name, nameFr);
    if (kind === undefined) {
      kind = 'other';
      issues.push({
        kind: 'crew-kind-default',
        entity: 'crews',
        externalId: en.externalId,
        label: d.name,
        detail: 'type non déductible du nom : `other`',
      });
    }
    const captains = captainsByCrew.get(en.externalId) ?? [];
    if (captains.length > 1) {
      issues.push({
        kind: 'captain-ambiguous',
        entity: 'crews',
        externalId: en.externalId,
        label: d.name,
        detail: `plusieurs capitaines : ${captains.map((c) => `${c.data.name} (#${c.externalId})`).join(', ')} → aucun retenu`,
      });
    }
    const values: CrewValues = { nameEn: d.name, nameFr, kind, isYonko: d.isYonko };
    const captain = captains.length === 1 ? captains[0] : undefined;
    const provenance = provenanceOf(values, en, fr);
    if (captain) provenance['captain_id'] = source(captain);
    return {
      externalId: en.externalId,
      baseSlug: checkSlug('crews', en.externalId, d.name, slugify(d.romanName ?? d.name), issues),
      values,
      provenance,
      captainExternalId: captain?.externalId ?? null,
    };
  });

  return { locations, sagas, arcs, devilFruits, crews, characters, issues };
}
