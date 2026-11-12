import { arcs, characters, crews, devilFruits, externalIds, fandom, locations, responses, sagas } from '@jolly-rogue/db';
import { eq } from 'drizzle-orm';
import type { Executor } from '../db.js';
import { planApiOnepiece } from '../load/plan.js';
import { readApiOnepieceStaging } from '../load/read-staging.js';
import type { FandomKind } from '../parse/fandom/schemas.js';
import { type EntityName, type ReconcileConfig, loadReconcileConfig } from './config.js';
import { type ExistingState, type FandomRow, type ReconcileInput, type ReconcileModel, buildReconcileModel } from './model.js';

/** Tables canon des entités, par nom d'entité. */
export const ENTITY_TABLES = {
  locations,
  sagas,
  arcs,
  devil_fruits: devilFruits,
  crews,
  characters,
} as const;

/** `staging.fandom` avec la date de collecte de la réponse brute d'origine. */
export async function readFandomStaging(db: Executor): Promise<FandomRow[]> {
  const rows = await db
    .select({
      kind: fandom.kind,
      pageId: fandom.pageId,
      title: fandom.title,
      sourceUrl: fandom.sourceUrl,
      fetchedAt: responses.fetchedAt,
      data: fandom.data,
    })
    .from(fandom)
    .innerJoin(responses, eq(responses.id, fandom.rawResponseId));
  // `data` a été produit par le schéma Zod du kind lors du parse.
  return rows.map((r) => ({ ...r, kind: r.kind as FandomKind }) as FandomRow);
}

export async function readExistingState(db: Executor): Promise<ExistingState> {
  const slugs = {} as ExistingState['slugs'];
  for (const [entity, table] of Object.entries(ENTITY_TABLES) as [EntityName, (typeof ENTITY_TABLES)[EntityName]][]) {
    const rows = await db.select({ id: table.id, slug: table.slug }).from(table);
    slugs[entity] = new Map(rows.map((r) => [r.id, r.slug]));
  }
  const ext = await db
    .select({ entity: externalIds.entity, entityId: externalIds.entityId, source: externalIds.source, externalId: externalIds.externalId })
    .from(externalIds);
  return { externalIds: ext, slugs };
}

export async function readReconcileInput(db: Executor, config?: ReconcileConfig): Promise<ReconcileInput> {
  const apiStaging = await readApiOnepieceStaging(db);
  return {
    apiStaging,
    apiPlan: planApiOnepiece(apiStaging),
    fandom: await readFandomStaging(db),
    existing: await readExistingState(db),
    config: config ?? (await loadReconcileConfig()),
  };
}

/** Modèle calculé depuis l'état courant de la base (lecture seule). */
export async function computeReconcileModel(db: Executor, config?: ReconcileConfig): Promise<{ input: ReconcileInput; model: ReconcileModel }> {
  const input = await readReconcileInput(db, config);
  return { input, model: buildReconcileModel(input) };
}
