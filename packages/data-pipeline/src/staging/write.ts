import { apiOnepiece, rejections } from '@jolly-rogue/db';
import { and, eq, notInArray, sql } from 'drizzle-orm';
import type { Executor } from '../db.js';
import type { ParseResult } from '../parse/api-onepiece.js';

export interface StagingWriteResult {
  records: number;
  rejected: number;
}

/**
 * Écrit le résultat du parsing d'une réponse dans `staging.api_onepiece` et `staging.rejections`.
 * Une ligne identique n'est pas réécrite (`setWhere … IS DISTINCT FROM`) ; les lignes qui ont
 * disparu de la réponse sont supprimées pour que staging reflète la dernière collecte.
 */
export async function writeApiOnepieceStaging(
  db: Executor,
  params: { source: string; resource: string; lang: string; rawResponseId: number; result: ParseResult<unknown> },
): Promise<StagingWriteResult> {
  const { source, resource, lang, rawResponseId, result } = params;

  const recordIds = result.records.map((r) => r.externalId);
  const scope = and(eq(apiOnepiece.resource, resource), eq(apiOnepiece.lang, lang));
  await db
    .delete(apiOnepiece)
    .where(recordIds.length > 0 ? and(scope, notInArray(apiOnepiece.externalId, recordIds)) : scope);
  for (const chunk of chunks(result.records, 500)) {
    await db
      .insert(apiOnepiece)
      .values(chunk.map((r) => ({ resource, lang, externalId: r.externalId, data: r.data, rawResponseId })))
      .onConflictDoUpdate({
        target: [apiOnepiece.resource, apiOnepiece.lang, apiOnepiece.externalId],
        set: { data: sql`excluded.data`, rawResponseId: sql`excluded.raw_response_id` },
        setWhere: sql`(${apiOnepiece.data}, ${apiOnepiece.rawResponseId}) IS DISTINCT FROM (excluded.data, excluded.raw_response_id)`,
      });
  }

  const rejectedIds = result.rejections.map((r) => r.externalId);
  const rejectionScope = and(eq(rejections.source, source), eq(rejections.resource, resource), eq(rejections.lang, lang));
  await db
    .delete(rejections)
    .where(rejectedIds.length > 0 ? and(rejectionScope, notInArray(rejections.externalId, rejectedIds)) : rejectionScope);
  for (const chunk of chunks(result.rejections, 500)) {
    await db
      .insert(rejections)
      .values(chunk.map((r) => ({ source, resource, lang, externalId: r.externalId, errors: r.errors, rawResponseId })))
      .onConflictDoUpdate({
        target: [rejections.source, rejections.resource, rejections.lang, rejections.externalId],
        set: { errors: sql`excluded.errors`, rawResponseId: sql`excluded.raw_response_id` },
        setWhere: sql`(${rejections.errors}, ${rejections.rawResponseId}) IS DISTINCT FROM (excluded.errors, excluded.raw_response_id)`,
      });
  }

  return { records: result.records.length, rejected: result.rejections.length };
}

export function* chunks<T>(items: readonly T[], size: number): Generator<T[]> {
  for (let i = 0; i < items.length; i += size) yield items.slice(i, i + size);
}
