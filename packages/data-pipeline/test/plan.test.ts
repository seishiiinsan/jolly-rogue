import { describe, expect, it } from 'vitest';
import { inferCrewKind, planApiOnepiece } from '../src/load/plan.js';
import { stagingFromFixtures } from './helpers.js';

describe('plan staging → canon (fixtures réelles)', () => {
  const plan = planApiOnepiece(stagingFromFixtures());
  const character = (id: string) => plan.characters.find((c) => c.externalId === id);
  const crew = (id: string) => plan.crews.find((c) => c.externalId === id);
  const fruit = (id: string) => plan.devilFruits.find((f) => f.externalId === id);
  const issues = (kind: string) => plan.issues.filter((i) => i.kind === kind);

  it('est déterministe', () => {
    expect(planApiOnepiece(stagingFromFixtures())).toEqual(plan);
  });

  it('Chapeaux de paille : équipage pirate, capitaine Luffy, membres et fruits', () => {
    expect(crew('1')).toMatchObject({
      baseSlug: 'mugiwara-no-ichimi',
      values: { nameFr: 'L’équipage du Chapeau de Paille', kind: 'pirate', isYonko: true },
      captainExternalId: '1',
    });
    const members = plan.characters.filter((c) => c.affiliation?.crewExternalId === '1');
    expect(members.map((m) => m.baseSlug)).toEqual([
      'monkey-d-luffy',
      'roronoa-zoro',
      'nami',
      'usopp',
      'sanji',
      'tony-tony-chopper',
      'nico-robin',
      'franky',
      'brook',
      'jinbe',
      'zeus',
    ]);
    const withFruit = members.filter((m) => m.fruit).map((m) => [m.baseSlug, fruit(m.fruit?.fruitExternalId ?? '')?.baseSlug, m.fruit?.isCurrent]);
    expect(withFruit).toEqual([
      ['monkey-d-luffy', 'hito-hito-no-mi-moderu-nika', true],
      ['tony-tony-chopper', 'hito-hito-no-mi', true],
      ['nico-robin', 'hana-hana-no-mi', true],
      ['brook', 'yomi-yomi-no-mi', true],
    ]);
    expect(character('1')).toMatchObject({
      values: { nameEn: 'Monkey D Luffy', nameFr: 'Monkey D Luffy', status: 'alive', age: 19, heightCm: 174 },
      affiliation: { role: 'Captain' },
      bounty: { amountBerry: 3_000_000_000 },
    });
  });

  it('porteurs de fruits : décédé non actuel, deux vivants → aucun actuel + anomalie', () => {
    expect(character('290')?.fruit).toMatchObject({ fruitExternalId: '82', isCurrent: false }); // Ace
    expect(character('662')?.fruit).toMatchObject({ fruitExternalId: '82', isCurrent: true }); // Sabo
    expect(character('392')?.fruit?.isCurrent).toBe(false); // Lucci
    expect(character('395')?.fruit?.isCurrent).toBe(false); // Funkfreed
    expect(issues('fruit-multiple-holders').map((i) => i.externalId)).toEqual(['99']);
  });

  it('fruits : clone typé comme l’original, SMILE sans romaji, slugs', () => {
    expect(fruit('212')).toMatchObject({ baseSlug: 'supa-supa-no-mi-clone', values: { type: 'paramecia', subtype: 'clone' } });
    expect(fruit('127')).toMatchObject({ baseSlug: 'sheep-smile', values: { nameRomaji: 'Sheep SMILE', type: 'zoan', subtype: 'smile' } });
    expect(issues('fruit-romaji-fallback').map((i) => i.externalId)).toContain('127');
    // Faucon et Phénix partagent le même nom romanisé : la collision est gérée à l'application.
    expect([fruit('93')?.baseSlug, fruit('206')?.baseSlug]).toEqual(['tori-tori-no-mi', 'tori-tori-no-mi']);
  });

  it('capitaines ambigus et type d’équipage par défaut', () => {
    expect(issues('captain-ambiguous').map((i) => i.externalId)).toContain('33');
    expect(crew('33')?.captainExternalId).toBeNull();
    expect(inferCrewKind('Marine', null)).toBe('marine');
    expect(inferCrewKind('Dressrosa', 'Dressrosa')).toBeUndefined();
    expect(inferCrewKind('Primate League', 'La Ligue des Primates')).toBeUndefined();
  });

  it('provenance : name_fr depuis la réponse FR, le reste depuis l’EN, valeurs nulles ignorées', () => {
    const zeus = character('11');
    expect(zeus?.provenance['name_fr']?.sourceUrl).toBe('https://api.api-onepiece.com/v2/characters/fr');
    expect(zeus?.provenance['status']?.sourceUrl).toBe('https://api.api-onepiece.com/v2/characters/en');
    expect(zeus?.provenance['age']).toBeUndefined();
  });

  it('sagas et arcs : ordre et rattachement', () => {
    expect(plan.sagas.map((s) => s.values.sortOrder)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(plan.arcs.find((a) => a.externalId === '1')).toMatchObject({ baseSlug: 'arc-romance-dawn', sagaExternalId: '1' });
  });
});
