import { describe, expect, it } from 'vitest';
import { Rng, isValidSeed, seedRng } from '../src/index.js';

/** Implémentation de référence indépendante de sfc32, en BigInt (aucun `| 0`, aucun `>>>`). */
function referenceSfc32(seed: number, count: number): number[] {
  const M = 0xffffffffn;
  let a = BigInt(seed);
  let b = 0x9e3779b9n;
  let c = 0x243f6a88n;
  let d = 1n;
  const next = (): bigint => {
    const t = (a + b + d) & M;
    d = (d + 1n) & M;
    a = b ^ (b >> 9n);
    b = (c + ((c << 3n) & M)) & M;
    c = (((c << 21n) & M) | (c >> 11n)) & M;
    c = (c + t) & M;
    return t;
  };
  for (let i = 0; i < 15; i++) next();
  return Array.from({ length: count }, () => Number(next()));
}

describe('RNG seedé (sfc32)', () => {
  it('donne des valeurs de référence fixes', () => {
    // Valeurs figées : tout changement ici casse le rejeu de toutes les parties.
    const rng = new Rng(seedRng(1));
    expect(Array.from({ length: 5 }, () => rng.nextU32())).toEqual([2212199553, 1506684997, 389392296, 138374344, 482077534]);
    const other = new Rng(seedRng(4294967295));
    expect(Array.from({ length: 3 }, () => other.nextU32())).toEqual([4182873111, 638246997, 1384417266]);
  });

  it('est identique à une implémentation de référence en BigInt', () => {
    for (const seed of [0, 1, 2, 42, 0x7fffffff, 0x80000000, 0xffffffff]) {
      const rng = new Rng(seedRng(seed));
      expect(Array.from({ length: 200 }, () => rng.nextU32())).toEqual(referenceSfc32(seed, 200));
    }
  });

  it('a un état sérialisable qui reprend la séquence', () => {
    const rng = new Rng(seedRng(7));
    for (let i = 0; i < 10; i++) rng.nextU32();
    const saved = JSON.parse(JSON.stringify(rng.state())) as [number, number, number, number];
    const resumed = new Rng(saved);
    expect(Array.from({ length: 20 }, () => resumed.nextU32())).toEqual(Array.from({ length: 20 }, () => rng.nextU32()));
  });

  it('ne modifie pas l\'état reçu', () => {
    const state = seedRng(3);
    const copy = [...state];
    new Rng(state).nextU32();
    expect([...state]).toEqual(copy);
  });

  it('int(n) reste dans [0, n) et couvre toutes les valeurs', () => {
    const rng = new Rng(seedRng(123));
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = rng.int(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
      seen.add(v);
    }
    expect(seen.size).toBe(7);
    expect(rng.int(1)).toBe(0);
    expect(() => rng.int(0)).toThrow(RangeError);
    expect(() => rng.int(1.5)).toThrow(RangeError);
  });

  it('refuse les seeds invalides', () => {
    expect(isValidSeed(0)).toBe(true);
    expect(isValidSeed(4294967295)).toBe(true);
    for (const bad of [-1, 4294967296, 1.5, Number.NaN, '1', null]) expect(isValidSeed(bad)).toBe(false);
    expect(() => seedRng(-1)).toThrow(RangeError);
  });
});
