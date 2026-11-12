import { createHash } from 'node:crypto';
import { responses } from '@jolly-rogue/db';
import { desc, eq } from 'drizzle-orm';
import type { Executor } from '../db.js';

export interface RawResponseInput {
  source: string;
  url: string;
  status: number;
  body: string;
  fetchedAt: Date;
}

export interface StoredRawResponse {
  id: number;
  /** `false` : même hash que la dernière collecte de cette URL, rien n'a été inséré. */
  changed: boolean;
}

export const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex');

/** Stocke la réponse brute avant tout parsing (append-only, dédupliqué par hash sur la dernière collecte). */
export async function storeRawResponse(db: Executor, input: RawResponseInput): Promise<StoredRawResponse> {
  const hash = sha256(input.body);
  const [latest] = await db
    .select({ id: responses.id, hash: responses.hash })
    .from(responses)
    .where(eq(responses.url, input.url))
    .orderBy(desc(responses.fetchedAt), desc(responses.id))
    .limit(1);
  if (latest?.hash === hash) return { id: latest.id, changed: false };

  const [inserted] = await db
    .insert(responses)
    .values({ ...input, hash })
    .returning({ id: responses.id });
  if (!inserted) throw new Error(`raw.responses : insertion impossible pour ${input.url}`);
  return { id: inserted.id, changed: true };
}
