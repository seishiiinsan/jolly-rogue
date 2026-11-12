import { describe, expect, it } from 'vitest';
import {
  type Choice,
  ENGINE_VERSION,
  Rng,
  type RunState,
  applyChoice,
  computeScore,
  createRun,
  generateWave,
  isBossWave,
  rarityChances,
  replay,
  seedRng,
  teamCombatants,
  teamSynergies,
  waveScalingPct,
} from '../src/index.js';
import { expectGolden, gameData } from './helpers.js';

const rules = gameData.rules;
const rarityOf = (slug: string) => gameData.characters.find((c) => c.slug === slug)?.rarity;

/** Applique un choix qui doit être légal. */
function apply(state: RunState, choice: Choice): RunState {
  const result = applyChoice(state, choice, gameData);
  if (!result.ok) throw new Error(`${result.error.code} : ${result.error.message}`);
  return result.state;
}

const errorOf = (state: RunState, choice: Choice): string | null => {
  const result = applyChoice(state, choice, gameData);
  return result.ok ? null : result.error.code;
};

/** Générateur de choix légaux, lui-même seedé (distinct du RNG de la partie). */
function randomChoice(state: RunState, rng: Rng): Choice {
  if (state.phase === 'recruit') {
    const offer = state.offer ?? [];
    const pick = rng.int(offer.length + 1);
    if (pick === offer.length) return { type: 'skip' };
    const slug = offer[pick] as string;
    if (state.team.some((m) => m.slug === slug) || state.team.length < rules.team.max) return { type: 'recruit', offer: pick };
    return { type: 'recruit', offer: pick, replace: rng.int(state.team.length) };
  }
  const roll = rng.int(6);
  if (roll === 0 && state.team.length > 1) {
    const a = rng.int(state.team.length);
    const b = (a + 1 + rng.int(state.team.length - 1)) % state.team.length;
    return { type: 'swap', a, b };
  }
  if (roll === 1) {
    const index = rng.int(state.team.length);
    const row = state.team[index]?.row === 'front' ? 'back' : 'front';
    if (state.team.filter((m) => m.row === row).length < rules.team.rowMax) return { type: 'move', index, row };
  }
  return { type: 'start' };
}

function playRandomRun(seed: number): { state: RunState; choices: Choice[] } {
  const rng = new Rng(seedRng((seed * 2654435761) >>> 0));
  let { state } = createRun(seed, gameData);
  const choices: Choice[] = [];
  while (state.phase !== 'over') {
    const choice = randomChoice(state, rng);
    choices.push(choice);
    state = apply(state, choice);
  }
  return { state, choices };
}

/** Joue jusqu'à la première offre de recrutement. */
function firstOffer(seed: number): RunState {
  return apply(createRun(seed, gameData).state, { type: 'start' });
}

/** État de recrutement fabriqué pour tester une règle précise. */
const recruitState = (team: RunState['team'], offer: string[]): RunState => ({
  ...firstOffer(1),
  team,
  offer,
});

describe('partie : création', () => {
  it('équipe de départ : 2 communs distincts, placés sur leur ligne préférée, vague 1 prête', () => {
    for (let seed = 0; seed < 200; seed++) {
      const { state, events } = createRun(seed, gameData);
      expect(state.team).toHaveLength(rules.team.startingCount);
      expect(new Set(state.team.map((m) => m.slug)).size).toBe(rules.team.startingCount);
      for (const member of state.team) {
        expect(rarityOf(member.slug)).toBe('commun');
        expect(member.level).toBe(1);
        const character = gameData.characters.find((c) => c.slug === member.slug);
        const melee = character && rules.archetypes[character.archetype]?.range === 'melee';
        expect(member.row).toBe(melee ? 'front' : 'back');
      }
      expect(state).toMatchObject({ phase: 'prep', wave: 1, offer: null, wavesCleared: 0, score: 0, seed, engineVersion: ENGINE_VERSION });
      expect(state.enemies).toHaveLength(2);
      expect(events).toEqual([{ type: 'run_start', team: state.team }]);
    }
  });

  it('une même seed donne la même partie, des seeds différentes des parties différentes', () => {
    expect(createRun(42, gameData)).toEqual(createRun(42, gameData));
    const starts = new Set(Array.from({ length: 50 }, (_, seed) => JSON.stringify(createRun(seed, gameData).state.team)));
    expect(starts.size).toBeGreaterThan(10);
  });

  it('refuse une seed invalide', () => {
    expect(() => createRun(-1, gameData)).toThrow(RangeError);
    expect(() => createRun(1.5, gameData)).toThrow(RangeError);
  });
});

