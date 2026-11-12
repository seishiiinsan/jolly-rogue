import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb, runMigrations } from '@jolly-rogue/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildCanonExport, serializeCanonExport } from '../src/export/canon-json.js';
import { HttpClient, cacheKey } from '../src/http/client.js';
import { ingestApiOnepiece, ingestFandom } from '../src/ingest.js';
import { API_ONEPIECE_LANGS, API_ONEPIECE_RESOURCES, apiOnepieceUrl } from '../src/parse/api-onepiece.js';
import { CONFIG_DIR, type ReconcileConfig, loadReconcileConfig } from '../src/reconcile/config.js';
import { reconcile } from '../src/reconcile/index.js';
import { buildReport } from '../src/report/report.js';
import { fandomFixtureBody, fixtureTitles, fixtureUrls } from './fandom-helpers.js';
import { FIXTURE_FETCHED_AT, fixtureBody } from './helpers.js';

/**
 * Pipeline complet en --offline contre une base PostgreSQL jetable, créée puis supprimée par le test :
 * ingest api-onepiece + Fandom (cache pré-rempli avec les fixtures) → reconcile → export → report.
 * Nécessite TEST_DATABASE_URL (un utilisateur autorisé à créer des bases), par exemple la base Docker :
 *   TEST_DATABASE_URL=postgres://jolly:change-me@127.0.0.1:5432/jolly_rogue pnpm -r test
 */
const adminUrl = process.env['TEST_DATABASE_URL'];
const TEST_OVERRIDES = fileURLToPath(new URL('./overrides', import.meta.url));

