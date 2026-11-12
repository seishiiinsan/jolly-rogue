import { describe, expect, it } from 'vitest';
import {
  type CombatEvent,
  type CombatInput,
  applyChoice,
  createRun,
  resolveCombat,
  seedRng,
  teamCombatants,
  waveCombatants,
} from '../src/index.js';
import { expectGolden, gameData, skill, unit } from './helpers.js';

const rules = gameData.rules;
const fight = (input: CombatInput, seed = 1) => resolveCombat(input, rules, seedRng(seed));

/** Forme compacte d'un journal, pour des assertions lisibles. */
const compact = (events: CombatEvent[]): string[] =>
  events.map((e) => {
    switch (e.type) {
      case 'combat_start':
        return 'start';
      case 'round_start':
        return `round ${e.round}`;
      case 'action':
        return `${e.actor} ${e.kind}${e.skill ? `(${e.skill})` : ''} > ${e.target}`;
      case 'skill_trigger':
        return `${e.actor} ${e.trigger}(${e.skill})`;
      case 'damage':
        return `${e.target} -${e.amount}${e.absorbed ? ` (bouclier -${e.absorbed})` : ''} = ${e.hp}`;
      case 'heal':
        return `${e.target} +${e.amount} = ${e.hp}`;
      case 'shield':
        return `${e.target} bouclier +${e.amount} = ${e.shield}`;
      case 'stun':
        return `${e.target} étourdi ${e.turns}`;
      case 'stunned':
        return `${e.actor} passe`;
      case 'buff_atk':
        return `${e.target} atk +${e.pct}% = ${e.total}%`;
      case 'death':
        return `${e.unit} mort`;
      case 'combat_end':
        return `fin ${e.outcome} ${e.reason} ${e.rounds}`;
    }
  });

/** Équipes représentatives construites depuis les vraies données de jeu. */
const scenario = (team: [string, number, 'front' | 'back'][], wave: [string, 'front' | 'back'][], pct = 100): CombatInput => ({
  player: teamCombatants(team.map(([slug, level, row]) => ({ slug, level, row })), gameData),
  enemy: waveCombatants(
    wave.map(([enemyId, row]) => {
      const e = gameData.enemies.find((x) => x.id === enemyId);
      if (!e) throw new Error(enemyId);
      return { enemyId, row, hp: Math.floor((e.hp * pct) / 100), atk: Math.floor((e.atk * pct) / 100), spd: e.spd };
    }),
    gameData,
  ),
});

const SCENARIOS: Record<string, CombatInput> = {
  'duo-de-depart': scenario([['usopp', 1, 'back'], ['diamond-joz', 1, 'front']], [['matelot', 'front'], ['sabreur', 'front']]),
  'mugiwara-complet': scenario(
    [['monkey-d-luffy', 1, 'front'], ['roronoa-zoro', 2, 'front'], ['sanji', 1, 'front'], ['usopp', 1, 'back'], ['tony-tony-chopper', 3, 'back']],
    [['brute', 'front'], ['sabreur', 'front'], ['matelot', 'front'], ['tireur', 'back'], ['medecin', 'back'], ['artificier', 'back']],
    220,
  ),
  'boss-lucci': scenario(
    [['hina', 2, 'front'], ['pica', 1, 'front'], ['borsalino-kizaru', 1, 'back'], ['don-quijote-doflamingo', 1, 'back'], ['momonga', 1, 'front']],
    [['boss-lucci', 'front'], ['tireur', 'back'], ['artificier', 'back']],
    204,
  ),
  'defaite-contre-kaido': scenario(
    [['edward-newgate-barbe-blanche', 1, 'front'], ['portgas-d-ace', 1, 'front'], ['diamante', 1, 'back']],
    [['boss-kaido', 'front'], ['brute', 'front'], ['medecin', 'back']],
    500,
  ),
};

