import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { ApiOnepieceStaging, StagingRow } from '../src/load/plan.js';
import {
  API_ONEPIECE_LANGS,
  API_ONEPIECE_RESOURCES,
  type ApiOnepieceLang,
  type ApiOnepieceResource,
  apiOnepieceUrl,
  parseApiOnepieceResponse,
} from '../src/parse/api-onepiece.js';

export const FIXTURES_DIR = fileURLToPath(new URL('../fixtures/api-onepiece', import.meta.url));
/** Date de collecte fictive mais fixe, pour des tests déterministes. */
export const FIXTURE_FETCHED_AT = '2026-11-12T00:00:00.000Z';

/** Body d'une fixture, re-sérialisé comme le renverrait l'API (JSON compact). */
export function fixtureBody(resource: ApiOnepieceResource, lang: ApiOnepieceLang): string {
  const text = readFileSync(`${FIXTURES_DIR}/${resource}.${lang}.json`, 'utf8');
  return JSON.stringify(JSON.parse(text));
}

/** Staging tel que le produirait `ingest` à partir des fixtures (sans base). */
export function stagingFromFixtures(): ApiOnepieceStaging {
  const staging: Record<string, Record<string, StagingRow<unknown>[]>> = {};
  for (const resource of API_ONEPIECE_RESOURCES) {
    staging[resource] = {};
    for (const lang of API_ONEPIECE_LANGS) {
      const { records } = parseApiOnepieceResponse(resource, fixtureBody(resource, lang));
      staging[resource][lang] = records.map((r) => ({
        externalId: r.externalId,
        data: r.data,
        sourceUrl: apiOnepieceUrl(resource, lang),
        fetchedAt: new Date(FIXTURE_FETCHED_AT),
      }));
    }
  }
  return staging as unknown as ApiOnepieceStaging;
}
