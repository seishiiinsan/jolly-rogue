import {
  bounties,
  characterAffiliations,
  characterAliases,
  characterFruits,
  crews,
  externalIds,
  haki,
  provenance,
} from '@jolly-rogue/db';
import { and, eq } from 'drizzle-orm';
import type { Executor } from '../db.js';
import { chunks } from '../staging/write.js';
import type { EntityName } from './config.js';
import type { DesiredEntity, Key, ReconcileModel } from './model.js';
import { ENTITY_TABLES } from './read.js';

export interface EntityStats {
  inserted: number;
  updated: number;
  unchanged: number;
}

export interface ApplyStats {
  entities: Record<string, EntityStats>;
  /** Lignes insérées, modifiées ou supprimées par table. */
  writes: Record<string, number>;
}

/**
 * Applique le modèle dans `canon`, dans la transaction fournie. Tout est comparé en mémoire :
 * une ligne identique n'est jamais réécrite (deux `reconcile` de suite = aucune écriture).
 * Les entités ne sont jamais supprimées (slugs publiés) ; les relations, alias et provenances
 * des entités du modèle sont alignés exactement sur le modèle.
 */
export async function applyReconcileModel(tx: Executor, model: ReconcileModel): Promise<ApplyStats> {
  const stats: ApplyStats = { entities: {}, writes: {} };
  const ids = new Map<Key, number>();
  const idOf = (key: Key | null): number | null => {
    if (key === null) return null;
    const id = ids.get(key);
    if (id === undefined) throw new Error(`reconcile : entité ${key} absente après synchronisation`);
    return id;
  };
  const count = (table: string, n = 1) => {
    stats.writes[table] = (stats.writes[table] ?? 0) + n;
  };

  // Entités, dans l'ordre des dépendances. Le capitaine d'un équipage est posé après les personnages.
  const order: { entity: EntityName; deferred?: string[] }[] = [
    { entity: 'locations' },
    { entity: 'sagas' },
    { entity: 'arcs' },
    { entity: 'devil_fruits' },
    { entity: 'crews', deferred: ['captainId'] },
    { entity: 'characters' },
  ];
  for (const { entity, deferred = [] } of order) {
    stats.entities[entity] = await syncEntities(tx, entity, model.entities[entity], ids, idOf, deferred);
  }
  {
    const current = new Map((await tx.select({ id: crews.id, captainId: crews.captainId }).from(crews)).map((r) => [r.id, r.captainId]));
    for (const c of model.entities.crews) {
      const id = idOf(c.key) as number;
      const captainId = idOf(c.refs['captainId'] ?? null);
      if (current.get(id) === captainId) continue;
      await tx.update(crews).set({ captainId }).where(eq(crews.id, id));
      count('crews.captain_id');
    }
  }

  // Correspondance des identifiants : ajoutés, ou redirigés (alias qui corrige un rapprochement).
  {
    const existing = new Map((await tx.select().from(externalIds)).map((r) => [`${r.source}|${r.entity}|${r.externalId}`, r]));
    for (const entity of Object.keys(model.entities) as EntityName[]) {
      for (const e of model.entities[entity]) {
        const entityId = idOf(e.key) as number;
        for (const x of e.externalIds) {
          const row = existing.get(`${x.source}|${entity}|${x.externalId}`);
          if (row?.entityId === entityId) continue;
          if (row) await tx.update(externalIds).set({ entityId }).where(eq(externalIds.id, row.id));
          else await tx.insert(externalIds).values({ entity, entityId, source: x.source, externalId: x.externalId });
          count('external_ids');
        }
      }
    }
  }

  const characterIds = new Set(model.entities.characters.map((c) => idOf(c.key) as number));
  const r = model.relations;

  // Affiliations
  await syncRows('character_affiliations', {
    existing: (await tx.select().from(characterAffiliations)).filter((x) => characterIds.has(x.characterId)),
    desired: r.affiliations.map((a) => ({ characterId: idOf(a.character) as number, crewId: idOf(a.crew) as number, role: a.role, isCurrent: a.isCurrent })),
    key: (x) => `${x.characterId}|${x.crewId}|${x.role ?? ''}`,
    same: (a, b) => a.isCurrent === b.isCurrent,
    insert: (rows) => tx.insert(characterAffiliations).values(rows),
    update: (row, d) => tx.update(characterAffiliations).set({ isCurrent: d.isCurrent }).where(eq(characterAffiliations.id, row.id)),
    remove: (row) => tx.delete(characterAffiliations).where(eq(characterAffiliations.id, row.id)),
  }, count);

  // Fruits et primes : index uniques partiels sur la ligne « actuelle » → d'abord les passages
  // à false et les suppressions, puis les passages à true et les insertions.
  const fruitWhere = (x: { characterId: number; fruitId: number }) =>
    and(eq(characterFruits.characterId, x.characterId), eq(characterFruits.fruitId, x.fruitId));
  await syncRows('character_fruits', {
    existing: (await tx.select().from(characterFruits)).filter((x) => characterIds.has(x.characterId)),
    desired: r.fruits.map((f) => ({ characterId: idOf(f.character) as number, fruitId: idOf(f.fruit) as number, isCurrent: f.isCurrent })),
    key: (x) => `${x.characterId}|${x.fruitId}`,
    same: (a, b) => a.isCurrent === b.isCurrent,
    insert: (rows) => tx.insert(characterFruits).values(rows),
    update: (row, d) => tx.update(characterFruits).set({ isCurrent: d.isCurrent }).where(fruitWhere(row)),
    remove: (row) => tx.delete(characterFruits).where(fruitWhere(row)),
    isCurrent: (x) => x.isCurrent,
  }, count);
  await syncRows('bounties', {
    existing: (await tx.select().from(bounties)).filter((x) => characterIds.has(x.characterId)),
    desired: r.bounties.map((b) => ({ characterId: idOf(b.character) as number, amountBerry: b.amountBerry, asOfChapter: b.asOfChapter, isCurrent: b.isCurrent })),
    key: (x) => `${x.characterId}|${x.amountBerry}`,
    same: (a, b) => a.isCurrent === b.isCurrent && a.asOfChapter === b.asOfChapter,
    insert: (rows) => tx.insert(bounties).values(rows),
    update: (row, d) => tx.update(bounties).set({ isCurrent: d.isCurrent, asOfChapter: d.asOfChapter }).where(eq(bounties.id, row.id)),
    remove: (row) => tx.delete(bounties).where(eq(bounties.id, row.id)),
    isCurrent: (x) => x.isCurrent,
  }, count);

  await syncRows('haki', {
    existing: (await tx.select().from(haki)).filter((x) => characterIds.has(x.characterId)),
    desired: r.haki.map((h) => ({ characterId: idOf(h.character) as number, kind: h.kind })),
    key: (x) => `${x.characterId}|${x.kind}`,
    same: () => true,
    insert: (rows) => tx.insert(haki).values(rows),
    update: async () => {},
    remove: (row) => tx.delete(haki).where(and(eq(haki.characterId, row.characterId), eq(haki.kind, row.kind))),
  }, count);

  await syncRows('character_aliases', {
    existing: (await tx.select().from(characterAliases)).filter((x) => characterIds.has(x.characterId)),
    desired: r.aliases.map((a) => ({ characterId: idOf(a.character) as number, alias: a.alias, kind: a.kind })),
    key: (x) => `${x.characterId}|${x.kind}|${x.alias}`,
    same: () => true,
    insert: (rows) => tx.insert(characterAliases).values(rows),
    update: async () => {},
    remove: (row) => tx.delete(characterAliases).where(eq(characterAliases.id, row.id)),
  }, count);

  // Provenance : une ligne par champ renseigné, celle de la source retenue.
  {
    const desired = (Object.keys(model.entities) as EntityName[]).flatMap((entity) =>
      model.entities[entity].flatMap((e) => {
        const entityId = idOf(e.key) as number;
        return Object.entries(e.provenance).map(([field, p]) => ({ entity, entityId, field, ...p }));
      }),
    );
    const scope = new Set(desired.map((d) => `${d.entity}|${d.entityId}`));
    for (const entity of Object.keys(model.entities) as EntityName[]) {
      for (const e of model.entities[entity]) scope.add(`${entity}|${idOf(e.key)}`);
    }
    await syncRows('provenance', {
      existing: (await tx.select().from(provenance)).filter((x) => scope.has(`${x.entity}|${x.entityId}`)),
      desired,
      key: (x) => `${x.entity}|${x.entityId}|${x.field}|${x.source}`,
      same: (a, b) => a.sourceUrl === b.sourceUrl && a.fetchedAt.getTime() === b.fetchedAt.getTime() && a.license === b.license,
      insert: (rows) => tx.insert(provenance).values(rows),
      update: (row, d) =>
        tx.update(provenance).set({ sourceUrl: d.sourceUrl, fetchedAt: d.fetchedAt, license: d.license }).where(eq(provenance.id, row.id)),
      remove: (row) => tx.delete(provenance).where(eq(provenance.id, row.id)),
    }, count);
  }

  return stats;
}

