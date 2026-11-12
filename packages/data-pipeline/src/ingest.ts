import type { Database } from '@jolly-rogue/db';
import type { HttpClient } from './http/client.js';
import { API_ONEPIECE_SOURCE } from './parse/api-onepiece.js';
import { FANDOM_SOURCE } from './parse/fandom/api.js';
import { type ApiOnepieceIngestStats, fetchAndParseApiOnepiece } from './sources/api-onepiece.js';
import { type FandomIngestOptions, type FandomIngestStats, fetchAndParseFandom } from './sources/fandom.js';

export const INGEST_SOURCES = [API_ONEPIECE_SOURCE, FANDOM_SOURCE] as const;
export type IngestSource = (typeof INGEST_SOURCES)[number];

/**
 * fetch → raw, parse → staging.api_onepiece. Le chargement dans canon est fait par `reconcile`,
 * qui croise toutes les sources (priorité par champ).
 */
export async function ingestApiOnepiece(
  db: Database,
  http: HttpClient,
  log: (m: string) => void = () => {},
): Promise<ApiOnepieceIngestStats> {
  log('fetch + parse');
  return fetchAndParseApiOnepiece(db, http, log);
}

/** fetch → raw, parse → staging.fandom. */
export async function ingestFandom(
  db: Database,
  http: HttpClient,
  options: FandomIngestOptions = {},
  log: (m: string) => void = () => {},
): Promise<FandomIngestStats> {
  log('fetch + parse');
  return fetchAndParseFandom(db, http, options, log);
}
