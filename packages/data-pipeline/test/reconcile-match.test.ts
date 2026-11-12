import { describe, expect, it } from 'vitest';
import { type ApiCandidate, type FandomCandidate, HINT_SCORE, matchEntity } from '../src/reconcile/match.js';
import { nameKeys, normalizeName, similarity } from '../src/reconcile/names.js';

describe('normalisation des noms', () => {
  it('minuscules, sans accents ni ponctuation', () => {
    expect(normalizeName('Monkey D. Luffy')).toBe('monkey d luffy');
    expect(normalizeName('Tony-Tony Chopper')).toBe('tony tony chopper');
    expect(normalizeName('Supā Supā no Mi')).toBe('supa supa no mi');
    expect(normalizeName("Ben Beckman's crew")).toBe('ben beckmans crew');
  });

  it('clés distinctes, avec et sans précision entre parenthèses', () => {
    expect(nameKeys(['Kaku (Wano)', 'Kaku', null, ''])).toEqual(['kaku', 'kaku wano']);
  });

  it('similarité : faute de frappe, nom contenu, mots génériques ignorés', () => {
    expect(similarity('eustass kid', 'eustass kidd')).toBeGreaterThan(0.9);
    expect(similarity('garp', 'monkey d garp')).toBe(0.9);
    expect(similarity('fruit', 'ushi ushi no mi model bison')).toBeLessThan(0.8);
    expect(similarity('sheep smile', 'smile')).toBeLessThan(0.8);
  });
});

const api = (id: string, label: string, extra: Partial<ApiCandidate> = {}): ApiCandidate => ({
  id,
  label,
  keys: nameKeys([label]),
  canonId: null,
  excluded: false,
  ...extra,
});
const fandom = (pageId: number, title: string, extra: Partial<FandomCandidate> = {}): FandomCandidate => ({
  pageId,
  title,
  titleKey: normalizeName(title),
  keys: nameKeys([title]),
  canonId: null,
  ...extra,
});

describe('rapprochement', () => {
  it('par nom normalisé, univoque dans les deux sens', () => {
    const r = matchEntity('characters', [api('1', 'Monkey D Luffy'), api('2', 'Nami')], [fandom(10, 'Monkey D. Luffy'), fandom(11, 'Nami')], []);
    expect(r.pairs).toEqual([
      { api: '1', fandom: 10, how: 'name' },
      { api: '2', fandom: 11, how: 'name' },
    ]);
    expect(r).toMatchObject({ apiOnly: [], fandomOnly: [], pending: [], fuzzy: [] });
  });

  it('le titre exact passe avant les autres noms (Kaku / Kaku (Wano))', () => {
    const r = matchEntity('characters', [api('1', 'Kaku')], [fandom(10, 'Kaku (Wano)'), fandom(11, 'Kaku')], []);
    expect(r.pairs).toEqual([{ api: '1', fandom: 11, how: 'name' }]);
    expect(r.fandomOnly).toEqual([{ pageId: 10, how: 'none' }]);
  });

  it('nom ambigu : rien n’est fusionné, la page reste en attente', () => {
    const r = matchEntity('characters', [api('259', 'Silvers Rayleigh'), api('549', 'Silvers Rayleigh')], [fandom(10, 'Silvers Rayleigh')], []);
    expect(r.pairs).toEqual([]);
    expect(r.pending).toEqual([
      {
        pageId: 10,
        title: 'Silvers Rayleigh',
        reason: 'ambiguous',
        candidates: [
          { apiId: '259', label: 'Silvers Rayleigh', score: 1 },
          { apiId: '549', label: 'Silvers Rayleigh', score: 1 },
        ],
      },
    ]);
    expect(r.apiOnly).toEqual(['259', '549']);
  });

  it('fuzzy : jamais de fusion, la page attend une validation', () => {
    const r = matchEntity('characters', [api('59', 'Eustass Kidd')], [fandom(10, 'Eustass Kid')], []);
    expect(r.pairs).toEqual([]);
    expect(r.pending[0]).toMatchObject({ reason: 'fuzzy', candidates: [{ apiId: '59', score: 0.92 }] });
    expect(r.fuzzy).toEqual([{ apiId: '59', label: 'Eustass Kidd', score: 0.92, pageId: 10, title: 'Eustass Kid' }]);
    expect(r.apiOnly).toEqual(['59']);
  });

  it('indice « même fruit » quand les noms ne se ressemblent pas', () => {
    const r = matchEntity('characters', [api('1', 'Diamond Joz')], [fandom(10, 'Jozu')], [], new Map([[10, ['1']]]));
    expect(r.pending[0]?.candidates).toEqual([{ apiId: '1', label: 'Diamond Joz', score: HINT_SCORE, via: 'fruit' }]);
  });

  it('alias : prioritaire sur le nom et sur un rapprochement déjà enregistré', () => {
    const r = matchEntity(
      'characters',
      [api('585', 'Tama', { canonId: 7 })],
      [fandom(10, 'Tama (Sphinx)', { canonId: 7 }), fandom(11, 'Kurozumi Tama')],
      [
        { fandom: 'Kurozumi Tama', 'api-onepiece': '585' },
        { fandom: 'Tama (Sphinx)', 'api-onepiece': null },
      ],
    );
    expect(r.pairs).toEqual([{ api: '585', fandom: 11, how: 'alias' }]);
    expect(r.fandomOnly).toEqual([{ pageId: 10, how: 'alias' }]);
  });

  it('id connu : la page retrouve son entité canon', () => {
    const r = matchEntity('characters', [api('1', 'Baggy', { canonId: 3 })], [fandom(10, 'Buggy', { canonId: 3 }), fandom(11, 'Mohji', { canonId: 4 })], []);
    expect(r.pairs).toEqual([{ api: '1', fandom: 10, how: 'id' }]);
    expect(r.fandomOnly).toEqual([{ pageId: 11, how: 'id' }]);
  });

  it('clones exclus du rapprochement automatique', () => {
    const r = matchEntity('devil_fruits', [api('212', 'Supa Supa no Mi', { excluded: true })], [fandom(10, 'Supa Supa no Mi')], []);
    expect(r.pairs).toEqual([]);
    expect(r.fandomOnly).toEqual([{ pageId: 10, how: 'none' }]);
  });

  it('alias invalide : erreur explicite', () => {
    expect(() => matchEntity('characters', [], [fandom(10, 'Nami')], [{ fandom: 'Namii', 'api-onepiece': null }])).toThrow(
      /« Namii » absent de staging.fandom/,
    );
    expect(() => matchEntity('characters', [], [fandom(10, 'Nami')], [{ fandom: 'Nami', 'api-onepiece': '3' }])).toThrow(
      /api-onepiece 3 absent/,
    );
  });
});