describe('partie : rejeu', () => {
  it('replay(seed, choix) reproduit exactement l\'état final, sur 300 seeds', () => {
    let longest = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const { state, choices } = playRandomRun(seed);
      const replayed = replay(seed, gameData, choices);
      expect(replayed.ok, `seed ${seed}`).toBe(true);
      expect(JSON.stringify(replayed.state), `seed ${seed}`).toBe(JSON.stringify(state));
      expect(replayed.state.score).toBe(state.score);
      longest = Math.max(longest, state.wavesCleared);
    }
    // Les parties au hasard vont assez loin pour couvrir recrutement, fusion et boss.
    expect(longest).toBeGreaterThanOrEqual(10);
  });

  it('une partie de référence reste identique d\'une version à l\'autre', () => {
    const { state, choices } = playRandomRun(2026);
    expectGolden('run-2026', { choices, state });
  });

  it('l\'état sérialisé puis désérialisé continue à l\'identique', () => {
    for (const seed of [3, 17, 256]) {
      const { state: expected, choices } = playRandomRun(seed);
      let { state } = createRun(seed, gameData);
      for (const choice of choices) {
        state = JSON.parse(JSON.stringify(state)) as RunState;
        state = apply(state, choice);
      }
      expect(state).toEqual(expected);
      expect(JSON.parse(JSON.stringify(expected))).toEqual(expected);
    }
  });

  it('applyChoice ne modifie pas l\'état reçu', () => {
    let { state } = createRun(8, gameData);
    const rng = new Rng(seedRng(8));
    for (let i = 0; i < 40 && state.phase !== 'over'; i++) {
      const before = JSON.stringify(state);
      const next = apply(state, randomChoice(state, rng));
      expect(JSON.stringify(state)).toBe(before);
      state = next;
    }
  });

  it('un rejeu avec un choix illégal s\'arrête et dit lequel', () => {
    const result = replay(5, gameData, [{ type: 'start' }, { type: 'start' }]);
    expect(result).toMatchObject({ ok: false, index: 1, error: { code: 'wrong_phase' } });
  });

  it('un choix altéré change l\'état final (base de l\'anti-triche)', () => {
    const { state, choices } = playRandomRun(77);
    const tampered = choices.filter((c) => c.type !== 'recruit' || c.replace !== undefined).map((c) => (c.type === 'recruit' ? ({ type: 'skip' } as const) : c));
    const replayed = replay(77, gameData, tampered);
    expect(JSON.stringify(replayed.state)).not.toBe(JSON.stringify(state));
  });
});