// --- Entités ---------------------------------------------------------------

interface EntityRow {
  id: number;
  slug: string;
  [column: string]: unknown;
}

async function syncEntities(
  tx: Executor,
  entity: EntityName,
  desired: DesiredEntity[],
  ids: Map<Key, number>,
  idOf: (key: Key | null) => number | null,
  deferred: string[],
): Promise<EntityStats> {
  const table = ENTITY_TABLES[entity];
  const existing = new Map(((await tx.select().from(table)) as EntityRow[]).map((r) => [r.id, r]));
  const stats: EntityStats = { inserted: 0, updated: 0, unchanged: 0 };

  for (const e of desired) {
    const values: Record<string, unknown> = { ...e.values };
    for (const [column, key] of Object.entries(e.refs)) if (!deferred.includes(column)) values[column] = idOf(key);

    if (e.canonId !== null) {
      const row = existing.get(e.canonId);
      if (!row) throw new Error(`${entity} ${e.canonId} introuvable`);
      ids.set(e.key, e.canonId);
      const diff = Object.fromEntries(Object.entries(values).filter(([k, v]) => !equal(row[k], v)));
      if (Object.keys(diff).length === 0) stats.unchanged++;
      else {
        await tx.update(table).set(diff).where(eq(table.id, e.canonId));
        stats.updated++;
      }
      continue;
    }
    const [inserted] = await tx
      .insert(table)
      .values({ ...values, slug: e.slug } as never)
      .returning({ id: table.id });
    if (!inserted) throw new Error(`${entity} : insertion impossible pour ${e.key}`);
    ids.set(e.key, inserted.id);
    stats.inserted++;
  }
  return stats;
}

