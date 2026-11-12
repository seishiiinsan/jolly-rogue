import type { Archetype, Row, Rules, Skill, SkillEffect, SkillTarget } from '@jolly-rogue/game-data';
import { Rng, type RngState } from './rng.js';

/** Version du format du journal d'événements de combat. */
export const EVENT_LOG_VERSION = 1;

export type Side = 'player' | 'enemy';

/** Un combattant, stats finales (niveaux et synergies déjà appliqués). */
export interface CombatantInput {
  /** Slug du perso ou id de l'ennemi : sert au front pour retrouver nom et carte. */
  ref: string;
  kind: 'character' | 'enemy';
  /** Niveau de fusion (1 pour un ennemi). */
  level: number;
  row: Row;
  archetype: Archetype;
  hp: number;
  atk: number;
  spd: number;
  skill: Skill | null;
}

export interface CombatInput {
  /** Dans l'ordre de l'équipe : l'index est l'emplacement (« slot ») du combattant. */
  player: readonly CombatantInput[];
  enemy: readonly CombatantInput[];
}

export interface CombatUnitInfo {
  /** `p0`, `p1`… pour le joueur, `e0`, `e1`… pour l'ennemi. */
  id: string;
  side: Side;
  slot: number;
  ref: string;
  kind: 'character' | 'enemy';
  level: number;
  row: Row;
  archetype: Archetype;
  maxHp: number;
  atk: number;
  spd: number;
  skill: string | null;
}

export type CombatEvent =
  | { type: 'combat_start'; units: CombatUnitInfo[] }
  | { type: 'round_start'; round: number }
  /** Action d'un combattant : attaque de base ou compétence « toutes les N actions ». */
  | { type: 'action'; actor: string; kind: 'attack' | 'skill'; skill: string | null; target: string }
  /** Compétence déclenchée hors action (début de combat, élimination, mort). */
  | { type: 'skill_trigger'; actor: string; skill: string; trigger: 'combat_start' | 'on_kill' | 'on_death' }
  | { type: 'damage'; source: string; target: string; amount: number; absorbed: number; hp: number; shield: number }
  | { type: 'heal'; source: string; target: string; amount: number; hp: number }
  | { type: 'shield'; source: string; target: string; amount: number; shield: number }
  | { type: 'stun'; source: string; target: string; turns: number }
  /** Le combattant, étourdi, passe son tour. */
  | { type: 'stunned'; actor: string }
  | { type: 'buff_atk'; source: string; target: string; pct: number; total: number }
  | { type: 'death'; unit: string }
  | { type: 'combat_end'; outcome: CombatOutcome; reason: 'wipe' | 'round_limit'; rounds: number };

export type CombatOutcome = 'victory' | 'defeat';

export interface CombatResult {
  outcome: CombatOutcome;
  reason: 'wipe' | 'round_limit';
  /** Nombre de tours entamés. */
  rounds: number;
  events: CombatEvent[];
  /** PV restants et PV max de l'équipe du joueur (pour le score). */
  playerHp: number;
  playerMaxHp: number;
  /** État du RNG après le combat. */
  rng: RngState;
}

interface Unit {
  id: string;
  side: Side;
  slot: number;
  row: Row;
  melee: boolean;
  targeting: 'first' | 'lowest_hp' | 'back_first';
  maxHp: number;
  hp: number;
  atk: number;
  spd: number;
  shield: number;
  stun: number;
  atkBuffPct: number;
  actions: number;
  alive: boolean;
  skill: Skill | null;
}

/**
 * Résout un combat (docs/regles-j1.md §6 et §7). Fonction pure : les entrées ne sont pas modifiées,
 * l'état du RNG est rendu dans le résultat.
 *
 * Consommation du RNG : un tirage `int(nombre d'ennemis vivants)` à chaque résolution de la cible
 * `random_enemy`, dans l'ordre des événements. Rien d'autre.
 */
