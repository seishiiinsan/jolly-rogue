import { apiOnepiece, responses } from '@jolly-rogue/db';
import { eq } from 'drizzle-orm';
import type { Executor } from '../db.js';
import { API_ONEPIECE_LANGS, API_ONEPIECE_RESOURCES, type ApiOnepieceLang, type ApiOnepieceResource } from '../parse/api-onepiece.js';
import type { ApiOnepieceStaging, StagingRow } from './plan.js';

/** Lit `staging.api_onepiece` avec l'URL et la date de collecte de la réponse brute d'origine. */
export async function readApiOnepieceStaging(db: Executor): Promise<ApiOnepieceStaging> {
  const rows = await db
    .select({
      resource: apiOnepiece.resource,
      lang: apiOnepiece.lang,
      externalId: apiOnepiece.externalId,
      data: apiOnepiece.data,
      sourceUrl: responses.url,
      fetchedAt: responses.fetchedAt,
    })
    .from(apiOnepiece)
    .innerJoin(responses, eq(responses.id, apiOnepiece.rawResponseId));

  const staging = Object.fromEntries(
    API_ONEPIECE_RESOURCES.map((r) => [r, Object.fromEntries(API_ONEPIECE_LANGS.map((l) => [l, []]))]),
  ) as unknown as Record<ApiOnepieceResource, Record<ApiOnepieceLang, StagingRow<unknown>[]>>;

  for (const row of rows) {
    const bucket = staging[row.resource as ApiOnepieceResource]?.[row.lang as ApiOnepieceLang];
    if (!bucket) throw new Error(`staging.api_onepiece : ressource/langue inattendue ${row.resource}/${row.lang}`);
    // `data` a été produit par le schéma Zod de la ressource lors du parse.
    bucket.push({ externalId: row.externalId, data: row.data, sourceUrl: row.sourceUrl, fetchedAt: row.fetchedAt });
  }
  return staging as ApiOnepieceStaging;
}