describe('combat : déterminisme', () => {
  it('même seed et mêmes équipes donnent le même journal, octet pour octet', () => {
    for (const [name, input] of Object.entries(SCENARIOS)) {
      const a = JSON.stringify(fight(input, 99));
      const b = JSON.stringify(fight(structuredClone(input), 99));
      expect(a, name).toBe(b);
    }
  });

  it('ne modifie ni les équipes ni l\'état du RNG reçus', () => {
    const input = SCENARIOS['mugiwara-complet'] as CombatInput;
    const before = JSON.stringify(input);
    const state = seedRng(5);
    const stateBefore = [...state];
    fight(input, 5);
    resolveCombat(input, rules, state);
    expect(JSON.stringify(input)).toBe(before);
    expect([...state]).toEqual(stateBefore);
  });

  it('la seed ne change le journal que s\'il y a un tirage (cible au hasard)', () => {
    const noRandom = scenario([['diamond-joz', 1, 'front']], [['matelot', 'front']]);
    expect(JSON.stringify(fight(noRandom, 1).events)).toBe(JSON.stringify(fight(noRandom, 2).events));
    expect(fight(noRandom, 1).rng).toEqual(seedRng(1));
    const withRandom: CombatInput = {
      player: [unit({ archetype: 'tir', row: 'back', hp: 5000, skill: skill('etoile-explosive') })],
      enemy: [unit({ hp: 300 }), unit({ hp: 300 }), unit({ hp: 300, row: 'back' })],
    };
    const logs = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((seed) => JSON.stringify(fight(withRandom, seed).events)));
    expect(logs.size).toBeGreaterThan(1);
  });
});

describe('combat : journaux de référence', () => {
  for (const [name, input] of Object.entries(SCENARIOS)) {
    it(name, () => {
      const result = fight(input, 2026);
      expectGolden(`combat-${name}`, { outcome: result.outcome, reason: result.reason, rounds: result.rounds, rng: result.rng, events: result.events });
    });
  }
});

describe('combat : exemple déroulé de docs/regles-j1.md §15', () => {
  it('seed 2, vague 1 : reproduit action par action', () => {
    const { state } = createRun(2, gameData);
    expect(state.team).toEqual([
      { slug: 'usopp', level: 1, row: 'back' },
      { slug: 'diamond-joz', level: 1, row: 'front' },
    ]);
    expect(state.enemies).toEqual([
      { enemyId: 'matelot', row: 'front', hp: 60, atk: 12, spd: 9 },
      { enemyId: 'sabreur', row: 'front', hp: 50, atk: 16, spd: 12 },
    ]);
    const result = applyChoice(state, { type: 'start' }, gameData);
    if (!result.ok) throw new Error(result.error.message);
    const combat = result.events[0];
    if (combat?.type !== 'combat') throw new Error('combat attendu');
    expect(compact(combat.events)).toEqual([
      'start',
      'p1 combat_start(corps-de-diamant)',
      'p1 bouclier +48 = 48',
      'round 1',
      'p0 attack > e1',
      'e1 -28 = 22',
      'e1 attack > p1',
      'p1 -0 (bouclier -16) = 160',
      'e0 attack > p1',
      'p1 -0 (bouclier -12) = 160',
      'p1 attack > e0',
      'e0 -12 = 48',
      'round 2',
      'p0 attack > e1',
      'e1 -22 = 0',
      'e1 mort',
      'e0 attack > p1',
      'p1 -0 (bouclier -12) = 160',
      'p1 attack > e0',
      'e0 -12 = 36',
      'round 3',
      'p0 skill(etoile-explosive) > e0',
      'e0 -36 = 0',
      'e0 mort',
      'fin victory wipe 3',
    ]);
    expect(result.state.offer).toEqual(['portgas-d-ace', 'roronoa-zoro', 'momonga']);
    expect(result.state.score).toBe(1999);
    expect(result.state.enemies).toEqual([
      { enemyId: 'sabreur', row: 'front', hp: 54, atk: 17, spd: 12 },
      { enemyId: 'matelot', row: 'front', hp: 64, atk: 12, spd: 9 },
    ]);
  });
});

