import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createDb, runMigrations } from '@jolly-rogue/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildCanonExport, serializeCanonExport } from '../src/export/canon-json.js';
import { HttpClient, cacheKey } from '../src/http/client.js';
import { ingestApiOnepiece } from '../src/ingest.js';
import { API_ONEPIECE_LANGS, API_ONEPIECE_RESOURCES, apiOnepieceUrl } from '../src/parse/api-onepiece.js';
import { buildReport } from '../src/report/report.js';
import { FIXTURE_FETCHED_AT, fixtureBody } from './helpers.js';

/**
 * Pipeline complet en --offline contre une base PostgreSQL jetable, créée puis supprimée par le test.
 * Nécessite TEST_DATABASE_URL (un utilisateur autorisé à créer des bases), par exemple la base Docker :
 *   TEST_DATABASE_URL=postgres://jolly:change-me@127.0.0.1:5432/jolly_rogue pnpm -r test
 */
const adminUrl = process.env['TEST_DATABASE_URL'];

describe.skipIf(!adminUrl)('ingest api-onepiece --offline (intégration)', () => {
  const dbName = `jolly_rogue_test_${process.pid}_${Date.now()}`;
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

    // Cache disque pré-rempli avec les fixtures : aucune requête réseau possible en --offline.
    cacheDir = await mkdtemp(path.join(tmpdir(), 'pipeline-cache-'));
    await mkdir(cacheDir, { recursive: true });
    for (const resource of API_ONEPIECE_RESOURCES) {
      for (const lang of API_ONEPIECE_LANGS) {
        const url = apiOnepieceUrl(resource, lang);
        const entry = { url, status: 200, body: fixtureBody(resource, lang), fetchedAt: FIXTURE_FETCHED_AT };
        await writeFile(path.join(cacheDir, `${cacheKey(url)}.json`), JSON.stringify(entry));
      }
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

  it('deux ingest de suite ne modifient aucune ligne', async () => {
    const first = await ingestApiOnepiece(conn.db, http());
    expect(first.fetch).toMatchObject({ responses: 12, fromCache: 12, rawInserted: 12, rejected: 2 });
    expect(first.load.entities['characters']).toEqual({ inserted: 25, updated: 0, unchanged: 0 });
    const before = await snapshot();
    expect(before['canon.characters']).toHaveLength(25);

    const second = await ingestApiOnepiece(conn.db, http());
    expect(second.fetch).toMatchObject({ rawInserted: 0, parsed: 0, skipped: 12 });
    for (const s of Object.values(second.load.entities)) expect(s).toMatchObject({ inserted: 0, updated: 0 });
    for (const s of Object.values(second.load.relations)) expect(s.written).toBe(0);
    expect(await snapshot()).toEqual(before);
  });

  it('slugs figés : collision suffixée par l’id source', async () => {
    const rows = await conn.client<{ slug: string; external_id: string }[]>`
      select c.slug, e.external_id from canon.characters c
      join canon.external_ids e on e.entity = 'characters' and e.entity_id = c.id
      where c.slug like 'sanjuan-wolf%' order by 1`;
    expect(rows).toEqual([
      { slug: 'sanjuan-wolf', external_id: '254' },
      { slug: 'sanjuan-wolf-264', external_id: '264' },
    ]);
  });

  it('provenance remplie champ par champ', async () => {
    const rows = await conn.client<{ field: string; source_url: string }[]>`
      select p.field, p.source_url from canon.provenance p
      join canon.characters c on p.entity = 'characters' and p.entity_id = c.id
      where c.slug = 'monkey-d-luffy' order by 1`;
    expect(rows.map((r) => r.field)).toEqual(['affiliations', 'age', 'bounty', 'fruits', 'height_cm', 'name_en', 'name_fr', 'status']);
    expect(rows.find((r) => r.field === 'name_fr')?.source_url).toBe('https://api.api-onepiece.com/v2/characters/fr');
  });

  it('export : Chapeaux de paille avec leurs fruits, sortie stable', async () => {
    const data = await buildCanonExport(conn.db);
    const mugiwara = data.characters.filter((c) => c.affiliations.some((a) => a.crew === 'mugiwara-no-ichimi'));
    expect(mugiwara.map((c) => c.slug)).toEqual([
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
      'zeus',
    ]);
    expect(Object.fromEntries(mugiwara.filter((c) => c.devilFruits.length).map((c) => [c.slug, c.devilFruits]))).toEqual({
      brook: [{ fruit: 'yomi-yomi-no-mi', isCurrent: true }],
      'monkey-d-luffy': [{ fruit: 'hito-hito-no-mi-moderu-nika', isCurrent: true }],
      'nico-robin': [{ fruit: 'hana-hana-no-mi', isCurrent: true }],
      'tony-tony-chopper': [{ fruit: 'hito-hito-no-mi', isCurrent: true }],
    });
    expect(data.crews.find((c) => c.slug === 'mugiwara-no-ichimi')).toMatchObject({ captain: 'monkey-d-luffy', kind: 'pirate' });
    expect(serializeCanonExport(await buildCanonExport(conn.db))).toBe(serializeCanonExport(data));
  });

  it('rapport : rejets, anomalies et collisions listés', async () => {
    const report = await buildReport(conn.db);
    expect(report).toContain('| api-onepiece | characters | en | 256 | size: taille non reconnu(e) : "352cl" |');
    expect(report).toContain('Fruits à plusieurs porteurs vivants');
    expect(report).toContain('| characters | 264 | sanjuan-wolf | sanjuan-wolf-264 |');
    expect(await buildReport(conn.db)).toBe(report);
  });
});