const equal = (a: unknown, b: unknown): boolean =>
  a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b;

// --- Relations -------------------------------------------------------------

interface SyncSpec<E, D> {
  existing: E[];
  desired: D[];
  key: (x: E | D) => string;
  same: (row: E, desired: D) => boolean;
  insert: (rows: D[]) => PromiseLike<unknown>;
  update: (row: E, desired: D) => PromiseLike<unknown>;
  remove: (row: E) => PromiseLike<unknown>;
  /** Lignes « actuelles » sous index unique partiel : écrites en dernier. */
  isCurrent?: (x: E | D) => boolean;
}

async function syncRows<E, D>(table: string, spec: SyncSpec<E, D>, count: (t: string, n?: number) => void): Promise<void> {
  const desired = new Map<string, D>();
  for (const d of spec.desired) desired.set(spec.key(d), d);
  const existing = new Map(spec.existing.map((e) => [spec.key(e), e]));
  const current = spec.isCurrent ?? (() => false);

  // 1. Suppressions et passages hors « actuel ».
  for (const [k, row] of existing) {
    const d = desired.get(k);
    if (!d) {
      await spec.remove(row);
      count(table);
    } else if (!spec.same(row, d) && !current(d)) {
      await spec.update(row, d);
      count(table);
    }
  }
  // 2. Passages à « actuel », puis insertions.
  for (const [k, row] of existing) {
    const d = desired.get(k);
    if (d && !spec.same(row, d) && current(d)) {
      await spec.update(row, d);
      count(table);
    }
  }
  const toInsert = [...desired].filter(([k]) => !existing.has(k)).map(([, d]) => d);
  const ordered = [...toInsert.filter((d) => !current(d)), ...toInsert.filter((d) => current(d))];
  for (const chunk of chunks(ordered, 500)) {
    await spec.insert(chunk);
    count(table, chunk.length);
  }
}