describe('partie : choix illégaux', () => {
  it('phase de placement', () => {
    const { state } = createRun(1, gameData);
    expect(errorOf(state, { type: 'skip' })).toBe('wrong_phase');
    expect(errorOf(state, { type: 'recruit', offer: 0 })).toBe('wrong_phase');
    expect(errorOf(state, { type: 'move', index: 9, row: 'back' })).toBe('bad_index');
    expect(errorOf(state, { type: 'move', index: -1, row: 'back' })).toBe('bad_index');
    expect(errorOf(state, { type: 'move', index: 0, row: state.team[0]?.row ?? 'front' })).toBe('same_row');
    expect(errorOf(state, { type: 'swap', a: 0, b: 0 })).toBe('same_slot');
    expect(errorOf(state, { type: 'swap', a: 0, b: 5 })).toBe('bad_index');
    expect(errorOf(state, { type: 'move', index: 0, row: 'milieu' } as unknown as Choice)).toBe('bad_choice');
    expect(errorOf(state, { type: 'tricher' } as unknown as Choice)).toBe('bad_choice');
    expect(errorOf(state, null as unknown as Choice)).toBe('bad_choice');
  });

  it('phase de recrutement', () => {
    const state = firstOffer(1);
    expect(state.phase).toBe('recruit');
    expect(errorOf(state, { type: 'start' })).toBe('wrong_phase');
    expect(errorOf(state, { type: 'move', index: 0, row: 'back' })).toBe('wrong_phase');
    expect(errorOf(state, { type: 'swap', a: 0, b: 1 })).toBe('wrong_phase');
    expect(errorOf(state, { type: 'recruit', offer: 3 })).toBe('bad_offer_index');
    expect(errorOf(state, { type: 'recruit', offer: 0.5 })).toBe('bad_offer_index');
    expect(errorOf(state, { type: 'recruit', offer: 0, replace: 0 })).toBe('replace_not_allowed');
  });

  it('ligne pleine', () => {
    const state: RunState = {
      ...createRun(1, gameData).state,
      team: [
        { slug: 'hina', level: 1, row: 'front' },
        { slug: 'pica', level: 1, row: 'front' },
        { slug: 'momonga', level: 1, row: 'front' },
        { slug: 'usopp', level: 1, row: 'back' },
      ],
    };
    expect(errorOf(state, { type: 'move', index: 3, row: 'front' })).toBe('row_full');
    expect(apply(state, { type: 'move', index: 0, row: 'back' }).team[0]?.row).toBe('back');
  });

  it('6ᵉ perso sans remplacement, remplacement hors équipe', () => {
    const full = recruitState(
      [
        { slug: 'hina', level: 1, row: 'front' },
        { slug: 'pica', level: 1, row: 'front' },
        { slug: 'momonga', level: 1, row: 'front' },
        { slug: 'usopp', level: 1, row: 'back' },
        { slug: 'tony-tony-chopper', level: 1, row: 'back' },
      ],
      ['roronoa-zoro', 'hina', 'sanji'],
    );
    expect(errorOf(full, { type: 'recruit', offer: 0 })).toBe('team_full');
    expect(errorOf(full, { type: 'recruit', offer: 0, replace: 5 })).toBe('bad_index');
    expect(errorOf(full, { type: 'recruit', offer: 1, replace: 0 })).toBe('replace_not_allowed');
    const replaced = apply(full, { type: 'recruit', offer: 0, replace: 3 });
    // Zoro (mêlée) prend l'emplacement d'Usopp ; la ligne avant est pleine, il va à l'arrière.
    expect(replaced.team[3]).toEqual({ slug: 'roronoa-zoro', level: 1, row: 'back' });
    expect(replaced.team).toHaveLength(5);
    expect(replaced).toMatchObject({ phase: 'prep', offer: null });
  });

  it('partie terminée : plus aucun choix', () => {
    const { state } = playRandomRun(4);
    expect(state.phase).toBe('over');
    for (const choice of [{ type: 'start' }, { type: 'skip' }, { type: 'recruit', offer: 0 }] as Choice[]) {
      expect(errorOf(state, choice)).toBe('run_over');
    }
  });

  it('un choix illégal ne consomme aucun tirage', () => {
    const state = firstOffer(9);
    const result = applyChoice(state, { type: 'recruit', offer: 7 }, gameData);
    expect(result.ok).toBe(false);
    expect(apply(state, { type: 'skip' }).rng).toEqual(state.rng);
  });
});

