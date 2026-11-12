import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { planApiOnepiece } from '../src/load/plan.js';
import { wikiPageUrl } from '../src/parse/fandom/api.js';
import { CONFIG_DIR, OVERRIDES_DIR, type ReconcileConfig, loadReconcileConfig } from '../src/reconcile/config.js';
import { type FandomRow, type ReconcileInput, buildReconcileModel } from '../src/reconcile/model.js';
import { fixtureTitles, parseFixture } from './fandom-helpers.js';
import { FIXTURE_FETCHED_AT, stagingFromFixtures } from './helpers.js';

const TEST_OVERRIDES = fileURLToPath(new URL('./overrides', import.meta.url));

/** staging.fandom tel que l'écrirait l'ingest à partir des fixtures (sans base). */
function fandomFromFixtures(): FandomRow[] {
  let pageId = 0;
  return fixtureTitles().flatMap((title) => {
    pageId++;
    if (title === 'Jolly Rogue Fixture Missing Page') return [];
    return parseFixture(title).records.map((r) => ({
      kind: r.kind,
      pageId,
      title,
      sourceUrl: wikiPageUrl(title, 1),
      fetchedAt: new Date(FIXTURE_FETCHED_AT),
      data: r.data,
    }));
  });
}

const emptyState = (): ReconcileInput['existing'] => ({
  externalIds: [],
  slugs: { locations: new Map(), sagas: new Map(), arcs: new Map(), devil_fruits: new Map(), crews: new Map(), characters: new Map() },
});

describe('modèle de réconciliation (fixtures réelles, sans base)', () => {
  let config: ReconcileConfig;
  let input: ReconcileInput;
  beforeAll(async () => {
    config = await loadReconcileConfig({ config: CONFIG_DIR, overrides: TEST_OVERRIDES });
    const apiStaging = stagingFromFixtures();
    input = { apiStaging, apiPlan: planApiOnepiece(apiStaging), fandom: fandomFromFixtures(), existing: emptyState(), config };
  });
  const character = (slug: string) => buildReconcileModel(input).entities.characters.find((c) => c.slug === slug);

  it('est déterministe', () => {
    expect(buildReconcileModel(input)).toEqual(buildReconcileModel(input));
  });

  it('priorité par champ : Fandom pour âge, statut, épithète ; api-onepiece pour name_fr', () => {
    const zoro = character('roronoa-zoro');
    expect(zoro?.values).toMatchObject({ nameFr: 'Roronoa Zoro', nameJp: 'ロロノア・ゾロ', status: 'alive' });
    expect(zoro?.provenance['name_fr']?.source).toBe('api-onepiece');
    expect(zoro?.provenance['name_en']?.source).toBe('fandom');
    expect(zoro?.provenance['epithet']).toMatchObject({ source: 'fandom', license: 'CC-BY-SA' });
  });

  it('conflit tracé quand deux sources ont des valeurs différentes', () => {
    const model = buildReconcileModel(input);
    expect(model.conflicts).toContainEqual({
      entity: 'characters',
      slug: 'roronoa-zoro',
      field: 'bounties',
      chosen: { source: 'fandom', value: '1111000000' },
      others: [{ source: 'api-onepiece', value: '1101000000' }],
    });
    // Même texte après normalisation : pas un conflit.
    expect(model.conflicts.find((c) => c.slug === 'monkey-d-luffy' && c.field === 'name_en')).toBeUndefined();
  });

  it('copie artificielle : vers le clone api-onepiece, le porteur d’origine reste actuel', () => {
    const model = buildReconcileModel(input);
    const keyOf = (slug: string) => model.entities.devil_fruits.find((f) => f.slug === slug)?.key;
    const sHawk = model.entities.characters.find((c) => c.slug === 's-hawk')?.key;
    expect(model.relations.fruits.filter((f) => f.character === sHawk)).toEqual([
      { character: sHawk, fruit: keyOf('supa-supa-no-mi-clone'), isCurrent: true },
    ]);
    expect(model.issues.filter((i) => i.kind === 'fruit-multiple-holders')).toEqual([]);
  });

  it('corrections appliquées en dernier, avec provenance « override »', () => {
    const model = buildReconcileModel(input);
    const nami = model.entities.characters.find((c) => c.slug === 'nami');
    expect(nami?.values['age']).toBe(21);
    expect(nami?.provenance['age']).toMatchObject({ source: 'override', fetchedAt: new Date('2026-11-12T00:00:00.000Z') });
    const zeus = model.entities.characters.find((c) => c.slug === 'zeus')?.key;
    expect(model.relations.affiliations.filter((a) => a.character === zeus && a.isCurrent).map((a) => a.crew)).not.toContain(
      model.entities.crews.find((c) => c.slug === 'mugiwara-no-ichimi')?.key,
    );
  });

  it('correction sur un slug inconnu : erreur explicite', () => {
    const bad = { ...config, corrections: [{ ...config.corrections[0], slug: 'inconnu' } as ReconcileConfig['corrections'][number]] };
    expect(() => buildReconcileModel({ ...input, config: bad })).toThrow(/« inconnu » introuvable/);
  });
});

describe('fichiers de configuration', () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'pipeline-overrides-'));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('config et overrides du dépôt valides', async () => {
    const config = await loadReconcileConfig({ config: CONFIG_DIR, overrides: OVERRIDES_DIR });
    expect(config.priority.characters.name_fr).toEqual(['api-onepiece']);
    expect(config.priority.characters.bounties).toEqual(['fandom', 'api-onepiece']);
  });

  it('correction sur un champ inconnu ou valeur invalide : refusée au chargement', async () => {
    await writeFile(path.join(dir, 'aliases.yaml'), '');
    await writeFile(
      path.join(dir, 'corrections.yaml'),
      [
        '- { entity: characters, slug: nami, field: bounty, value: 1, reason: x, date: 2026-11-12 }',
        '- { entity: characters, slug: nami, field: status, value: dead, reason: x, date: 2026-11-12 }',
      ].join('\n'),
    );
    await expect(loadReconcileConfig({ config: CONFIG_DIR, overrides: dir })).rejects.toThrow(
      /0\.field : champ non corrigeable[\s\S]*1\.value/,
    );
  });

  it('priorité incomplète ou source inconnue : refusée au chargement', async () => {
    await writeFile(path.join(dir, 'corrections.yaml'), '[]');
    await writeFile(path.join(dir, 'field-priority.yaml'), 'characters:\n  name_en: [wikipedia]\n');
    await expect(loadReconcileConfig({ config: dir, overrides: dir })).rejects.toThrow(/field-priority\.yaml invalide/);
  });
});
