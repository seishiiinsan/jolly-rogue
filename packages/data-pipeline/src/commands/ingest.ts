import { createDb } from '@jolly-rogue/db';
import { cacheDir, userAgent } from '../config.js';
import { HttpClient } from '../http/client.js';
import { INGEST_SOURCES, type IngestSource, ingestApiOnepiece, ingestFandom } from '../ingest.js';
import type { CommandContext } from './types.js';

export async function ingestCommand({ databaseUrl, options }: CommandContext): Promise<void> {
  const source = options.source;
  if (!INGEST_SOURCES.includes(source as IngestSource)) {
    throw new Error(`ingest : --source=<${INGEST_SOURCES.join('|')}> requis (reçu : ${source ?? 'rien'})`);
  }
  const http = new HttpClient({
    cacheDir: cacheDir(),
    userAgent: userAgent(),
    offline: options.offline,
    refresh: options.refresh,
    log: (m) => console.log(m),
  });

  const { db, client } = createDb(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    if (source === 'fandom') {
      const s = await ingestFandom(db, http, {}, (m) => console.log(m));
      console.log(
        `ingest fandom : ${s.requests} requêtes (${s.fromCache} depuis le cache), ${s.rawInserted} nouvelles dans raw, ` +
          `${s.listed} pages listées (${s.excludedSubpages} sous-pages exclues), ${s.pages} pages lues + ${s.templates} templates Tabs Top, ${s.records} lignes dans staging.fandom, ` +
          `${s.excludedNonCanon} pages non canon écartées, ${s.rejected} rejetées (voir pipeline report)`,
      );
      return;
    }
    const result = await ingestApiOnepiece(db, http, (m) => console.log(m));
    const f = result.fetch;
    console.log(
      `ingest ${source} : ${f.responses} réponses (${f.fromCache} depuis le cache), ${f.rawInserted} nouvelles dans raw, ` +
        `${f.parsed} parsées (${f.skipped} inchangées), ${f.records} lignes valides, ${f.rejected} rejetées`,
    );
    for (const [entity, s] of Object.entries(result.load.entities)) {
      console.log(`  canon.${entity} : +${s.inserted} insérées, ${s.updated} modifiées, ${s.unchanged} inchangées`);
    }
    for (const [relation, s] of Object.entries(result.load.relations)) {
      console.log(`  canon.${relation} : ${s.written} écritures`);
    }
    console.log(`  ${result.issues} anomalies (voir pipeline report)`);
  } finally {
    await client.end();
  }
}