describe('partie : recrutement et fusion', () => {
  it('recruter ajoute le perso sur sa ligne préférée ; passer ne change rien', () => {
    const state = recruitState([{ slug: 'hina', level: 1, row: 'front' }], ['usopp', 'pica', 'roronoa-zoro']);
    expect(apply(state, { type: 'recruit', offer: 0 }).team).toEqual([
      { slug: 'hina', level: 1, row: 'front' },
      { slug: 'usopp', level: 1, row: 'back' },
    ]);
    expect(apply(state, { type: 'skip' }).team).toEqual(state.team);
  });

  it('recruter un perso déjà présent le fait monter d\'un niveau, sans prendre de place', () => {
    const state = recruitState(
      [{ slug: 'hina', level: 1, row: 'back' }, { slug: 'pica', level: 2, row: 'front' }],
      ['pica', 'hina', 'usopp'],
    );
    const result = applyChoice(state, { type: 'recruit', offer: 0 }, gameData);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.state.team).toEqual([{ slug: 'hina', level: 1, row: 'back' }, { slug: 'pica', level: 3, row: 'front' }]);
    expect(result.events).toEqual([{ type: 'recruited', slug: 'pica', index: 1, level: 3, fused: true, replaced: null }]);
  });

  it('niveaux : PV et ATK × 100 / 150 / 200 %, VIT inchangée', () => {
    const stats = (level: number) => teamCombatants([{ slug: 'momonga', level, row: 'front' }], gameData)[0];
    expect(stats(1)).toMatchObject({ hp: 95, atk: 24, spd: 11 });
    expect(stats(2)).toMatchObject({ hp: 142, atk: 36, spd: 11 });
    expect(stats(3)).toMatchObject({ hp: 190, atk: 48, spd: 11 });
  });

  it('l\'offre ne contient ni doublon ni perso au niveau max', () => {
    for (let seed = 1; seed <= 150; seed++) {
      let { state } = createRun(seed, gameData);
      const rng = new Rng(seedRng(seed + 1000));
      while (state.phase !== 'over') {
        if (state.offer) {
          expect(new Set(state.offer).size).toBe(state.offer.length);
          expect(state.offer).toHaveLength(rules.offer.size);
          for (const slug of state.offer) {
            expect(state.team.find((m) => m.slug === slug)?.level ?? 0).toBeLessThan(rules.fusion.maxLevel);
          }
        }
        state = apply(state, randomChoice(state, rng));
        for (const member of state.team) expect(member.level).toBeLessThanOrEqual(rules.fusion.maxLevel);
        expect(state.team.length).toBeLessThanOrEqual(rules.team.max);
        expect(state.team.filter((m) => m.row === 'front').length).toBeLessThanOrEqual(rules.team.rowMax);
        expect(state.team.filter((m) => m.row === 'back').length).toBeLessThanOrEqual(rules.team.rowMax);
      }
    }
  });
});

describe('partie : raretés', () => {
  it('table des probabilités par vague', () => {
    expect(rarityChances(1, gameData)).toEqual({ legendaire: 0, rare: 18, commun: 82 });
    expect(rarityChances(2, gameData)).toEqual({ legendaire: 2, rare: 21, commun: 77 });
    expect(rarityChances(10, gameData)).toEqual({ legendaire: 10, rare: 45, commun: 45 });
    expect(rarityChances(25, gameData)).toEqual({ legendaire: 24, rare: 45, commun: 31 });
    expect(rarityChances(40, gameData)).toEqual({ legendaire: 25, rare: 45, commun: 30 });
  });

  it('les tirages suivent la table (premières offres de 3000 seeds, à 3 points près)', () => {
    const counts = { commun: 0, rare: 0, legendaire: 0 };
    let total = 0;
    for (let seed = 1; seed <= 3000; seed++) {
      for (const slug of firstOffer(seed).offer ?? []) {
        const rarity = rarityOf(slug);
        if (rarity) counts[rarity] += 1;
        total += 1;
      }
    }
    expect(counts.legendaire).toBe(0);
    expect(Math.abs((100 * counts.rare) / total - 18)).toBeLessThan(3);
    expect(Math.abs((100 * counts.commun) / total - 82)).toBeLessThan(3);
  });
});