export function resolveCombat(input: CombatInput, rules: Rules, rngState: RngState): CombatResult {
  const rng = new Rng(rngState);
  const events: CombatEvent[] = [];

  const makeUnit = (c: CombatantInput, side: Side, slot: number): Unit => {
    const archetype = rules.archetypes[c.archetype];
    if (!archetype) throw new Error(`archétype non défini dans les règles : ${c.archetype}`);
    return {
      id: `${side === 'player' ? 'p' : 'e'}${slot}`,
      side,
      slot,
      row: c.row,
      melee: archetype.range === 'melee',
      targeting: archetype.targeting,
      maxHp: c.hp,
      hp: c.hp,
      atk: c.atk,
      spd: c.spd,
      shield: 0,
      stun: 0,
      atkBuffPct: 0,
      actions: 0,
      alive: c.hp > 0,
      skill: c.skill,
    };
  };
  const players = input.player.map((c, i) => makeUnit(c, 'player', i));
  const enemies = input.enemy.map((c, i) => makeUnit(c, 'enemy', i));
  const all = [...players, ...enemies];

  events.push({
    type: 'combat_start',
    units: all.map((u) => {
      const c = (u.side === 'player' ? input.player : input.enemy)[u.slot] as CombatantInput;
      return {
        id: u.id,
        side: u.side,
        slot: u.slot,
        ref: c.ref,
        kind: c.kind,
        level: c.level,
        row: u.row,
        archetype: c.archetype,
        maxHp: u.maxHp,
        atk: u.atk,
        spd: u.spd,
        skill: c.skill?.id ?? null,
      };
    }),
  });

  const alliesOf = (u: Unit): Unit[] => (u.side === 'player' ? players : enemies).filter((x) => x.alive);
  const foesOf = (u: Unit): Unit[] => (u.side === 'player' ? enemies : players).filter((x) => x.alive);

  /** Ordre d'action : VIT décroissante, puis joueur, puis ligne avant, puis emplacement. */
  const initiative = (): Unit[] =>
    all
      .filter((u) => u.alive)
      .sort(
        (a, b) =>
          b.spd - a.spd ||
          (a.side === b.side ? 0 : a.side === 'player' ? -1 : 1) ||
          (a.row === b.row ? 0 : a.row === 'front' ? -1 : 1) ||
          a.slot - b.slot,
      );

  /** ATK effective : bonus d'ATK du combat, puis malus de mêlée à l'arrière. */
  const effectiveAtk = (u: Unit): number => {
    let atk = Math.floor((u.atk * (100 + u.atkBuffPct)) / 100);
    if (u.melee && u.row === 'back') atk = Math.floor((atk * rules.combat.meleeBackRowPct) / 100);
    return atk;
  };

  const lowestHp = (units: Unit[]): Unit | undefined =>
    units.reduce<Unit | undefined>((best, u) => (best === undefined || u.hp < best.hp ? u : best), undefined);

  /** Cible de l'attaque de base, selon l'archétype. */
  const pickTarget = (u: Unit): Unit | undefined => {
    const foes = foesOf(u);
    const front = foes.filter((f) => f.row === 'front');
    const back = foes.filter((f) => f.row === 'back');
    if (u.targeting === 'back_first') return lowestHp(back.length > 0 ? back : front);
    const reachable = front.length > 0 ? front : back;
    return u.targeting === 'lowest_hp' ? lowestHp(reachable) : reachable[0];
  };

  const resolveTargets = (selector: SkillTarget, caster: Unit, target: Unit | undefined): Unit[] => {
    switch (selector) {
      case 'self':
        return caster.alive ? [caster] : [];
      case 'target':
        return target?.alive ? [target] : [];
      case 'target_row':
        return target ? foesOf(caster).filter((f) => f.row === target.row) : [];
      case 'all_enemies':
        return foesOf(caster);
      case 'random_enemy': {
        const foes = foesOf(caster);
        const picked = foes.length > 0 ? foes[rng.int(foes.length)] : undefined;
        return picked ? [picked] : [];
      }
      case 'lowest_hp_ally': {
        // L'allié vivant à qui il manque le plus de PV ; à égalité, le premier emplacement.
        const picked = alliesOf(caster).reduce<Unit | undefined>(
          (best, u) => (best === undefined || u.maxHp - u.hp > best.maxHp - best.hp ? u : best),
          undefined,
        );
        return picked ? [picked] : [];
      }
      case 'all_allies':
        return alliesOf(caster);
    }
  };

  const runSkillOutsideAction = (u: Unit, trigger: 'combat_start' | 'on_kill' | 'on_death'): void => {
    if (u.skill?.trigger.type !== trigger) return;
    events.push({ type: 'skill_trigger', actor: u.id, skill: u.skill.id, trigger });
    applyEffects(u, u.skill.effects, undefined);
  };

  const dealDamage = (source: Unit, target: Unit, raw: number): void => {
    if (!target.alive) return;
    const absorbed = Math.min(target.shield, raw);
    target.shield -= absorbed;
    const lost = Math.min(target.hp, raw - absorbed);
    target.hp -= lost;
    events.push({
      type: 'damage',
      source: source.id,
      target: target.id,
      amount: lost,
      absorbed,
      hp: target.hp,
      shield: target.shield,
    });
    if (target.hp > 0) return;
    target.alive = false;
    events.push({ type: 'death', unit: target.id });
    // D'abord la compétence « à la mort » de la victime, puis « à l'élimination » du tueur.
    runSkillOutsideAction(target, 'on_death');
    if (source.alive && source.side !== target.side) runSkillOutsideAction(source, 'on_kill');
  };

  function applyEffects(caster: Unit, effects: readonly SkillEffect[], target: Unit | undefined): void {
    for (const effect of effects) {
      // Les cibles sont figées avant d'appliquer l'effet ; une cible morte entre-temps est ignorée.
      const targets = resolveTargets(effect.target, caster, target);
      for (const t of targets) {
        if (!t.alive) continue;
        switch (effect.type) {
          case 'damage':
            dealDamage(caster, t, Math.max(1, Math.floor((effectiveAtk(caster) * effect.pct) / 100)));
            break;
          case 'heal': {
            const amount = Math.min(t.maxHp - t.hp, Math.floor((effectiveAtk(caster) * effect.pct) / 100));
            t.hp += amount;
            events.push({ type: 'heal', source: caster.id, target: t.id, amount, hp: t.hp });
            break;
          }
          case 'shield': {
            const amount = Math.floor((caster.maxHp * effect.pct) / 100);
            t.shield += amount;
            events.push({ type: 'shield', source: caster.id, target: t.id, amount, shield: t.shield });
            break;
          }
          case 'stun':
            t.stun = Math.max(t.stun, effect.turns);
            events.push({ type: 'stun', source: caster.id, target: t.id, turns: effect.turns });
            break;
          case 'buff_atk':
            t.atkBuffPct += effect.pct;
            events.push({ type: 'buff_atk', source: caster.id, target: t.id, pct: effect.pct, total: t.atkBuffPct });
            break;
        }
      }
    }
  }

  const sideWiped = (): CombatOutcome | undefined => {
    // Une équipe du joueur anéantie est une défaite, même si l'ennemi tombe en même temps.
    if (!players.some((u) => u.alive)) return 'defeat';
    if (!enemies.some((u) => u.alive)) return 'victory';
    return undefined;
  };

  const finish = (outcome: CombatOutcome, reason: 'wipe' | 'round_limit', rounds: number): CombatResult => {
    events.push({ type: 'combat_end', outcome, reason, rounds });
    return {
      outcome,
      reason,
      rounds,
      events,
      playerHp: players.reduce((sum, u) => sum + u.hp, 0),
      playerMaxHp: players.reduce((sum, u) => sum + u.maxHp, 0),
      rng: rng.state(),
    };
  };

  let outcome = sideWiped();
  if (outcome) return finish(outcome, 'wipe', 0);

  for (const u of initiative()) {
    if (u.alive) runSkillOutsideAction(u, 'combat_start');
  }
  outcome = sideWiped();
  if (outcome) return finish(outcome, 'wipe', 0);

  for (let round = 1; round <= rules.combat.roundLimit; round++) {
    events.push({ type: 'round_start', round });
    for (const u of initiative()) {
      if (!u.alive) continue;
      if (u.stun > 0) {
        u.stun -= 1;
        events.push({ type: 'stunned', actor: u.id });
        continue;
      }
      const target = pickTarget(u);
      if (!target) continue;
      u.actions += 1;
      const skill = u.skill;
      if (skill?.trigger.type === 'every_n_actions' && u.actions % skill.trigger.n === 0) {
        events.push({ type: 'action', actor: u.id, kind: 'skill', skill: skill.id, target: target.id });
        applyEffects(u, skill.effects, target);
      } else {
        events.push({ type: 'action', actor: u.id, kind: 'attack', skill: null, target: target.id });
        dealDamage(u, target, Math.max(1, effectiveAtk(u)));
      }
      outcome = sideWiped();
      if (outcome) return finish(outcome, 'wipe', round);
    }
  }
  // Limite de durée atteinte : la vague n'est pas vaincue.
  return finish('defeat', 'round_limit', rules.combat.roundLimit);
}
