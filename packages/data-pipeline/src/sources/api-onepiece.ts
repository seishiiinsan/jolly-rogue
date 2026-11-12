import type { Database } from '@jolly-rogue/db';
import { apiOnepiece } from '@jolly-rogue/db';
import { and, eq } from 'drizzle-orm';
import type { HttpClient } from '../http/client.js';
import {
  API_ONEPIECE_LANGS,
  API_ONEPIECE_RESOURCES,
  API_ONEPIECE_SOURCE,
  apiOnepieceUrl,
  parseApiOnepieceResponse,
} from '../parse/api-onepiece.js';
import { storeRawResponse } from '../raw/store.js';
import { writeApiOnepieceStaging } from '../staging/write.js';

export interface ApiOnepieceIngestStats {
  responses: number;
  fromCache: number;
  rawInserted: number;
  parsed: number;
  skipped: number;
  records: number;
  rejected: number;
}

/**
 * Étapes fetch (→ raw.responses) et parse (→ staging.api_onepiece) pour toutes les ressources
 * et les deux langues. Une réponse dont le hash n'a pas changé et déjà parsée n'est pas retraitée.
 */
export async function fetchAndParseApiOnepiece(
  db: Database,
  http: HttpClient,
  log: (message: string) => void = () => {},
): Promise<ApiOnepieceIngestStats> {
  const stats: ApiOnepieceIngestStats = {
    responses: 0,
    fromCache: 0,
    rawInserted: 0,
    parsed: 0,
    skipped: 0,
    records: 0,
    rejected: 0,
  };

  for (const resource of API_ONEPIECE_RESOURCES) {
    for (const lang of API_ONEPIECE_LANGS) {
      const url = apiOnepieceUrl(resource, lang);
      const response = await http.get(url);
      stats.responses++;
      if (response.fromCache) stats.fromCache++;

      await db.transaction(async (tx) => {
        const raw = await storeRawResponse(tx, {
          source: API_ONEPIECE_SOURCE,
          url,
          status: response.status,
          body: response.body,
          fetchedAt: new Date(response.fetchedAt),
        });
        if (raw.changed) stats.rawInserted++;

        if (!raw.changed) {
          const [already] = await tx
            .select({ id: apiOnepiece.id })
            .from(apiOnepiece)
            .where(and(eq(apiOnepiece.resource, resource), eq(apiOnepiece.lang, lang), eq(apiOnepiece.rawResponseId, raw.id)))
            .limit(1);
          if (already) {
            stats.skipped++;
            log(`  ${resource}/${lang} : inchangé (hash identique), parse ignoré`);
            return;
          }
        }

        const result = parseApiOnepieceResponse(resource, response.body);
        const written = await writeApiOnepieceStaging(tx, {
          source: API_ONEPIECE_SOURCE,
          resource,
          lang,
          rawResponseId: raw.id,
          result,
        });
        stats.parsed++;
        stats.records += written.records;
        stats.rejected += written.rejected;
        log(`  ${resource}/${lang} : ${written.records} lignes, ${written.rejected} rejetées`);
      });
    }
  }
  return stats;
}
