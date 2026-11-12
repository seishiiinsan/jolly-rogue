import { describe, expect, it } from 'vitest';
import type { FandomCharacter, FandomCrew, FandomDevilFruit } from '../src/parse/fandom/schemas.js';
import { parseBounties, parseLastAge, parseLastHeightCm, parseStatus } from '../src/parse/fandom/values.js';
import type { FandomRecord } from '../src/parse/fandom/page.js';
import { isExcludedNonCanon } from '../src/sources/fandom.js';
import { parseFixture } from './fandom-helpers.js';

function character(title: string): FandomCharacter {
  const parsed = parseFixture(title);
  expect(parsed.rejections).toEqual([]);
  const record = parsed.records.find((r) => r.kind === 'character');
  if (!record) throw new Error(`pas de Char Box : ${title}`);
  return record.data as FandomCharacter;
}

const current = (c: FandomCharacter) => c.bounties.filter((b) => b.isCurrent);

describe('Char Box (fixtures réelles)', () => {
  it('Luffy : infobox dans le Tabs Top, noms, dernière valeur, historique des primes', () => {
    const parsed = parseFixture('Monkey D. Luffy');
    expect(parsed.records[0]?.infoboxPage.title).toBe('Template:Monkey D. Luffy Tabs Top');
    const luffy = character('Monkey D. Luffy');
    expect(luffy).toMatchObject({
      name: 'Monkey D. Luffy',
      nameJp: 'モンキー・D・ルフィ',
      nameRomaji: 'Monkī Dī Rufi',
      nameEn: 'Monkey D. Luffy',
      status: 'alive',
      age: 19,
      heightCm: 174,
      debutChapter: 1,
      originPage: 'East Blue',
    });
    expect(luffy.epithets).toContain('Straw Hat Luffy');
    expect(luffy.aliases).toEqual(expect.arrayContaining(['Lucy', 'Joy Boy']));
    expect(current(luffy)).toEqual([{ amount: 3_000_000_000, isMinimum: false, isCurrent: true, chapter: 1053, starRank: null }]);
    expect(luffy.bounties.at(-1)).toMatchObject({ amount: 30_000_000, isCurrent: false, chapter: 96 });
    expect(luffy.affiliations).toContainEqual({ name: 'Straw Hat Pirates', page: 'Straw Hat Pirates', qualifiers: [], isCurrent: true });
    expect(luffy.affiliations.find((a) => a.page === 'Baratie')).toMatchObject({ qualifiers: ['temporary', 'former'], isCurrent: false });
    expect(luffy.fruits).toEqual([
      {
        name: 'Gomu Gomu no Mi',
        page: 'Gomu Gomu no Mi',
        nameEn: 'Gum-Gum Fruit',
        types: [
          { type: 'paramecia', subtype: null },
          { type: 'zoan', subtype: 'mythical' },
        ],
      },
    ]);
    expect(luffy.haki).toEqual(['observation', 'armament', 'conqueror']);
  });

  it('Zoro : sans fruit, élément {{Status|noncanon}} ignoré', () => {
    const zoro = character('Roronoa Zoro');
    expect(zoro.fruits).toEqual([]);
    expect(current(zoro)[0]?.amount).toBe(1_111_000_000);
    expect(zoro.nameEn).toBe('Roronoa Zoro');
  });

  it('Nami : affiliation « defected » non actuelle', () => {
    const nami = character('Nami');
    expect(nami.affiliations.find((a) => a.page === 'Arlong Pirates')?.isCurrent).toBe(false);
    expect(nami.haki).toEqual([]);
  });

  it('Ace : mort, âge au décès, aucune prime actuelle, « At least », note de traduction sur l’épithète', () => {
    const ace = character('Portgas D. Ace');
    expect(ace.status).toBe('deceased');
    expect(ace.age).toBe(20);
    expect(ace.birthName).toBe('Gol D. Ace');
    expect(ace.epithets).toEqual(['Fire Fist Ace']);
    expect(current(ace)).toEqual([]);
    expect(ace.bounties[0]).toMatchObject({ amount: 550_000_000, isCurrent: false });
    expect(ace.bounties[1]).toMatchObject({ amount: 100_000_000, isMinimum: true, isCurrent: false });
    // Règle « dernière valeur » : la liste d'Ace est écrite adulte puis enfant.
    expect(ace.heightCm).toBe(103);
  });

  it('Barbe Blanche : mort, prime barrée', () => {
    const wb = character('Edward Newgate');
    expect(wb.status).toBe('deceased');
    expect(wb.age).toBe(72);
    expect(wb.bounties).toEqual([{ amount: 5_046_000_000, isMinimum: false, isCurrent: false, chapter: 957, starRank: null }]);
    expect(wb.epithets[0]).toBe('Whitebeard');
  });

  it('Smoker : grade en étoiles et montant minimum sur deux lignes, variantes de traduction exclues', () => {
    const smoker = character('Smoker');
    expect(smoker.bounties).toEqual([{ amount: 500_000_000, isMinimum: true, isCurrent: true, chapter: null, starRank: 5 }]);
    expect(smoker.epithets).toEqual(['Smoker the White Hunter']);
    expect(smoker.affiliations.find((a) => a.page === 'Loguetown')?.isCurrent).toBe(false);
  });

  it('Borsalino : infobox directement dans la page, prime {{C|3}}', () => {
    const parsed = parseFixture('Borsalino');
    expect(parsed.records[0]?.infoboxPage.title).toBe('Borsalino');
    const kizaru = character('Borsalino');
    expect(kizaru.bounties).toEqual([{ amount: 3_000_000_000, isMinimum: false, isCurrent: true, chapter: 1087, starRank: 3 }]);
    expect(kizaru.aliases).toEqual(['Kizaru']);
    expect(kizaru.heightCm).toBe(302);
  });

  it('Chopper : Zoan, prime de 1 000', () => {
    const chopper = character('Tony Tony Chopper');
    expect(chopper.fruits[0]?.types).toEqual([{ type: 'zoan', subtype: null }]);
    expect(current(chopper)[0]?.amount).toBe(1000);
  });

  it('Brook : âges en liste à puces', () => {
    const brook = character('Brook');
    expect(brook.age).toBe(90);
    expect(brook.heightCm).toBe(277);
  });

  it('Barbe Noire : deux fruits', () => {
    const teach = character('Marshall D. Teach');
    expect(teach.fruits.map((f) => f.page)).toEqual(['Yami Yami no Mi', 'Gura Gura no Mi']);
  });
});