describe('partie : synergies', () => {
  const team = (...slugs: string[]) => slugs.map((slug) => ({ slug, level: 1, row: 'front' as const }));

  it('paliers par faction', () => {
    expect(teamSynergies(team('monkey-d-luffy', 'hina'), gameData)).toEqual([
      { faction: 'kaigun', count: 1, activeTier: null, nextTier: 2, bonuses: [] },
      { faction: 'mugiwara-no-ichimi', count: 1, activeTier: null, nextTier: 2, bonuses: [] },
    ]);
    const four = teamSynergies(team('monkey-d-luffy', 'roronoa-zoro', 'sanji', 'usopp', 'hina'), gameData);
    expect(four.find((s) => s.faction === 'mugiwara-no-ichimi')).toMatchObject({ count: 4, activeTier: 4, nextTier: null });
    const three = teamSynergies(team('monkey-d-luffy', 'roronoa-zoro', 'sanji'), gameData);
    expect(three[0]).toMatchObject({ count: 3, activeTier: 2, nextTier: 4 });
  });

  it('les bonus s\'appliquent aux seuls membres de la faction, après le niveau', () => {
    const [zoro, usopp, hina] = teamCombatants(
      [{ slug: 'roronoa-zoro', level: 2, row: 'front' }, { slug: 'usopp', level: 1, row: 'back' }, { slug: 'hina', level: 1, row: 'front' }],
      gameData,
    );
    // Zoro : PV 120 × 150 % = 180, × 115 % = 207 ; ATK 32 × 150 % = 48, × 115 % = 55 (55,2 arrondi).
    expect(zoro).toMatchObject({ hp: 207, atk: 55, spd: 15 });
    expect(usopp).toMatchObject({ hp: 80, atk: 32, spd: 12 });
    expect(hina).toMatchObject({ hp: 110, atk: 18, spd: 15 });
  });

  it('bonus de vitesse fixe', () => {
    const [doflamingo] = teamCombatants(team('don-quijote-doflamingo', 'diamante', 'pica'), gameData);
    expect(doflamingo).toMatchObject({ spd: 28, atk: 42 });
  });
});

describe('partie : vagues et score', () => {
  it('multiplicateur des ennemis', () => {
    expect([1, 2, 5, 10, 20, 30].map((w) => waveScalingPct(w, gameData))).toEqual([100, 108, 138, 204, 396, 668]);
  });

  it('nombre d\'ennemis, déblocage des sbires, premier ennemi en ligne avant', () => {
    for (let wave = 1; wave <= 45; wave++) {
      for (let seed = 0; seed < 20; seed++) {
        const enemies = generateWave(wave, gameData, new Rng(seedRng(seed)));
        const tier = wave / gameData.waves.boss.every;
        const expected = isBossWave(wave, gameData) ? 1 + Math.min(5, 1 + tier) : Math.min(6, 2 + Math.floor((wave - 1) / 2));
        expect(enemies, `vague ${wave}`).toHaveLength(expected);
        expect(enemies[0]?.row).toBe('front');
        expect(enemies.filter((e) => e.row === 'front').length).toBeLessThanOrEqual(3);
        expect(enemies.filter((e) => e.row === 'back').length).toBeLessThanOrEqual(3);
        for (const e of enemies) {
          const def = gameData.enemies.find((x) => x.id === e.enemyId);
          if (def?.boss !== true) expect(def?.minWave ?? 99).toBeLessThanOrEqual(wave);
        }
        expect(enemies.filter((e) => e.enemyId.startsWith('boss-'))).toHaveLength(isBossWave(wave, gameData) ? 1 : 0);
      }
    }
  });

  it('boss toutes les 10 vagues, dans l\'ordre, qui boucle', () => {
    const bossOf = (wave: number) => generateWave(wave, gameData, new Rng(seedRng(1)))[0]?.enemyId;
    expect([10, 20, 30, 40, 50].map(bossOf)).toEqual(['boss-lucci', 'boss-crocodile', 'boss-teach', 'boss-kaido', 'boss-lucci']);
    const lucci = generateWave(10, gameData, new Rng(seedRng(1)))[0];
    expect(lucci).toEqual({ enemyId: 'boss-lucci', row: 'front', hp: 816, atk: 61, spd: 20 });
  });

  it('score : 1000 par vague gagnée + moyenne des PV restants en ‰, plafonnée à 999', () => {
    expect(computeScore(0, 0, gameData)).toBe(0);
    expect(computeScore(1, 1000, gameData)).toBe(1999);
    expect(computeScore(3, 1500, gameData)).toBe(3500);
    expect(computeScore(12, 7000, gameData)).toBe(12583);
  });

  it('défaite : fin de partie, le score ne bouge plus', () => {
    const { state, choices } = playRandomRun(21);
    expect(state.phase).toBe('over');
    expect(state.wave).toBe(state.wavesCleared + 1);
    expect(state.score).toBe(computeScore(state.wavesCleared, state.hpPermilleSum, gameData));
    const beforeLast = replay(21, gameData, choices.slice(0, -1));
    expect(beforeLast.state.score).toBe(state.score);
  });
});
