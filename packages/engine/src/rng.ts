/**
 * RNG seedé du moteur : sfc32 (Small Fast Counter, Chris Doty-Humphrey, PractRand).
 *
 * Pourquoi sfc32 : il n'utilise que des additions, décalages et XOR sur des entiers 32 bits,
 * donc il donne exactement les mêmes valeurs dans tous les moteurs JavaScript et sur le serveur
 * (aucun flottant, aucun BigInt), son état tient en 4 entiers sérialisables en JSON, et il passe
 * PractRand. Il n'est pas cryptographique : ce n'est pas nécessaire, le serveur rejoue la partie.
 *
 * L'état est une valeur immuable : `Rng` en travaille une copie et la rend via `state()`.
 */
export type RngState = readonly [number, number, number, number];

const WARMUP_ROUNDS = 15;

function step(s: [number, number, number, number]): number {
  const t = (((s[0] + s[1]) | 0) + s[3]) | 0;
  s[3] = (s[3] + 1) | 0;
  s[0] = s[1] ^ (s[1] >>> 9);
  s[1] = (s[2] + (s[2] << 3)) | 0;
  s[2] = (s[2] << 21) | (s[2] >>> 11);
  s[2] = (s[2] + t) | 0;
  return t >>> 0;
}

/** Une seed est un entier 32 bits non signé (0 à 4 294 967 295). */
export function isValidSeed(seed: unknown): seed is number {
  return typeof seed === 'number' && Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff;
}

/** État initial pour une seed : constantes fixes puis 15 tours de chauffe. */
export function seedRng(seed: number): RngState {
  if (!isValidSeed(seed)) throw new RangeError('seed : entier entre 0 et 4294967295 attendu');
  const s: [number, number, number, number] = [seed | 0, 0x9e3779b9 | 0, 0x243f6a88 | 0, 1];
  for (let i = 0; i < WARMUP_ROUNDS; i++) step(s);
  return [s[0], s[1], s[2], s[3]];
}

export class Rng {
  readonly #s: [number, number, number, number];

  constructor(state: RngState) {
    this.#s = [state[0] | 0, state[1] | 0, state[2] | 0, state[3] | 0];
  }

  /** Entier uniforme sur [0, 2^32). */
  nextU32(): number {
    return step(this.#s);
  }

  /**
   * Entier sur [0, n), pour 1 <= n <= 2^20 : floor(u32 × n / 2^32).
   * Le produit reste sous 2^53 et la division par 2^32 est exacte : résultat identique partout.
   * Un tirage est consommé même si n vaut 1. Biais < n / 2^32, négligeable pour les n du jeu.
   */
  int(n: number): number {
    if (!Number.isInteger(n) || n < 1 || n > 0x100000) throw new RangeError('Rng.int : n entre 1 et 2^20 attendu');
    return Math.floor((step(this.#s) * n) / 0x100000000);
  }

  /** Copie de l'état courant, sérialisable en JSON. */
  state(): RngState {
    return [this.#s[0], this.#s[1], this.#s[2], this.#s[3]];
  }
}
