import type { AliasEntry } from './config.js';
import { bestSimilarity } from './names.js';

/**
 * Rapprochement api-onepiece ↔ Fandom pour une entité, sans I/O (docs/cadrage.md §9.4).
 * Ordre : 1) alias manuel, 2) id déjà connu (`canon.external_ids`), 3) nom normalisé.
 * L'alias passe en premier pour pouvoir corriger un rapprochement déjà enregistré.
 * Aucune fusion fuzzy : une page Fandom qui ressemble à une entité api non rapprochée reste en
 * attente (non créée) et part dans le rapport avec ses candidats.
 */

export const FUZZY_THRESHOLD = 0.8;

export interface ApiCandidate {
  id: string;
  label: string;
  keys: string[];
  /** Entité existante dans canon (via external_ids), sinon null. */
  canonId: number | null;
  /** Exclue du rapprochement automatique (clones de fruits : même nom que l'original). */
  excluded: boolean;
}

export interface FandomCandidate {
  pageId: number;
  title: string;
  /** Titre de la page normalisé (sans retirer la précision entre parenthèses). */
  titleKey: string;
  keys: string[];
  canonId: number | null;
}

export type MatchHow = 'alias' | 'id' | 'name';

export interface MatchedPair {
  api: string;
  fandom: number;
  how: MatchHow;
}

export interface ScoredCandidate {
  apiId: string;
  label: string;
  score: number;
  /** Indice autre que le nom (même fruit du démon). */
  via?: 'fruit';
}

/** Score donné à un candidat trouvé par un indice autre que le nom. */
export const HINT_SCORE = 0.85;

export interface PendingFandom {
  pageId: number;
  title: string;
  reason: 'ambiguous' | 'fuzzy';
  candidates: ScoredCandidate[];
}

export interface MatchResult {
  pairs: MatchedPair[];
  /** Ids api sans équivalent Fandom. */
  apiOnly: string[];
  /** Pages Fandom sans équivalent api, à créer seules ; `how` = pourquoi elles sont seules. */
  fandomOnly: { pageId: number; how: 'alias' | 'id' | 'none' }[];
  /** Pages Fandom non créées : ambiguïté de nom ou candidats fuzzy à valider. */
  pending: PendingFandom[];
  /** Candidats fuzzy entre entités api non rapprochées et pages Fandom non rapprochées. */
  fuzzy: (ScoredCandidate & { pageId: number; title: string })[];
}

