import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createDb, runMigrations } from '@jolly-rogue/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HttpClient, cacheKey } from '../src/http/client.js';
import { ingestFandom } from '../src/ingest.js';
import { buildReport } from '../src/report/report.js';
import { fandomFixtureBody, fixtureTitles, fixtureUrls } from './fandom-helpers.js';
import { FIXTURE_FETCHED_AT } from './helpers.js';

/**
 * Collecte Fandom en --offline contre une base jetable : cache pré-rempli avec les fixtures,
 * liste de titres injectée (le listing complet n'est pas rejoué). Voir ingest.integration.test.ts.
 */
const adminUrl = process.env['TEST_DATABASE_URL'];

describe.skipIf(!adminUrl)('ingest fandom --offline (intégration)', () => {
  const dbName = `jolly_rogue_test_fandom_${process.pid}_${Date.now()}`;
  let admin: ReturnType<typeof createDb>['client'];
  let conn: ReturnType<typeof createDb>;
  let cacheDir: string;

  beforeAll(async () => {
    admin = createDb(adminUrl ?? '', { max: 1, onnotice: () => {} }).client;
    await admin.unsafe(`CREATE DATABASE "${dbName}"`);
    const url = new URL(adminUrl ?? '');
    url.pathname = `/${dbName}`;
    conn = createDb(url.toString(), { max: 1, onnotice: () => {} });
    await runMigrations(conn.db);

    cacheDir = await mkdtemp(path.join(tmpdir(), 'pipeline-cache-fandom-'));
    const urls = fixtureUrls();
    for (const name of ['pages', 'templates'] as const) {
      const entry = { url: urls[name], status: 200, body: fandomFixtureBody(name), fetchedAt: FIXTURE_FETCHED_AT };
      await writeFile(path.join(cacheDir, `${cacheKey(urls[name])}.json`), JSON.stringify(entry));
    }
  });

  afterAll(async () => {
    await conn?.client.end();
    await admin?.unsafe(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    await admin?.end();
    if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
  });

  const http = () =>
    new HttpClient({ cacheDir, userAgent: 'test', offline: true, fetch: () => Promise.reject(new Error('réseau interdit')) });

  async function fingerprint(): Promise<string[]> {
    const rows = await conn.client.unsafe<{ fp: string }[]>(
      `select xmin::text || ':' || md5(t::text) as fp from (
         select 'fandom' as tbl, f::text as t, f.xmin from staging.fandom f
         union all select 'rejections', r::text, r.xmin from staging.rejections r
         union all select 'raw', x.id::text, x.xmin from raw.responses x
       ) t order by 1`,
    );
    return rows.map((r) => r.fp);
  }

  it('remplit staging.fandom, rien dans canon, et deux exécutions ne changent aucune ligne', async () => {
    const titles = fixtureTitles();
    const first = await ingestFandom(conn.db, http(), { titles });
    expect(first).toMatchObject({ requests: 2, fromCache: 2, rawInserted: 2, pages: titles.length - 1, rejected: 1 });
    expect(first.records).toBe(13);

    const kinds = await conn.client<{ kind: string; n: number }[]>`
      select kind, count(*)::int as n from staging.fandom group by kind order by kind`;
    expect(kinds).toEqual([
      { kind: 'character', n: 10 },
      { kind: 'crew', n: 1 },
      { kind: 'devil_fruit', n: 2 },
    ]);
    const [canonRows] = await conn.client<{ n: number }[]>`select count(*)::int as n from canon.characters`;
    expect(canonRows?.n).toBe(0);

    const before = await fingerprint();
    const second = await ingestFandom(conn.db, http(), { titles });
    expect(second).toMatchObject({ rawInserted: 0, records: 13, rejected: 1 });
    expect(await fingerprint()).toEqual(before);
  });

  it('licence et permalien sur chaque ligne', async () => {
    const rows = await conn.client<{ title: string; license: string; source_url: string; data: { infoboxPage?: { title: string } } }[]>`
      select title, license, source_url, data from staging.fandom order by title`;
    expect(rows.every((r) => r.license === 'CC-BY-SA')).toBe(true);
    const luffy = rows.find((r) => r.title === 'Monkey D. Luffy');
    expect(luffy?.source_url).toMatch(/^https:\/\/onepiece\.fandom\.com\/wiki\/Monkey_D\._Luffy\?oldid=\d+$/);
    expect(luffy?.data.infoboxPage?.title).toBe('Template:Monkey D. Luffy Tabs Top');
  });

  it('rapport : page rejetée listée, staging.fandom compté, licence de la source', async () => {
    const report = await buildReport(conn.db);
    expect(report).toContain('| fandom | page | en | Jolly Rogue Fixture Missing Page | page: page introuvable : Jolly Rogue Fixture Missing Page |');
    expect(report).toContain('| staging.fandom | 13 |');
    expect(report).toContain('| fandom | https://onepiece.fandom.com | CC-BY-SA |');
  });
});
