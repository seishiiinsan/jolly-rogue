import {
  arcs,
  bounties,
  characterAffiliations,
  characterFruits,
  characters,
  crews,
  devilFruits,
  externalIds,
  locations,
  provenance,
  sagas,
} from '@jolly-rogue/db';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { Executor } from '../db.js';
import { chunks } from '../staging/write.js';
import type { ApiOnepiecePlan, FieldSource, PlannedEntity } from './plan.js';

export interface EntityStats {
  inserted: number;
  updated: number;
  unchanged: number;
}

export interface ApplyStats {
  entities: Record<string, EntityStats>;
  relations: Record<string, { written: number }>;
}

type IdMap = Map<string, number>;

/**
 * Applique le plan dans `canon`, dans la transaction fournie. Toutes les comparaisons sont faites
 * en mémoire : une ligne identique n'est jamais réécrite (deux ingest de suite = zéro UPDATE).
 * Les slugs sont attribués à la création puis figés (retrouvés via `canon.external_ids`).
 */
export async function applyApiOnepiecePlan(tx: Executor, plan: ApiOnepiecePlan, sourceName: string): Promise<ApplyStats> {
  const stats: ApplyStats = { entities: {}, relations: {} };
  const ids = await loadExternalIds(tx, sourceName);
  const prov: ProvenanceRow[] = [];

  const sync = async <V extends object>(entity: string, table: PgTable, planned: PlannedEntity<V>[], extra?: (p: PlannedEntity<V>) => object) => {
    const map = await syncEntities(tx, sourceName, entity, table, planned, ids, extra);
    stats.entities[entity] = map.stats;
    for (const p of planned) {
      const entityId = map.ids.get(p.externalId);
      if (entityId === undefined) continue;
      for (const [field, src] of Object.entries(p.provenance)) prov.push({ entity, entityId, field, ...src });
    }
    return map.ids;
  };

  await sync('locations', locations, plan.locations);
  const sagaIds = await sync('sagas', sagas, plan.sagas);
  await sync('arcs', arcs, plan.arcs, (p) => ({ sagaId: requireId(sagaIds, (p as (typeof plan.arcs)[number]).sagaExternalId, 'saga') }));
  const fruitIds = await sync('devil_fruits', devilFruits, plan.devilFruits);
  const crewIds = await sync('crews', crews, plan.crews);
  const characterIds = await sync('characters', characters, plan.characters);

  // Capitaines (après les personnages)
  {
    const existing = new Map((await tx.select({ id: crews.id, captainId: crews.captainId }).from(crews)).map((r) => [r.id, r.captainId]));
    let written = 0;
    for (const crew of plan.crews) {
      const crewId = requireId(crewIds, crew.externalId, 'crew');
      const captainId = crew.captainExternalId === null ? null : (characterIds.get(crew.captainExternalId) ?? null);
      // Un capitaine absent de la source n'efface pas une valeur posée par une autre source.
      if (captainId === null || existing.get(crewId) === captainId) continue;
      await tx.update(crews).set({ captainId }).where(eq(crews.id, crewId));
      written++;
    }
    stats.relations['crews.captain_id'] = { written };
  }

  // Affiliations : celle de l'API est l'affiliation actuelle ; les autres actuelles du perso passent à false.
  {
    const existing = await tx.select().from(characterAffiliations);
    const byKey = new Map(existing.map((a) => [`${a.characterId}|${a.crewId}|${a.role ?? ''}`, a]));
    const planned = new Map<number, string>();
    let written = 0;
    for (const c of plan.characters) {
      if (!c.affiliation) continue;
      const characterId = requireId(characterIds, c.externalId, 'character');
      const crewId = requireId(crewIds, c.affiliation.crewExternalId, 'crew');
      const key = `${characterId}|${crewId}|${c.affiliation.role ?? ''}`;
      planned.set(characterId, key);
      prov.push({ entity: 'characters', entityId: characterId, field: 'affiliations', ...c.affiliation.source });
      const row = byKey.get(key);
      if (row?.isCurrent) continue;
      if (row) await tx.update(characterAffiliations).set({ isCurrent: true }).where(eq(characterAffiliations.id, row.id));
      else await tx.insert(characterAffiliations).values({ characterId, crewId, role: c.affiliation.role, isCurrent: true });
      written++;
    }
    for (const a of existing) {
      const key = planned.get(a.characterId);
      if (key !== undefined && a.isCurrent && key !== `${a.characterId}|${a.crewId}|${a.role ?? ''}`) {
        await tx.update(characterAffiliations).set({ isCurrent: false }).where(eq(characterAffiliations.id, a.id));
        written++;
      }
    }
    stats.relations['character_affiliations'] = { written };
  }

  // Fruits : d'abord les passages à false (index unique partiel sur le porteur actuel), puis les true.
  {
    const existing = new Map(
      (await tx.select().from(characterFruits)).map((f) => [`${f.characterId}|${f.fruitId}`, f]),
    );
    const desired: { characterId: number; fruitId: number; isCurrent: boolean }[] = [];
    for (const c of plan.characters) {
      if (!c.fruit) continue;
      const characterId = requireId(characterIds, c.externalId, 'character');
      const fruitId = requireId(fruitIds, c.fruit.fruitExternalId, 'fruit');
      desired.push({ characterId, fruitId, isCurrent: c.fruit.isCurrent });
      prov.push({ entity: 'characters', entityId: characterId, field: 'fruits', ...c.fruit.source });
    }
    const newCurrentFruits = new Set(desired.filter((d) => d.isCurrent).map((d) => d.fruitId));
    const desiredKeys = new Set(desired.map((d) => `${d.characterId}|${d.fruitId}`));
    let written = 0;
    // Ancien porteur actuel d'un fruit qui change de porteur.
    for (const f of existing.values()) {
      if (f.isCurrent && newCurrentFruits.has(f.fruitId) && !desiredKeys.has(`${f.characterId}|${f.fruitId}`)) {
        await tx
          .update(characterFruits)
          .set({ isCurrent: false })
          .where(and(eq(characterFruits.characterId, f.characterId), eq(characterFruits.fruitId, f.fruitId)));
        written++;
      }
    }
    for (const pass of [false, true]) {
      for (const d of desired.filter((x) => x.isCurrent === pass)) {
        const row = existing.get(`${d.characterId}|${d.fruitId}`);
        if (row?.isCurrent === d.isCurrent) continue;
        if (row) {
          await tx
            .update(characterFruits)
            .set({ isCurrent: d.isCurrent })
            .where(and(eq(characterFruits.characterId, d.characterId), eq(characterFruits.fruitId, d.fruitId)));
        } else {
          await tx.insert(characterFruits).values(d);
        }
        written++;
      }
    }
    stats.relations['character_fruits'] = { written };
  }

  // Primes : la prime de l'API est la prime actuelle ; l'ancienne actuelle passe à false.
  {
    const existing = await tx.select().from(bounties);
    let written = 0;
    for (const c of plan.characters) {
      if (!c.bounty) continue;
      const characterId = requireId(characterIds, c.externalId, 'character');
      prov.push({ entity: 'characters', entityId: characterId, field: 'bounty', ...c.bounty.source });
      const mine = existing.filter((b) => b.characterId === characterId);
      for (const b of mine) {
        if (b.isCurrent && b.amountBerry !== c.bounty.amountBerry) {
          await tx.update(bounties).set({ isCurrent: false }).where(eq(bounties.id, b.id));
          written++;
        }
      }
      const same = mine.find((b) => b.amountBerry === c.bounty?.amountBerry);
      if (same?.isCurrent) continue;
      if (same) await tx.update(bounties).set({ isCurrent: true }).where(eq(bounties.id, same.id));
      else await tx.insert(bounties).values({ characterId, amountBerry: c.bounty.amountBerry, isCurrent: true });
      written++;
    }
    stats.relations['bounties'] = { written };
  }

  stats.relations['provenance'] = { written: await upsertProvenance(tx, sourceName, prov) };
  return stats;
}

