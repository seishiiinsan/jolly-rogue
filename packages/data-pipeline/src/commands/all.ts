import { INGEST_SOURCES } from '../ingest.js';
import { exportCommand } from './export.js';
import { ingestCommand } from './ingest.js';
import { migrateCommand } from './migrate.js';
import { reconcileCommand } from './reconcile.js';
import { reportCommand } from './report.js';
import type { CommandContext } from './types.js';

/** Reconstruction complète (docs/cadrage.md §9.4) : migrate → ingest (toutes sources) → reconcile → export → report. */
export async function allCommand(ctx: CommandContext): Promise<void> {
  if (ctx.options.source !== undefined) throw new Error('all : --source ne s\'applique pas (toutes les sources sont collectées)');
  await migrateCommand(ctx);
  for (const source of INGEST_SOURCES) await ingestCommand({ ...ctx, options: { ...ctx.options, source } });
  await reconcileCommand(ctx);
  await exportCommand(ctx);
  await reportCommand(ctx);
}