describe('Devil Fruit Box (fixtures réelles)', () => {
  const fruit = (title: string): FandomDevilFruit => {
    const parsed = parseFixture(title);
    expect(parsed.rejections).toEqual([]);
    return parsed.records.find((r) => r.kind === 'devil_fruit')?.data as FandomDevilFruit;
  };

  it('Gomu Gomu no Mi : deux identités séparées par ----', () => {
    const gomu = fruit('Gomu Gomu no Mi');
    expect(gomu).toMatchObject({ nameRomaji: 'Gomu Gomu no Mi', nameEn: 'Gum-Gum Fruit', meaning: 'Rubber', fruitDebutChapter: 1 });
    expect(gomu.types).toEqual([
      { type: 'paramecia', subtype: null },
      { type: 'zoan', subtype: 'mythical' },
    ]);
    expect(gomu.forms.map((f) => f.nameRomaji)).toEqual(['Gomu Gomu no Mi', 'Hito Hito no Mi Moderu Nika']);
    expect(gomu.users).toEqual([{ name: 'Monkey D. Luffy', page: 'Monkey D. Luffy' }]);
  });

  it('Mera Mera no Mi : sans rname (défaut = titre), porteur actuel et précédent', () => {
    const mera = fruit('Mera Mera no Mi');
    expect(mera.nameRomaji).toBe('Mera Mera no Mi');
    expect(mera.forms).toEqual([]);
    expect(mera.types).toEqual([{ type: 'logia', subtype: null }]);
    expect(mera.users.map((u) => u.page)).toEqual(['Sabo']);
    expect(mera.previousUsers.map((u) => u.page)).toEqual(['Portgas D. Ace']);
  });
});

describe('Crew Box (fixtures réelles)', () => {
  it('Straw Hat Pirates : infobox dans le Tabs Top, capitaine, prime totale (Refn ignoré)', () => {
    const parsed = parseFixture('Straw Hat Pirates');
    expect(parsed.rejections).toEqual([]);
    const crew = parsed.records.find((r) => r.kind === 'crew')?.data as FandomCrew;
    expect(crew).toMatchObject({
      name: 'Straw Hat Pirates',
      nameRomaji: 'Mugiwara no Ichimi',
      debutChapter: 5,
      captains: [{ name: 'Monkey D. Luffy', page: 'Monkey D. Luffy' }],
      totalBounty: 8_816_001_000,
    });
  });
});

describe('normaliseurs', () => {
  it('statut : défaut alive, codes numériques et texte', () => {
    expect(parseStatus(undefined)).toBe('alive');
    expect(parseStatus('2')).toBe('deceased');
    expect(parseStatus('Unknown')).toBe('unknown');
    expect(parseStatus('3')).toBe('alive');
    expect(parseStatus('0')).toBe('alive'); // #default du template
  });

  it('âge et taille : dernière valeur, inconnu → null, format inconnu → rejet', () => {
    expect(parseLastAge('7 (debut);<br/>17 (pre-timeskip);<br/>19 (post-timeskip)')).toBe(19);
    expect(parseLastAge('Unknown')).toBeNull();
    expect(parseLastAge('Even he does not know')).toBeNull();
    expect(parseLastAge('8 (born 28 years ago)<br />(biologically 28)')).toBe(28);
    expect(parseLastHeightCm('6 m (19\'8")')).toBe(600);
    expect(parseLastHeightCm('1,200 cm')).toBe(1200);
    expect(parseLastHeightCm('Giant')).toBeUndefined();
  });

  it('primes : grade seul, valeur inconnue, format inconnu', () => {
    expect(parseBounties('{{C|2}}', new Map())).toEqual([{ amount: null, isMinimum: false, isCurrent: true, chapter: null, starRank: 2 }]);
    expect(parseBounties('Unknown', new Map())).toEqual([]);
    expect(parseBounties('Lots of money', new Map())).toBeUndefined();
  });
});

describe('exclusion du non-canon', () => {
  const record = (debutChapter: number | null) =>
    ({ kind: 'character', data: { debutChapter }, infoboxPage: { title: 'X', revId: 1 } }) as unknown as FandomRecord;
  const tree = new Set(['Roronoa Zoro', 'Apis']);

  it('exclut seulement une page de l’arbre « Non-Canon » sans chapitre de début', () => {
    expect(isExcludedNonCanon('Apis', record(null), tree)).toBe(true);
    // Canon apparu dans un film : dans l'arbre, mais débute au chapitre 3.
    expect(isExcludedNonCanon('Roronoa Zoro', record(3), tree)).toBe(false);
    // Canon hors manga (Vivre Card, SBS) : pas de chapitre, mais hors de l'arbre.
    expect(isExcludedNonCanon('Hanafuda', record(null), tree)).toBe(false);
  });

  it('Zoro (fixture réelle) : chapitre de début lu', () => {
    const zoro = parseFixture('Roronoa Zoro').records[0];
    expect(zoro && isExcludedNonCanon('Roronoa Zoro', zoro, tree)).toBe(false);
  });
});
