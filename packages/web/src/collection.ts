import type { GameData, Rarity } from '@jolly-rogue/game-data';

/**
 * Collection locale du prototype (cadrage §5) : cartes de collection séparées du jeu, sans aucun
 * effet en partie. PROVISOIRE : en J3 les coffres seront tirés côté serveur (cadrage §8) et les
 * valeurs ci-dessous passeront par `docs/regles-meta.md`. Ici tout est local au navigateur.
 */
export const COLLECTION_RULES = {
  /** Cartes par coffre : min(max, base + floor(vagues gagnées / perWaves)). Aucun coffre sans victoire. */
  chest: { base: 1, perWaves: 5, max: 5 },
  /** Chances (en %) par carte : min(cap, base + floor(vagues × num / den)). */
  legendaire: { base: 2, num: 1, den: 2, cap: 20 },
  rare: { base: 20, num: 1, den: 1, cap: 40 },
  /** Fragments rendus par un doublon, et prix d'une carte au choix. */
  fragments: { commun: 1, rare: 3, legendaire: 10 } as Record<Rarity, number>,
  craft: { commun: 10, rare: 30, legendaire: 100 } as Record<Rarity, number>,
  /** Légendaire garantie au N-ième coffre sans en avoir eu. */
  pityChests: 10,
} as const;

export interface Collection {
  version: 1;
  /** Slugs des cartes possédées. */
  owned: string[];
  fragments: number;
  chestsOpened: number;
  chestsSinceLegendary: number;
  bestScore: number;
  runs: number;
}

export const emptyCollection = (): Collection => ({
  version: 1,
  owned: [],
  fragments: 0,
  chestsOpened: 0,
  chestsSinceLegendary: 0,
  bestScore: 0,
  runs: 0,
});

export interface ChestCard {
  slug: string;
  rarity: Rarity;
  /** Carte nouvelle, ou doublon converti en fragments. */
  isNew: boolean;
  fragments: number;
}

export interface ChestResult {
  collection: Collection;
  cards: ChestCard[];
  /** La garantie de légendaire a joué. */
  pity: boolean;
}

export const chestSize = (wavesCleared: number): number =>
  wavesCleared <= 0
    ? 0
    : Math.min(COLLECTION_RULES.chest.max, COLLECTION_RULES.chest.base + Math.floor(wavesCleared / COLLECTION_RULES.chest.perWaves));

export function chestChances(wavesCleared: number): Record<Rarity, number> {
  const curve = (c: { base: number; num: number; den: number; cap: number }): number =>
    Math.min(c.cap, c.base + Math.floor((wavesCleared * c.num) / c.den));
  const legendaire = curve(COLLECTION_RULES.legendaire);
  const rare = curve(COLLECTION_RULES.rare);
  return { legendaire, rare, commun: 100 - legendaire - rare };
}

/**
 * Ouvre le coffre de fin de partie. `rand(n)` rend un entier sur [0, n) : c'est un aléatoire
 * distinct de celui de la partie (jamais le RNG du moteur). Fonction pure.
 */
export function openChest(collection: Collection, wavesCleared: number, score: number, data: GameData, rand: (n: number) => number): ChestResult {
  const next: Collection = {
    ...collection,
    owned: [...collection.owned],
    runs: collection.runs + 1,
    bestScore: Math.max(collection.bestScore, score),
  };
  const size = chestSize(wavesCleared);
  if (size === 0) return { collection: next, cards: [], pity: false };

  const chances = chestChances(wavesCleared);
  const pity = next.chestsSinceLegendary + 1 >= COLLECTION_RULES.pityChests;
  const cards: ChestCard[] = [];
  for (let i = 0; i < size; i++) {
    const roll = rand(100);
    const rarity: Rarity =
      pity && i === 0 ? 'legendaire' : roll < chances.legendaire ? 'legendaire' : roll < chances.legendaire + chances.rare ? 'rare' : 'commun';
    const pool = data.characters.filter((c) => c.rarity === rarity);
    const picked = pool[rand(pool.length)];
    if (!picked) continue;
    const isNew = !next.owned.includes(picked.slug);
    const fragments = isNew ? 0 : COLLECTION_RULES.fragments[rarity];
    if (isNew) next.owned.push(picked.slug);
    next.fragments += fragments;
    cards.push({ slug: picked.slug, rarity, isNew, fragments });
  }
  next.chestsOpened += 1;
  next.chestsSinceLegendary = cards.some((c) => c.rarity === 'legendaire') ? 0 : next.chestsSinceLegendary + 1;
  next.owned.sort();
  return { collection: next, cards, pity: pity && cards[0]?.rarity === 'legendaire' };
}

/** Échange des fragments contre la carte de son choix. Rend null si c'est impossible. */
export function craftCard(collection: Collection, slug: string, data: GameData): Collection | null {
  const character = data.characters.find((c) => c.slug === slug);
  if (!character || collection.owned.includes(slug)) return null;
  const cost = COLLECTION_RULES.craft[character.rarity];
  if (collection.fragments < cost) return null;
  return { ...collection, owned: [...collection.owned, slug].sort(), fragments: collection.fragments - cost };
}

const STORAGE_KEY = 'jolly-rogue.collection.v1';

export function loadCollection(storage: Pick<Storage, 'getItem'> | undefined): Collection {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyCollection();
    const parsed = JSON.parse(raw) as Partial<Collection>;
    if (parsed.version !== 1 || !Array.isArray(parsed.owned)) return emptyCollection();
    const int = (v: unknown): number => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : 0);
    return {
      version: 1,
      owned: parsed.owned.filter((s): s is string => typeof s === 'string'),
      fragments: int(parsed.fragments),
      chestsOpened: int(parsed.chestsOpened),
      chestsSinceLegendary: int(parsed.chestsSinceLegendary),
      bestScore: int(parsed.bestScore),
      runs: int(parsed.runs),
    };
  } catch {
    return emptyCollection();
  }
}

export function saveCollection(storage: Pick<Storage, 'setItem'> | undefined, collection: Collection): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(collection));
  } catch {
    // Stockage indisponible (navigation privée, quota) : la collection reste en mémoire pour la session.
  }
}
