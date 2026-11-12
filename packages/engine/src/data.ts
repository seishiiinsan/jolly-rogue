import type { Character, Enemy, GameData, Rarity, Skill, Synergy } from '@jolly-rogue/game-data';

/** Index de lecture des données de jeu, construits une fois par objet `GameData`. */
export interface GameIndex {
  characters: ReadonlyMap<string, Character>;
  skills: ReadonlyMap<string, Skill>;
  enemies: ReadonlyMap<string, Enemy>;
  synergies: ReadonlyMap<string, Synergy>;
  /** Persos par rareté, triés par slug : l'ordre des tirages en dépend. */
  byRarity: Readonly<Record<Rarity, readonly Character[]>>;
  /** Sbires (hors boss), triés par id : l'ordre des tirages en dépend. */
  minions: readonly Enemy[];
}

const cache = new WeakMap<GameData, GameIndex>();

const bySlug = <T>(key: (item: T) => string) => (a: T, b: T): number =>
  key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0;

export function indexOf(data: GameData): GameIndex {
  let index = cache.get(data);
  if (!index) {
    const characters = [...data.characters].sort(bySlug((c) => c.slug));
    index = {
      characters: new Map(characters.map((c) => [c.slug, c])),
      skills: new Map(data.skills.map((s) => [s.id, s])),
      enemies: new Map(data.enemies.map((e) => [e.id, e])),
      synergies: new Map(data.synergies.map((s) => [s.faction, s])),
      byRarity: {
        commun: characters.filter((c) => c.rarity === 'commun'),
        rare: characters.filter((c) => c.rarity === 'rare'),
        legendaire: characters.filter((c) => c.rarity === 'legendaire'),
      },
      minions: data.enemies.filter((e) => e.boss !== true).sort(bySlug((e) => e.id)),
    };
    cache.set(data, index);
  }
  return index;
}

export function mustGet<T>(map: ReadonlyMap<string, T>, key: string, what: string): T {
  const value = map.get(key);
  if (value === undefined) throw new Error(`${what} inconnu : ${key}`);
  return value;
}