describe('combat : règles', () => {
  it('ordre des actions : VIT, puis joueur, puis ligne avant, puis emplacement', () => {
    const result = fight({
      player: [unit({ spd: 5 }), unit({ spd: 9, row: 'back', archetype: 'tir' }), unit({ spd: 9 })],
      enemy: [unit({ spd: 9, hp: 1000 }), unit({ spd: 12, hp: 1000 })],
    });
    const firstRound = result.events.slice(0, result.events.findIndex((e) => e.type === 'round_start' && e.round === 2));
    const actors = firstRound.flatMap((e) => (e.type === 'action' ? [e.actor] : []));
    // e1 (VIT 12) ; à VIT 9 : joueur avant l'ennemi, ligne avant (p2) avant ligne arrière (p1) ; puis p0.
    expect(actors).toEqual(['e1', 'p2', 'p1', 'e0', 'p0']);
  });

  it('ciblage : poing = premier de la ligne avant, sabre = le moins de PV, tir = ligne arrière d\'abord', () => {
    const enemy = [unit({ hp: 500 }), unit({ hp: 300 }), unit({ hp: 400, row: 'back' }), unit({ hp: 200, row: 'back' })];
    const targetOf = (archetype: 'poing' | 'sabre' | 'tir' | 'soutien'): string | undefined => {
      const result = fight({ player: [unit({ archetype, spd: 99 })], enemy });
      const action = result.events.find((e) => e.type === 'action');
      return action?.type === 'action' ? action.target : undefined;
    };
    expect(targetOf('poing')).toBe('e0');
    expect(targetOf('soutien')).toBe('e0');
    expect(targetOf('sabre')).toBe('e1');
    expect(targetOf('tir')).toBe('e3');
  });

  it('égalité de PV : le premier emplacement est ciblé', () => {
    const result = fight({ player: [unit({ archetype: 'sabre', spd: 99 })], enemy: [unit({ hp: 50 }), unit({ hp: 50 })] });
    expect(result.events.find((e) => e.type === 'action')).toMatchObject({ target: 'e0' });
  });

  it('une ligne avant vide laisse la ligne arrière exposée', () => {
    const result = fight({ player: [unit({ spd: 99 })], enemy: [unit({ row: 'back' })] });
    expect(result.events.find((e) => e.type === 'action')).toMatchObject({ target: 'e0' });
  });

  it('un perso de mêlée à l\'arrière frappe à 50 % ; un tireur n\'a pas de malus', () => {
    const hit = (archetype: 'poing' | 'tir', row: 'front' | 'back'): number => {
      const result = fight({ player: [unit({ archetype, row, atk: 25, spd: 99 })], enemy: [unit({ hp: 1000 })] });
      const damage = result.events.find((e) => e.type === 'damage');
      return damage?.type === 'damage' ? damage.amount : -1;
    };
    expect(hit('poing', 'front')).toBe(25);
    expect(hit('poing', 'back')).toBe(12);
    expect(hit('tir', 'back')).toBe(25);
  });

  it('compétence toutes les N actions : remplace l\'attaque de base à la Nᵉ action', () => {
    const result = fight({ player: [unit({ atk: 10, spd: 99, skill: skill('trois-sabres') })], enemy: [unit({ hp: 1000, atk: 1 })] });
    const kinds = result.events.flatMap((e) => (e.type === 'action' && e.actor === 'p0' ? [e.kind] : [])).slice(0, 6);
    expect(kinds).toEqual(['attack', 'attack', 'skill', 'attack', 'attack', 'skill']);
    const amounts = result.events.flatMap((e) => (e.type === 'damage' && e.source === 'p0' ? [e.amount] : [])).slice(0, 3);
    expect(amounts).toEqual([10, 10, 20]);
  });

  it('étourdissement : la cible passe son prochain tour, qui ne compte pas comme une action', () => {
    const result = fight({ player: [unit({ spd: 99, atk: 1, skill: skill('cage-noire') })], enemy: [unit({ hp: 1000, atk: 1 })] });
    const log = compact(result.events);
    const stunAt = log.indexOf('e0 étourdi 1');
    expect(stunAt).toBeGreaterThan(0);
    // L'ennemi joue après p0 dans le même tour : c'est ce tour-là qu'il passe.
    expect(log[stunAt + 1]).toBe('e0 passe');
    expect(log.filter((l) => l === 'e0 passe')).toHaveLength(Math.floor(30 / 4));
  });

  it('bouclier : absorbe avant les PV ; soin : plafonné aux PV max', () => {
    const shielded = fight({ player: [unit({ hp: 100, atk: 1, skill: skill('corps-de-diamant') })], enemy: [unit({ atk: 40, hp: 1000 })] });
    expect(compact(shielded.events).slice(1, 6)).toEqual([
      'p0 combat_start(corps-de-diamant)',
      'p0 bouclier +30 = 30',
      'round 1',
      'p0 attack > e0',
      'e0 -1 = 999',
    ]);
    expect(compact(shielded.events)[7]).toBe('p0 -10 (bouclier -30) = 90');

    const healed = fight({
      player: [unit({ hp: 100, atk: 1 }), unit({ row: 'back', archetype: 'soutien', atk: 20, spd: 1, skill: skill('premiers-soins') })],
      enemy: [unit({ atk: 5, hp: 1000 })],
    });
    const heals = healed.events.flatMap((e) => (e.type === 'heal' ? [e] : []));
    expect(heals[0]).toMatchObject({ target: 'p0', amount: 10, hp: 100 });
  });

  it('à la mort puis à l\'élimination : la victime d\'abord, le tueur ensuite', () => {
    const result = fight({
      player: [unit({ archetype: 'sabre', atk: 100, hp: 100, spd: 99, skill: skill('lame-affutee') })],
      enemy: [unit({ hp: 10, atk: 10, skill: skill('baril-de-poudre') }), unit({ hp: 1000, atk: 1 })],
    });
    expect(compact(result.events).slice(2, 9)).toEqual([
      'p0 attack > e0',
      'e0 -10 = 0',
      'e0 mort',
      'e0 on_death(baril-de-poudre)',
      'p0 -6 = 94',
      'p0 on_kill(lame-affutee)',
      'p0 atk +20% = 20%',
    ]);
  });

  it('les deux équipes tombent en même temps : défaite', () => {
    const result = fight({
      player: [unit({ hp: 1, atk: 100, spd: 99 })],
      enemy: [unit({ hp: 10, atk: 10, skill: skill('baril-de-poudre') })],
    });
    expect(result.outcome).toBe('defeat');
    expect(result.reason).toBe('wipe');
  });
});