export function matchEntity(
  entity: string,
  api: readonly ApiCandidate[],
  fandom: readonly FandomCandidate[],
  aliases: readonly AliasEntry[],
  /** Candidats supplémentaires par page Fandom (ids api), ex. même fruit du démon. */
  hints: ReadonlyMap<number, readonly string[]> = new Map(),
): MatchResult {
  const apiById = new Map(api.map((a) => [a.id, a]));
  const fandomByTitle = new Map(fandom.map((f) => [f.title, f]));
  const usedApi = new Set<string>();
  const usedFandom = new Set<number>();
  const pairs: MatchedPair[] = [];
  const fandomOnly: MatchResult['fandomOnly'] = [];

  // 1. Alias manuels : une erreur de saisie fait échouer la réconciliation (overrides toujours valides).
  for (const alias of aliases) {
    const f = fandomByTitle.get(alias.fandom);
    if (!f) throw new Error(`overrides/aliases.yaml : ${entity} « ${alias.fandom} » absent de staging.fandom`);
    if (usedFandom.has(f.pageId)) throw new Error(`overrides/aliases.yaml : ${entity} « ${alias.fandom} » listé deux fois`);
    usedFandom.add(f.pageId);
    const apiId = alias['api-onepiece'];
    if (apiId === null) {
      fandomOnly.push({ pageId: f.pageId, how: 'alias' });
      continue;
    }
    if (!apiById.has(apiId)) throw new Error(`overrides/aliases.yaml : ${entity} api-onepiece ${apiId} absent de staging`);
    if (usedApi.has(apiId)) throw new Error(`overrides/aliases.yaml : ${entity} api-onepiece ${apiId} listé deux fois`);
    usedApi.add(apiId);
    pairs.push({ api: apiId, fandom: f.pageId, how: 'alias' });
  }

  // 2. Id déjà connu : la page Fandom pointe vers une entité canon.
  const claimed = new Set<number>();
  for (const p of pairs) {
    const id = apiById.get(p.api)?.canonId;
    if (id != null) claimed.add(id);
  }
  const freeApiByCanon = new Map<number, ApiCandidate>();
  for (const a of api) if (a.canonId !== null && !usedApi.has(a.id)) freeApiByCanon.set(a.canonId, a);
  for (const f of fandom) {
    if (usedFandom.has(f.pageId) || f.canonId === null || claimed.has(f.canonId)) continue;
    const a = freeApiByCanon.get(f.canonId);
    usedFandom.add(f.pageId);
    claimed.add(f.canonId);
    if (a) {
      usedApi.add(a.id);
      pairs.push({ api: a.id, fandom: f.pageId, how: 'id' });
    } else {
      fandomOnly.push({ pageId: f.pageId, how: 'id' });
    }
  }

  // 3. Nom normalisé, univoque dans les deux sens : d'abord le titre exact de la page Fandom
  // (« Kaku » plutôt que « Kaku (Wano) »), puis tous les noms connus (romanisé, anglais…).
  const pending: PendingFandom[] = [];
  for (const pass of ['title', 'all'] as const) {
    const apiByKey = new Map<string, Set<string>>();
    for (const a of api) {
      if (usedApi.has(a.id) || a.excluded) continue;
      for (const k of a.keys) apiByKey.set(k, (apiByKey.get(k) ?? new Set()).add(a.id));
    }
    const freeFandom = fandom.filter((f) => !usedFandom.has(f.pageId));
    const apiCandidatesOf = new Map<number, string[]>();
    const fandomCandidatesOf = new Map<string, number[]>();
    for (const f of freeFandom) {
      const ids = new Set<string>();
      for (const k of pass === 'title' ? [f.titleKey] : f.keys) for (const id of apiByKey.get(k) ?? []) ids.add(id);
      const sorted = [...ids].sort(byNumeric);
      apiCandidatesOf.set(f.pageId, sorted);
      for (const id of sorted) fandomCandidatesOf.set(id, [...(fandomCandidatesOf.get(id) ?? []), f.pageId]);
    }
    for (const f of freeFandom) {
      const ids = apiCandidatesOf.get(f.pageId) ?? [];
      const [only] = ids;
      if (ids.length === 1 && only !== undefined && fandomCandidatesOf.get(only)?.length === 1) {
        usedApi.add(only);
        usedFandom.add(f.pageId);
        pairs.push({ api: only, fandom: f.pageId, how: 'name' });
      } else if (ids.length > 0 && pass === 'all') {
        usedFandom.add(f.pageId);
        pending.push({
          pageId: f.pageId,
          title: f.title,
          reason: 'ambiguous',
          candidates: ids.map((id) => ({ apiId: id, label: apiById.get(id)?.label ?? id, score: 1 })),
        });
      }
    }
  }

  // 4. Fuzzy : jamais de fusion, seulement des candidats. Une page qui en a reste en attente.
  const unmatchedApi = api.filter((a) => !usedApi.has(a.id) && !a.excluded);
  const fuzzy: MatchResult['fuzzy'] = [];
  for (const f of fandom) {
    if (usedFandom.has(f.pageId)) continue;
    const candidates: ScoredCandidate[] = [];
    const hinted = new Set(hints.get(f.pageId) ?? []);
    for (const a of unmatchedApi) {
      const score = bestSimilarity(f.keys, a.keys);
      if (score >= FUZZY_THRESHOLD) candidates.push({ apiId: a.id, label: a.label, score: round(score) });
      else if (hinted.has(a.id)) candidates.push({ apiId: a.id, label: a.label, score: HINT_SCORE, via: 'fruit' });
    }
    candidates.sort((x, y) => y.score - x.score || byNumeric(x.apiId, y.apiId));
    if (candidates.length > 0) {
      pending.push({ pageId: f.pageId, title: f.title, reason: 'fuzzy', candidates });
      for (const c of candidates) fuzzy.push({ ...c, pageId: f.pageId, title: f.title });
    } else {
      fandomOnly.push({ pageId: f.pageId, how: 'none' });
    }
    usedFandom.add(f.pageId);
  }

  pairs.sort((a, b) => byNumeric(a.api, b.api));
  fandomOnly.sort((a, b) => a.pageId - b.pageId);
  pending.sort((a, b) => a.pageId - b.pageId);
  fuzzy.sort((a, b) => byNumeric(a.apiId, b.apiId) || b.score - a.score || a.pageId - b.pageId);
  return {
    pairs,
    apiOnly: api.filter((a) => !usedApi.has(a.id)).map((a) => a.id),
    fandomOnly,
    pending,
    fuzzy,
  };
}

const round = (n: number): number => Math.round(n * 100) / 100;

export const byNumeric = (a: string, b: string): number =>
  Number(a) - Number(b) || (a < b ? -1 : a > b ? 1 : 0);