// --- Entités ---------------------------------------------------------------

async function loadExternalIds(tx: Executor, sourceName: string): Promise<Map<string, IdMap>> {
  const rows = await tx.select().from(externalIds).where(eq(externalIds.source, sourceName));
  const result = new Map<string, IdMap>();
  for (const r of rows) {
    const map = result.get(r.entity) ?? new Map<string, number>();
    map.set(r.externalId, r.entityId);
    result.set(r.entity, map);
  }
  return result;
}

function requireId(map: IdMap, externalId: string, what: string): number {
  const id = map.get(externalId);
  if (id === undefined) throw new Error(`${what} ${externalId} absent après synchronisation`);
  return id;
}

/** Colonnes communes à toutes les tables d'entités canon. */
interface EntityRow {
  id: number;
  slug: string;
  [column: string]: unknown;
}

async function syncEntities<V extends object>(
  tx: Executor,
  sourceName: string,
  entity: string,
  table: PgTable,
  planned: PlannedEntity<V>[],
  allIds: Map<string, IdMap>,
  extra?: (p: PlannedEntity<V>) => object,
): Promise<{ ids: IdMap; stats: EntityStats }> {
  const columns = getTableColumns(table);
  const idColumn = columns['id'];
  if (!idColumn) throw new Error(`${entity} : colonne id manquante`);

  const ids: IdMap = allIds.get(entity) ?? new Map<string, number>();
  allIds.set(entity, ids);
  // Les tables d'entités ont toutes id + slug ; le typage générique de Drizzle ne le sait pas.
  const existing = new Map(((await tx.select().from(table)) as EntityRow[]).map((r) => [r.id, r]));
  const taken = new Set([...existing.values()].map((r) => r.slug));
  const stats: EntityStats = { inserted: 0, updated: 0, unchanged: 0 };

  for (const p of planned) {
    const values: Record<string, unknown> = { ...(p.values as Record<string, unknown>), ...extra?.(p) };
    const entityId = ids.get(p.externalId);
    const row = entityId === undefined ? undefined : existing.get(entityId);

    if (entityId !== undefined && row) {
      const diff = Object.fromEntries(Object.entries(values).filter(([k, v]) => row[k] !== v));
      if (Object.keys(diff).length === 0) {
        stats.unchanged++;
      } else {
        await tx.update(table).set(diff as never).where(eq(idColumn, entityId));
        stats.updated++;
      }
      continue;
    }
    if (entityId !== undefined) throw new Error(`${entity} ${entityId} référencé par external_ids mais introuvable`);

    // Nouvelle entité : slug de base, ou suffixé par l'id source en cas de collision.
    let slug = p.baseSlug;
    if (taken.has(slug)) slug = `${p.baseSlug}-${p.externalId}`;
    if (taken.has(slug)) throw new Error(`${entity} : slug ${slug} déjà pris, ajoute un alias dans les overrides`);
    taken.add(slug);

    const [inserted] = (await tx
      .insert(table)
      .values({ ...values, slug } as never)
      .returning({ id: idColumn })) as { id: number }[];
    if (!inserted) throw new Error(`${entity} : insertion impossible pour ${p.externalId}`);
    await tx.insert(externalIds).values({ entity, entityId: inserted.id, source: sourceName, externalId: p.externalId });
    ids.set(p.externalId, inserted.id);
    stats.inserted++;
  }
  return { ids, stats };
}

// --- Provenance ------------------------------------------------------------

interface ProvenanceRow extends FieldSource {
  entity: string;
  entityId: number;
  field: string;
}

/** Licence d'api-onepiece.com : aucune déclarée à ce jour (signalé dans le rapport). */
export const API_ONEPIECE_LICENSE: string | null = null;

async function upsertProvenance(tx: Executor, sourceName: string, rows: ProvenanceRow[]): Promise<number> {
  let written = 0;
  for (const chunk of chunks(rows, 1000)) {
    const result = await tx
      .insert(provenance)
      .values(chunk.map((r) => ({ ...r, source: sourceName, license: API_ONEPIECE_LICENSE })))
      .onConflictDoUpdate({
        target: [provenance.entity, provenance.entityId, provenance.field, provenance.source],
        set: {
          sourceUrl: sql`excluded.source_url`,
          fetchedAt: sql`excluded.fetched_at`,
          license: sql`excluded.license`,
        },
        setWhere: sql`(${provenance.sourceUrl}, ${provenance.fetchedAt}, ${provenance.license}) IS DISTINCT FROM (excluded.source_url, excluded.fetched_at, excluded.license)`,
      })
      .returning({ id: provenance.id });
    written += result.length;
  }
  return written;
}