describe('combat : cas limites', () => {
  it('équipe du joueur vide : défaite immédiate', () => {
    const result = fight({ player: [], enemy: [unit()] });
    expect(compact(result.events)).toEqual(['start', 'fin defeat wipe 0']);
    expect(result.playerMaxHp).toBe(0);
  });

  it('équipe ennemie vide : victoire immédiate', () => {
    expect(fight({ player: [unit()], enemy: [] })).toMatchObject({ outcome: 'victory', rounds: 0 });
  });

  it('les deux équipes vides : défaite', () => {
    expect(fight({ player: [], enemy: [] }).outcome).toBe('defeat');
  });

  it('limite de durée atteinte : défaite au bout de 30 tours', () => {
    const result = fight({ player: [unit({ hp: 100000, atk: 1 })], enemy: [unit({ hp: 100000, atk: 1 })] });
    expect(result).toMatchObject({ outcome: 'defeat', reason: 'round_limit', rounds: rules.combat.roundLimit });
    expect(result.events.filter((e) => e.type === 'round_start')).toHaveLength(rules.combat.roundLimit);
  });

  it('les dégâts valent au moins 1', () => {
    const result = fight({ player: [unit({ atk: 1, row: 'back', spd: 99 })], enemy: [unit({ hp: 5 })] });
    const damage = result.events.find((e) => e.type === 'damage');
    expect(damage).toMatchObject({ amount: 1 });
  });

  it('le journal est du JSON pur', () => {
    const result = fight(SCENARIOS['boss-lucci'] as CombatInput);
    expect(JSON.parse(JSON.stringify(result.events))).toEqual(result.events);
  });
});
