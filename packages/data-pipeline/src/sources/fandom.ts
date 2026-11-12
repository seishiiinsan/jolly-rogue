import type { Database } from '@jolly-rogue/db';
import type { z } from 'zod';
import type { HttpClient } from '../http/client.js';
import {
  type ApiParams,
  FANDOM_SOURCE,
  TITLES_PER_BATCH,
  categoryMembersResponse,
  embeddedInResponse,
  fandomApiUrl,
  parseApiBody,
  revisionsResponse,
} from '../parse/fandom/api.js';
import { type FandomRecord, type FandomRejection, type WikiPage, parseFandomPage } from '../parse/fandom/page.js';
import { FANDOM_KINDS, INFOBOX_TEMPLATES } from '../parse/fandom/schemas.js';
import { HAKI_CATEGORY_TITLES } from '../parse/fandom/values.js';
import { storeRawResponse } from '../raw/store.js';
import { type FandomStagingRecord, type FandomStagingRejection, writeFandomStaging } from '../staging/fandom.js';

/**
 * Collecte du One Piece Wiki : listing des pages par transclusion des infobox, exclusion du
 * non-canon par catégories, wikitext par lots de 50 titres, puis `Template:… Tabs Top` pour les
 * pages dont l'infobox est dans un template d'onglets. Toutes les réponses passent par `raw`.
 * Écrit uniquement dans `staging` (pas de chargement dans `canon` à ce stade).
 */

/** Arbres de catégories non canon exclus du listing (le wiki n'a pas de catégorie « canon »). */
export const NON_CANON_ROOTS = [
  'Category:Non-Canon Characters',
  'Category:Non-Canon Devil Fruits',
  'Category:Non-Canon Pirate Crews',
];

export interface FandomIngestStats {
  requests: number;
  fromCache: number;
  rawInserted: number;
  listed: number;
  excludedNonCanon: number;
  excludedSubpages: number;
  pages: number;
  templates: number;
  records: number;
  rejected: number;
}

export interface FandomIngestOptions {
  /** Titres à traiter à la place du listing complet (tests, reprise ciblée). */
  titles?: string[];
}

interface FetchedPage extends WikiPage {
  rawResponseId: number;
}

class FandomFetcher {
  readonly stats: FandomIngestStats = {
    requests: 0,
    fromCache: 0,
    rawInserted: 0,
    listed: 0,
    excludedNonCanon: 0,
    excludedSubpages: 0,
    pages: 0,
    templates: 0,
    records: 0,
    rejected: 0,
  };

  constructor(
    private readonly db: Database,
    private readonly http: HttpClient,
    private readonly log: (m: string) => void,
  ) {}

  /** GET → raw.responses → parse Zod. */
  private async get<T extends z.ZodType>(params: ApiParams, schema: T): Promise<{ data: z.output<T>; rawId: number }> {
    const url = fandomApiUrl(params);
    const response = await this.http.get(url);
    this.stats.requests++;
    if (response.fromCache) this.stats.fromCache++;
    const raw = await storeRawResponse(this.db, {
      source: FANDOM_SOURCE,
      url,
      status: response.status,
      body: response.body,
      fetchedAt: new Date(response.fetchedAt),
    });
    if (raw.changed) this.stats.rawInserted++;
    return { data: parseApiBody(schema, response.body, url), rawId: raw.id };
  }

  /** Suit la continuation MediaWiki (`continue`) jusqu'au bout. */
  private async *paginate<T extends z.ZodType<{ continue?: Record<string, string> | undefined }>>(
    params: ApiParams,
    schema: T,
  ): AsyncGenerator<{ data: z.output<T>; rawId: number }> {
    let cont: Record<string, string> | undefined;
    do {
      const page = await this.get({ ...params, ...cont }, schema);
      yield page;
      cont = page.data.continue;
    } while (cont);
  }

  /** Pages de l'espace principal qui transcluent l'infobox (directement ou via un Tabs Top). */
  async listInfoboxPages(): Promise<string[]> {
    const titles = new Set<string>();
    for (const kind of FANDOM_KINDS) {
      let n = 0;
      const params = { list: 'embeddedin', eititle: `Template:${INFOBOX_TEMPLATES[kind]}`, einamespace: '0', eilimit: '500' };
      for await (const { data } of this.paginate(params, embeddedInResponse)) {
        for (const p of data.query.embeddedin) {
          n++;
          titles.add(p.title);
        }
      }
      this.log(`  listing ${INFOBOX_TEMPLATES[kind]} : ${n} pages`);
    }
    this.stats.listed = titles.size;
    // Sous-pages d'onglets (« Monkey D. Luffy/Gallery ») : elles transcluent le Tabs Top de la page mère.
    const main = [...titles].filter((t) => !t.includes('/'));
    this.stats.excludedSubpages = titles.size - main.length;
    return main;
  }

