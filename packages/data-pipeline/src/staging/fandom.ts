import { fandom, rejections } from '@jolly-rogue/db';
import { and, eq, notInArray, sql } from 'drizzle-orm';
import type { Executor } from '../db.js';
import { FANDOM_LICENSE, FANDOM_SOURCE, wikiPageUrl } from '../parse/fandom/api.js';
import type { FandomRecord, FandomRejection, WikiPage } from '../parse/fandom/page.js';
import { FANDOM_KINDS } from '../parse/fandom/schemas.js';
import { type StagingWriteResult, chunks } from './write.js';

export interface FandomStagingRecord extends FandomRecord {
  page: WikiPage & { rawResponseId: number };
}

export interface FandomStagingRejection {
  kind: FandomRejection['kind'];
  externalId: string;
  errors: FandomRejection['errors'];
  rawResponseId: number;
}

const REJECTION_RESOURCES = [...FANDOM_KINDS, 'page'] as const;

/**
 * Écrit l'état complet de la dernière collecte Fandom dans `staging.fandom` et `staging.rejections`.
 * Une ligne identique n'est pas réécrite ; une ligne absente de la collecte est supprimée.
 * Chaque ligne porte la licence du wiki et le permalien de la révision lue.
 */
export async function writeFandomStaging(
  db: Executor,
  records: FandomStagingRecord[],
  rejected: FandomStagingRejection[],
): Promise<StagingWriteResult> {
  for (const kind of FANDOM_KINDS) {
    const ids = records.filter((r) => r.kind === kind).map((r) => r.page.pageId);
    const scope = eq(fandom.kind, kind);
    await db.delete(fandom).where(ids.length > 0 ? and(scope, notInArray(fandom.pageId, ids)) : scope);
  }

  const rows = records.map((r) => ({
    kind: r.kind,
    pageId: r.page.pageId,
    title: r.page.title,
    revId: r.page.revId,
    sourceUrl: wikiPageUrl(r.page.title, r.page.revId),
    license: FANDOM_LICENSE,
    data: { ...r.data, ...(r.infoboxPage.title !== r.page.title ? { infoboxPage: r.infoboxPage } : {}) },
    rawResponseId: r.page.rawResponseId,
  }));
  for (const chunk of chunks(rows, 500)) {
    await db
      .insert(fandom)
      .values(chunk)
      .onConflictDoUpdate({
        target: [fandom.kind, fandom.pageId],
        set: {
          title: sql`excluded.title`,
          revId: sql`excluded.rev_id`,
          sourceUrl: sql`excluded.source_url`,
          license: sql`excluded.license`,
          data: sql`excluded.data`,
          rawResponseId: sql`excluded.raw_response_id`,
        },
        setWhere: sql`(${fandom.title}, ${fandom.revId}, ${fandom.sourceUrl}, ${fandom.license}, ${fandom.data}, ${fandom.rawResponseId})
          IS DISTINCT FROM (excluded.title, excluded.rev_id, excluded.source_url, excluded.license, excluded.data, excluded.raw_response_id)`,
      });
  }

  for (const resource of REJECTION_RESOURCES) {
    const ids = rejected.filter((r) => r.kind === resource).map((r) => r.externalId);
    const scope = and(eq(rejections.source, FANDOM_SOURCE), eq(rejections.resource, resource), eq(rejections.lang, 'en'));
    await db.delete(rejections).where(ids.length > 0 ? and(scope, notInArray(rejections.externalId, ids)) : scope);
  }
  for (const chunk of chunks(rejected, 500)) {
    await db
      .insert(rejections)
      .values(
        chunk.map((r) => ({
          source: FANDOM_SOURCE,
          resource: r.kind,
          lang: 'en',
          externalId: r.externalId,
          errors: r.errors,
          rawResponseId: r.rawResponseId,
        })),
      )
      .onConflictDoUpdate({
        target: [rejections.source, rejections.resource, rejections.lang, rejections.externalId],
        set: { errors: sql`excluded.errors`, rawResponseId: sql`excluded.raw_response_id` },
        setWhere: sql`(${rejections.errors}, ${rejections.rawResponseId}) IS DISTINCT FROM (excluded.errors, excluded.raw_response_id)`,
      });
  }

  return { records: rows.length, rejected: rejected.length };
}
