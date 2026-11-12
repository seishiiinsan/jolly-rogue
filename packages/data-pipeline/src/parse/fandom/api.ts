import { z } from 'zod';

/**
 * API MediaWiki du One Piece Wiki : construction des URL (ordre des paramètres stable, donc clé
 * de cache stable) et schémas Zod des réponses utilisées (`formatversion=2`).
 */

export const FANDOM_SOURCE = 'fandom';
export const FANDOM_API_URL = 'https://onepiece.fandom.com/api.php';
export const FANDOM_WIKI_URL = 'https://onepiece.fandom.com/wiki/';
/** Licence déclarée par le wiki (`meta=siteinfo&siprop=rightsinfo`), détail sur FANDOM_LICENSE_URL. */
export const FANDOM_LICENSE = 'CC-BY-SA';
export const FANDOM_LICENSE_URL = 'https://www.fandom.com/licensing';

/** Nombre max de titres par requête `prop=revisions` (limite de l'API pour un client non bot). */
export const TITLES_PER_BATCH = 50;

export type ApiParams = Record<string, string>;

export function fandomApiUrl(params: ApiParams): string {
  const query = Object.entries({ action: 'query', format: 'json', formatversion: '2', ...params })
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${FANDOM_API_URL}?${query}`;
}

export const wikiPageUrl = (title: string, revId?: number): string =>
  `${FANDOM_WIKI_URL}${encodeURIComponent(title.replace(/ /g, '_')).replace(/%2F/g, '/').replace(/%3A/g, ':')}${
    revId ? `?oldid=${revId}` : ''
  }`;

// --- Réponses ----------------------------------------------------------------

const continueSchema = z.record(z.string(), z.string()).optional();
const errorSchema = z.object({ error: z.object({ code: z.string(), info: z.string() }) });

const pageRef = z.object({ pageid: z.number().int(), ns: z.number().int(), title: z.string() });

export const embeddedInResponse = z.object({
  continue: continueSchema,
  query: z.object({ embeddedin: z.array(pageRef) }),
});

export const categoryMembersResponse = z.object({
  continue: continueSchema,
  query: z.object({ categorymembers: z.array(pageRef) }),
});

export const revisionsResponse = z.object({
  continue: continueSchema,
  query: z
    .object({
      pages: z.array(
        z.object({
          pageid: z.number().int().optional(),
          ns: z.number().int(),
          title: z.string(),
          missing: z.boolean().optional(),
          invalid: z.boolean().optional(),
          revisions: z
            .array(
              z.object({
                revid: z.number().int(),
                timestamp: z.string(),
                slots: z.object({ main: z.object({ content: z.string() }) }),
              }),
            )
            .optional(),
          categories: z.array(z.object({ ns: z.number().int(), title: z.string() })).optional(),
        }),
      ),
    })
    .optional(),
});

/** Parse le body JSON d'une réponse ; une erreur API (`{error: …}`) lève une exception explicite. */
export function parseApiBody<T extends z.ZodType>(schema: T, body: string, url: string): z.output<T> {
  const json: unknown = JSON.parse(body);
  const apiError = errorSchema.safeParse(json);
  if (apiError.success) throw new Error(`API Fandom : ${apiError.data.error.code} (${apiError.data.error.info}) pour ${url}`);
  const result = schema.safeParse(json);
  if (!result.success) throw new Error(`API Fandom : réponse inattendue pour ${url} : ${result.error.message}`);
  return result.data;
}

/** Pages d'une réponse `prop=revisions` (sans continuation) ; pages manquantes ignorées. */
export function wikiPagesFromResponse(data: z.output<typeof revisionsResponse>): {
  pageId: number;
  title: string;
  revId: number;
  wikitext: string;
  categories: string[];
}[] {
  return (data.query?.pages ?? []).flatMap((p) => {
    const rev = p.revisions?.[0];
    if (p.pageid === undefined || !rev) return [];
    return [
      {
        pageId: p.pageid,
        title: p.title,
        revId: rev.revid,
        wikitext: rev.slots.main.content,
        categories: (p.categories ?? []).map((c) => c.title),
      },
    ];
  });
}
