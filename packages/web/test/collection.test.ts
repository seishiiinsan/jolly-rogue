import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type GameData, gameDataSchema } from '@jolly-rogue/game-data';
import { describe, expect, it } from 'vitest';
import {
  COLLECTION_RULES,
  type Collection,
  chestChances,
  chestSize,
  craftCard,
  emptyCollection,
  loadCollection,
  openChest,
  saveCollection,
} from '../src/collection.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const data: GameData = gameDataSchema.parse(JSON.parse(readFileSync(path.resolve(here, '../../../data/exports/game.json'), 'utf8')));

/** Aléatoire de test déterministe (LCG) ; `fixed` force tous les tirages. */
const lcg = (seed: number) => {
  let s = seed >>> 0;
  return (n: number): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return Math.floor((s / 4294967296) * n);
  };
};
const fixed = (value: number) => (n: number): number => Math.min(n - 1, value);
const rarityOf = (slug: string) => data.characters.find((c) => c.slug === slug)?.rarity;

describe('collection : coffres', () => {
  it('taille du coffre selon la profondeur ; aucun coffre sans victoire', () => {
    expect([0, 1, 4, 5, 10, 19, 20, 60].map(chestSize)).toEqual([0, 1, 1, 2, 3, 4, 5, 5]);
    const result = openChest(emptyCollection(), 0, 0, data, lcg(1));
    expect(result.cards).toEqual([]);
    expect(result.collection).toMatchObject({ runs: 1, chestsOpened: 0 });
  });

  it('chances de rareté selon la profondeur', () => {
    expect(chestChances(1)).toEqual({ legendaire: 2, rare: 21, commun: 77 });
    expect(chestChances(10)).toEqual({ legendaire: 7, rare: 30, commun: 63 });
    expect(chestChances(40)).toEqual({ legendaire: 20, rare: 40, commun: 40 });
  });

  it('carte nouvelle ajoutée, doublon converti en fragments', () => {
    const first = openChest(emptyCollection(), 1, 1500, data, fixed(99));
    expect(first.cards).toHaveLength(1);
    expect(first.cards[0]).toMatchObject({ rarity: 'commun', isNew: true, fragments: 0 });
    expect(first.collection.owned).toEqual([first.cards[0]?.slug]);
    const second = openChest(first.collection, 1, 900, data, fixed(99));
    expect(second.cards[0]).toMatchObject({ slug: first.cards[0]?.slug, isNew: false, fragments: COLLECTION_RULES.fragments.commun });
    expect(second.collection).toMatchObject({ fragments: 1, chestsOpened: 2, runs: 2, bestScore: 1500 });
    expect(second.collection.owned).toHaveLength(1);
  });

  it('ne modifie pas la collection reçue', () => {
    const before = emptyCollection();
    openChest(before, 20, 1, data, lcg(3));
    expect(before).toEqual(emptyCollection());
  });

  it('anti-malchance : légendaire garantie au 10ᵉ coffre sans en avoir eu', () => {
    let collection: Collection = emptyCollection();
    for (let i = 0; i < 9; i++) {
      const r = openChest(collection, 3, 0, data, fixed(99));
      expect(r.cards.every((c) => c.rarity === 'commun')).toBe(true);
      expect(r.pity).toBe(false);
      collection = r.collection;
    }
    expect(collection.chestsSinceLegendary).toBe(9);
    const tenth = openChest(collection, 3, 0, data, fixed(99));
    expect(tenth.pity).toBe(true);
    expect(tenth.cards[0]?.rarity).toBe('legendaire');
    expect(tenth.collection.chestsSinceLegendary).toBe(0);
  });

  it('les tirages respectent les raretés et finissent par compléter la collection', () => {
    let collection = emptyCollection();
    const rand = lcg(42);
    const seen = { commun: 0, rare: 0, legendaire: 0 };
    for (let i = 0; i < 400; i++) {
      const r = openChest(collection, 20, 0, data, rand);
      expect(r.cards).toHaveLength(5);
      for (const c of r.cards) {
        expect(rarityOf(c.slug)).toBe(c.rarity);
        seen[c.rarity] += 1;
      }
      collection = r.collection;
    }
    expect(collection.owned).toHaveLength(data.characters.length);
    expect(seen.commun).toBeGreaterThan(seen.rare);
    expect(seen.rare).toBeGreaterThan(seen.legendaire);
    expect(seen.legendaire).toBeGreaterThan(0);
  });
});

describe('collection : fragments et sauvegarde', () => {
  it('carte au choix contre fragments', () => {
    const rich: Collection = { ...emptyCollection(), fragments: 100 };
    const crafted = craftCard(rich, 'monkey-d-luffy', data);
    expect(crafted).toMatchObject({ owned: ['monkey-d-luffy'], fragments: 0 });
    expect(craftCard({ ...rich, fragments: 99 }, 'monkey-d-luffy', data)).toBeNull();
    expect(craftCard(crafted as Collection, 'monkey-d-luffy', data)).toBeNull();
    expect(craftCard(rich, 'inconnu', data)).toBeNull();
    expect(craftCard(rich, 'usopp', data)).toMatchObject({ fragments: 90 });
  });

  it('sauvegarde et rechargement ; données corrompues ignorées', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    expect(loadCollection(storage)).toEqual(emptyCollection());
    const collection = openChest(emptyCollection(), 12, 12345, data, lcg(7)).collection;
    saveCollection(storage, collection);
    expect(loadCollection(storage)).toEqual(collection);
    store.set('jolly-rogue.collection.v1', '{pas du json');
    expect(loadCollection(storage)).toEqual(emptyCollection());
    store.set('jolly-rogue.collection.v1', JSON.stringify({ version: 1, owned: ['usopp', 3], fragments: -2 }));
    expect(loadCollection(storage)).toMatchObject({ owned: ['usopp'], fragments: 0 });
    expect(loadCollection(undefined)).toEqual(emptyCollection());
  });
});
