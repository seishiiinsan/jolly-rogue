import type { Database } from '@jolly-rogue/db';
import type { HttpClient } from './http/client.js';
import { type ApplyStats, applyApiOnepiecePlan } from './load/apply.js';
import { planApiOnepiece } from './load/plan.js';
import { readApiOnepieceStaging } from './load/read-staging.js';
import { API_ONEPIECE_SOURCE } from './parse/api-onepiece.js';
import { FANDOM_SOURCE } from './parse/fandom/api.js';
import { type ApiOnepieceIngestStats, fetchAndParseApiOnepiece } from './sources/api-onepiece.js';
import { type FandomIngestOptions, type FandomIngestStats, fetchAndParseFandom } from './sources/fandom.js';

export const INGEST_SOURCES = [API_ONEPIECE_SOURCE, FANDOM_SOURCE] as const;
export type IngestSource = (typeof INGEST_SOURCES)[number];

export interface IngestResult {
  fetch: ApiOnepieceIngestStats;
  load: ApplyStats;
  issues: number;
}

/** fetch → raw, parse → staging, puis chargement dans canon (une transaction). */
export async function ingestApiOnepiece(db: Database, http: HttpClient, log: (m: string) => void = () => {}): Promise<IngestResult> {
  log('fetch + parse');
  const fetch = await fetchAndParseApiOnepiece(db, http, log);
  log('load → canon');
  return db.transaction(async (tx) => {
    const plan = planApiOnepiece(await readApiOnepieceStaging(tx));
    const load = await applyApiOnepiecePlan(tx, plan, API_ONEPIECE_SOURCE);
    return { fetch, load, issues: plan.issues.length };
  });
}

/** fetch → raw, parse → staging.fandom. Pas de chargement dans canon (rapprochement : tâche 4). */
export async function ingestFandom(
  db: Database,
  http: HttpClient,
  options: FandomIngestOptions = {},
  log: (m: string) => void = () => {},
): Promise<FandomIngestStats> {
  log('fetch + parse');
  return fetchAndParseFandom(db, http, options, log);
}