describe.skipIf(!adminUrl)('pipeline complet --offline (intégration)', () => {
  const dbName = `jolly_rogue_test_${process.pid}_${Date.now()}`;
  let admin: ReturnType<typeof createDb>['client'];
  let conn: ReturnType<typeof createDb>;
  let cacheDir: string;
  let config: ReconcileConfig;

  beforeAll(async () => {
    admin = createDb(adminUrl ?? '', { max: 1, onnotice: () => {} }).client;
    await admin.unsafe(`CREATE DATABASE "${dbName}"`);
    const url = new URL(adminUrl ?? '');
    url.pathname = `/${dbName}`;
    conn = createDb(url.toString(), { max: 1, onnotice: () => {} });
    await runMigrations(conn.db);
    config = await loadReconcileConfig({ config: CONFIG_DIR, overrides: TEST_OVERRIDES });

    // Cache disque pré-rempli avec les fixtures : aucune requête réseau possible en --offline.
    cacheDir = await mkdtemp(path.join(tmpdir(), 'pipeline-cache-'));
    const write = (url: string, body: string) =>
      writeFile(path.join(cacheDir, `${cacheKey(url)}.json`), JSON.stringify({ url, status: 200, body, fetchedAt: FIXTURE_FETCHED_AT }));
    for (const resource of API_ONEPIECE_RESOURCES) {
      for (const lang of API_ONEPIECE_LANGS) await write(apiOnepieceUrl(resource, lang), fixtureBody(resource, lang));
    }
    const urls = fixtureUrls();
    for (const name of ['pages', 'templates'] as const) await write(urls[name], fandomFixtureBody(name));
  });

  afterAll(async () => {
    await conn?.client.end();
    await admin?.unsafe(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    await admin?.end();
    if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
  });

  const http = () =>
    new HttpClient({ cacheDir, userAgent: 'test', offline: true, fetch: () => Promise.reject(new Error('réseau interdit')) });

  /** Ingest des deux sources puis reconcile, comme `pipeline all` (sans migrate, export ni report). */
  async function runAll() {
    const api = await ingestApiOnepiece(conn.db, http());
    const fandom = await ingestFandom(conn.db, http(), { titles: fixtureTitles() });
    const result = await reconcile(conn.db, config);
    return { api, fandom, ...result };
  }

  /** Empreinte de toutes les lignes : xmin change à chaque UPDATE, même sans changement de valeur. */
  async function snapshot(): Promise<Record<string, string[]>> {
    const tables = await conn.client<{ schema: string; name: string }[]>`
      select table_schema as schema, table_name as name from information_schema.tables
      where table_schema in ('raw', 'staging', 'canon') and table_type = 'BASE TABLE' order by 1, 2`;
    const result: Record<string, string[]> = {};
    for (const t of tables) {
      const rows = await conn.client.unsafe<{ fp: string }[]>(
        `select xmin::text || ':' || md5(t::text) as fp from "${t.schema}"."${t.name}" t order by 1`,
      );
      result[`${t.schema}.${t.name}`] = rows.map((r) => r.fp);
    }
    return result;
  }

  it('ingest ne touche pas à canon ; deux exécutions complètes de suite ne modifient aucune ligne', async () => {
    const api = await ingestApiOnepiece(conn.db, http());
    expect(api).toMatchObject({ responses: 12, fromCache: 12, rawInserted: 12, rejected: 2 });
    const [canonRows] = await conn.client<{ n: number }[]>`select count(*)::int as n from canon.characters`;
    expect(canonRows?.n).toBe(0);

    const first = await runAll();
    // 25 persos api (1 rejeté) + 7 pages Fandom sans équivalent dans les fixtures api (Borsalino, Smoker…).
    expect(first.apply.entities['characters']).toEqual({ inserted: 32, updated: 0, unchanged: 0 });
    const before = await snapshot();

    const second = await runAll();
    expect(second.api).toMatchObject({ rawInserted: 0, parsed: 0, skipped: 12 });
    expect(second.fandom).toMatchObject({ rawInserted: 0 });
    for (const s of Object.values(second.apply.entities)) expect(s).toMatchObject({ inserted: 0, updated: 0 });
    expect(second.apply.writes).toEqual({});
    expect(await snapshot()).toEqual(before);
  });

  it('rapprochement : nom normalisé, alias, homonyme écarté ; slugs api-onepiece figés', async () => {
    const rows = await conn.client<{ slug: string; source: string; external_id: string }[]>`
      select c.slug, e.source, e.external_id from canon.characters c
      join canon.external_ids e on e.entity = 'characters' and e.entity_id = c.id
      where c.slug in ('monkey-d-luffy', 'marchall-d-teach-barbe-noire', 'tama-sphinx', 'tony-tony-chopper') order by 1, 2`;
    expect(rows.map((r) => `${r.slug} ${r.source}`)).toEqual([
      'marchall-d-teach-barbe-noire api-onepiece',
      'marchall-d-teach-barbe-noire fandom', // alias
      'monkey-d-luffy api-onepiece',
      'monkey-d-luffy fandom', // « Monkey D Luffy » = « Monkey D. Luffy »
      'tama-sphinx fandom', // alias null : créé seul
      'tony-tony-chopper api-onepiece',
      'tony-tony-chopper fandom', // « Tony-Tony Chopper » = « Tony Tony Chopper »
    ]);
    const wolves = await conn.client<{ slug: string }[]>`select slug from canon.characters where slug like 'sanjuan-wolf%' order by 1`;
    expect(wolves.map((w) => w.slug)).toEqual(['sanjuan-wolf', 'sanjuan-wolf-264']);
  });

  it('priorité par champ : name_fr depuis api-onepiece, prime et âge depuis Fandom, provenance tracée', async () => {
    const rows = await conn.client<{ field: string; source: string; license: string | null }[]>`
      select p.field, p.source, p.license from canon.provenance p
      join canon.characters c on p.entity = 'characters' and p.entity_id = c.id
      where c.slug = 'roronoa-zoro' order by 1`;
    const by = Object.fromEntries(rows.map((r) => [r.field, r]));
    expect(by['name_fr']).toMatchObject({ source: 'api-onepiece', license: null });
    expect(by['bounties']).toMatchObject({ source: 'fandom', license: 'CC-BY-SA' });
    expect(by['age']).toMatchObject({ source: 'fandom' });
    expect(by['haki']).toMatchObject({ source: 'fandom' });

    const [nami] = await conn.client<{ field: string; source: string }[]>`
      select p.field, p.source from canon.provenance p join canon.characters c on p.entity = 'characters' and p.entity_id = c.id
      where c.slug = 'nami' and p.field = 'age'`;
    expect(nami).toEqual({ field: 'age', source: 'override' });
  });

  it('export : Chapeau de paille complet (10 membres, fruits et primes actuels), sortie stable', async () => {
    const data = await buildCanonExport(conn.db);
    const members = data.characters.filter((c) => c.affiliations.some((a) => a.crew === 'mugiwara-no-ichimi' && a.isCurrent));
    expect(members.map((c) => c.slug)).toEqual([
      'brook',
      'franky',
      'jinbe',
      'monkey-d-luffy',
      'nami',
      'nico-robin',
      'roronoa-zoro',
      'sanji',
      'tony-tony-chopper',
      'usopp',
    ]);
    const current = (c: (typeof members)[number]) => ({
      fruits: c.devilFruits.filter((f) => f.isCurrent).map((f) => f.fruit),
      bounty: c.bounties.find((b) => b.isCurrent)?.amountBerry,
    });
    expect(Object.fromEntries(members.map((c) => [c.slug, current(c)]))).toEqual({
      brook: { fruits: ['yomi-yomi-no-mi'], bounty: 383_000_000 },
      // Les fixtures api n'ont pas le Gomu Gomu no Mi : la page Fandom (deux identités) est rapprochée
      // par son autre nom, « Hito Hito no Mi, Model: Nika ».
      franky: { fruits: [], bounty: 394_000_000 },
      jinbe: { fruits: [], bounty: 1_100_000_000 },
      'monkey-d-luffy': { fruits: ['hito-hito-no-mi-moderu-nika'], bounty: 3_000_000_000 },
      nami: { fruits: [], bounty: 366_000_000 },
      'nico-robin': { fruits: ['hana-hana-no-mi'], bounty: 930_000_000 },
      'roronoa-zoro': { fruits: [], bounty: 1_111_000_000 },
      sanji: { fruits: [], bounty: 1_032_000_000 },
      'tony-tony-chopper': { fruits: ['hito-hito-no-mi'], bounty: 1000 },
      usopp: { fruits: [], bounty: 500_000_000 },
    });
    expect(data.crews.find((c) => c.slug === 'mugiwara-no-ichimi')).toMatchObject({ captain: 'monkey-d-luffy', kind: 'pirate' });
    // Zeus reste rattaché, mais plus comme membre actuel (corrections.yaml).
    expect(data.characters.find((c) => c.slug === 'zeus')?.affiliations).toContainEqual({
      crew: 'mugiwara-no-ichimi',
      role: 'Nami Arme',
      isCurrent: false,
    });
    expect(data.sources.map((s) => s.name)).toEqual(['api-onepiece', 'fandom', 'override']);
    expect(serializeCanonExport(await buildCanonExport(conn.db))).toBe(serializeCanonExport(data));
  });

  it('rapport : non-rapprochés, conflits, corrections, contrôle du Chapeau de paille, stable', async () => {
    const report = await buildReport(conn.db, config);
    expect(report).toContain('| api-onepiece | characters | en | 256 | size: taille non reconnu(e) : "352cl" |');
    expect(report).toContain('## Entités non rapprochées');
    // Deuxième exécution : les pages déjà créées sont reconnues par leur id.
    expect(report).toContain('| pirate-bear | Pirate Bear | déjà créée (id connu) |');
    expect(report).toContain('| tama-sphinx | Tama (Sphinx) | alias `api-onepiece: null` |');
    expect(report).toMatch(/\| roronoa-zoro \| 1111000000 \(fandom\) \| 1101000000 \(api-onepiece\) \|/);
    expect(report).toContain('| characters | nami | age | 20 | 21 | correction scalaire de test | 2026-11-12 |');
    expect(report).toContain('**10 membres actuels** (attendu : 10), 4 fruits actuels, 10 primes actuelles. Contrôle **OK**.');
    expect(report).toContain('| characters | Sanjuan Wolf | sanjuan-wolf | sanjuan-wolf-264 |');
    expect(await buildReport(conn.db, config)).toBe(report);
  });
});
