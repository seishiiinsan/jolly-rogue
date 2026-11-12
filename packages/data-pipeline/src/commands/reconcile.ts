import { createDb } from '@jolly-rogue/db';
import { reconcile } from '../reconcile/index.js';
import type { CommandContext } from './types.js';

export async function reconcileCommand({ databaseUrl }: CommandContext): Promise<void> {
  const { db, client } = createDb(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    const { apply, model } = await reconcile(db);
    console.log('reconcile : staging → canon');
    for (const [entity, s] of Object.entries(apply.entities)) {
      console.log(`  canon.${entity} : +${s.inserted} insérées, ${s.updated} modifiées, ${s.unchanged} inchangées`);
    }
    const writes = Object.entries(apply.writes);
    for (const [table, n] of writes) console.log(`  canon.${table} : ${n} écritures`);
    if (writes.length === 0) console.log('  relations, alias, provenance : aucune écriture');
    const m = model.matches;
    const pending = m.characters.pending.length + m.crews.pending.length + m.devil_fruits.pending.length;
    console.log(
      `  rapprochés : ${m.characters.pairs.length} personnages, ${m.crews.pairs.length} équipages, ${m.devil_fruits.pairs.length} fruits ; ` +
        `${pending} pages Fandom en attente, ${model.conflicts.length} conflits, ${model.corrections.length} corrections (voir pipeline report)`,
    );
  } finally {
    await client.end();
  }
}
