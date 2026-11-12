import type { Database } from '@jolly-rogue/db';
import { type ApplyStats, applyReconcileModel } from './apply.js';
import type { ReconcileConfig } from './config.js';
import type { ReconcileModel } from './model.js';
import { computeReconcileModel } from './read.js';

export interface ReconcileResult {
  apply: ApplyStats;
  model: ReconcileModel;
}

/** staging (api-onepiece + Fandom) → canon, en une transaction (docs/cadrage.md §9.4 étapes 4 à 6). */
export async function reconcile(db: Database, config?: ReconcileConfig): Promise<ReconcileResult> {
  return db.transaction(async (tx) => {
    const { model } = await computeReconcileModel(tx, config);
    return { apply: await applyReconcileModel(tx, model), model };
  });
}