  /** Membres (récursifs) des arbres de catégories non canon. */
  async listNonCanon(): Promise<Set<string>> {
    const pages = new Set<string>();
    const seen = new Set<string>();
    const queue = [...NON_CANON_ROOTS];
    for (let category = queue.shift(); category !== undefined; category = queue.shift()) {
      if (seen.has(category)) continue;
      seen.add(category);
      const params = { list: 'categorymembers', cmtitle: category, cmtype: 'page|subcat', cmlimit: '500' };
      for await (const { data } of this.paginate(params, categoryMembersResponse)) {
        for (const m of data.query.categorymembers) {
          if (m.ns === 14) queue.push(m.title);
          else if (m.ns === 0) pages.add(m.title);
        }
      }
    }
    this.log(`  non canon : ${pages.size} pages dans ${seen.size} catégories`);
    return pages;
  }

  /** Wikitext (+ catégories Haki) par lots de 50 titres triés, continuation incluse. */
  async fetchPages(titles: string[], withCategories: boolean): Promise<{ pages: FetchedPage[]; missing: { title: string; rawId: number }[] }> {
    const byTitle = new Map<string, FetchedPage>();
    const missing: { title: string; rawId: number }[] = [];
    const sorted = [...new Set(titles)].sort();
    for (let i = 0; i < sorted.length; i += TITLES_PER_BATCH) {
      const batch = sorted.slice(i, i + TITLES_PER_BATCH);
      const params: ApiParams = {
        prop: withCategories ? 'revisions|categories' : 'revisions',
        rvprop: 'ids|timestamp|content',
        rvslots: 'main',
        ...(withCategories ? { cllimit: 'max', clcategories: HAKI_CATEGORY_TITLES.join('|') } : {}),
        titles: batch.join('|'),
      };
      for await (const { data, rawId } of this.paginate(params, revisionsResponse)) {
        for (const p of data.query?.pages ?? []) {
          if (p.missing || p.invalid || p.pageid === undefined) {
            if (!missing.some((m) => m.title === p.title)) missing.push({ title: p.title, rawId });
            continue;
          }
          const existing = byTitle.get(p.title);
          const revision = p.revisions?.[0];
          const categories = (p.categories ?? []).map((c) => c.title);
          if (existing) {
            existing.categories.push(...categories.filter((c) => !existing.categories.includes(c)));
            if (revision && existing.wikitext === '') {
              Object.assign(existing, { revId: revision.revid, wikitext: revision.slots.main.content, rawResponseId: rawId });
            }
          } else {
            byTitle.set(p.title, {
              pageId: p.pageid,
              title: p.title,
              revId: revision?.revid ?? 0,
              wikitext: revision?.slots.main.content ?? '',
              categories,
              rawResponseId: rawId,
            });
          }
        }
      }
    }
    return { pages: [...byTitle.values()], missing };
  }
}

export async function fetchAndParseFandom(
  db: Database,
  http: HttpClient,
  options: FandomIngestOptions = {},
  log: (message: string) => void = () => {},
): Promise<FandomIngestStats> {
  const f = new FandomFetcher(db, http, log);

  let titles: string[];
  if (options.titles) {
    titles = options.titles;
  } else {
    const listed = await f.listInfoboxPages();
    const nonCanon = await f.listNonCanon();
    titles = listed.filter((t) => !nonCanon.has(t));
    f.stats.excludedNonCanon = listed.length - titles.length;
  }
  log(`  ${titles.length} pages à récupérer`);

  const { pages, missing } = await f.fetchPages(titles, true);
  f.stats.pages = pages.length;

  const records: FandomStagingRecord[] = [];
  const rejections: FandomStagingRejection[] = missing.map(({ title, rawId }) => ({
    kind: 'page',
    externalId: title,
    errors: [{ path: 'page', message: `page introuvable : ${title}` }],
    rawResponseId: rawId,
  }));

  const pending: { page: FetchedPage; template: string }[] = [];
  const collect = (page: FetchedPage, parsed: { records: FandomRecord[]; rejections: FandomRejection[] }): void => {
    for (const r of parsed.records) records.push({ ...r, page });
    for (const r of parsed.rejections) {
      rejections.push({ kind: r.kind, externalId: String(page.pageId), errors: r.errors, rawResponseId: page.rawResponseId });
    }
  };
  for (const page of pages) {
    const parsed = parseFandomPage(page);
    if (parsed.status === 'needs-template') pending.push({ page, template: parsed.template });
    else collect(page, parsed);
  }

  if (pending.length > 0) {
    log(`  ${pending.length} pages avec infobox dans un Tabs Top`);
    const fetched = await f.fetchPages(
      pending.map((p) => p.template),
      false,
    );
    f.stats.templates = fetched.pages.length;
    const templates = new Map(fetched.pages.map((t) => [t.title, t]));
    for (const { page, template } of pending) {
      const parsed = parseFandomPage(page, templates.get(template) ?? { ...page, title: template, wikitext: '' });
      if (parsed.status === 'parsed') collect(page, parsed);
    }
  }

  const written = await db.transaction((tx) => writeFandomStaging(tx, records, rejections));
  f.stats.records = written.records;
  f.stats.rejected = written.rejected;
  return f.stats;
}
