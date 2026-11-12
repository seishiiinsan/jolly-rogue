import type { CombatEvent, CombatOutcome, CombatUnitInfo } from '@jolly-rogue/engine';

/**
 * Adaptation du journal d'événements du moteur en « temps » d'animation.
 * Le front ne recalcule rien : PV, boucliers et morts sont lus dans le journal.
 */
export type Fx =
  | { type: 'damage'; unit: string; amount: number; absorbed: number; hp: number; shield: number }
  | { type: 'heal'; unit: string; amount: number; hp: number }
  | { type: 'shield'; unit: string; amount: number; shield: number }
  | { type: 'stun'; unit: string; turns: number }
  | { type: 'buff'; unit: string; pct: number; total: number }
  | { type: 'death'; unit: string };

export type Beat =
  | { kind: 'start'; fx: Fx[]; ticks: number }
  | { kind: 'round'; round: number; fx: Fx[]; ticks: number }
  | { kind: 'action'; actor: string; target: string; skill: string | null; fx: Fx[]; ticks: number }
  | { kind: 'trigger'; actor: string; skill: string; trigger: 'combat_start' | 'on_kill' | 'on_death'; fx: Fx[]; ticks: number }
  | { kind: 'skip'; actor: string; fx: Fx[]; ticks: number }
  | { kind: 'end'; outcome: CombatOutcome; reason: 'wipe' | 'round_limit'; rounds: number; fx: Fx[]; ticks: number };

export interface Timeline {
  units: CombatUnitInfo[];
  beats: Beat[];
}

/** Durée relative d'un temps ; l'écran la multiplie par sa durée de base et sa vitesse. */
const TICKS = { start: 1, round: 0.6, action: 1, trigger: 0.9, skip: 0.6, end: 1 } as const;

export function buildTimeline(events: readonly CombatEvent[]): Timeline {
  let units: CombatUnitInfo[] = [];
  const beats: Beat[] = [];
  const push = (fx: Fx): void => {
    const current = beats.at(-1);
    if (!current) throw new Error('journal invalide : effet avant le début du combat');
    current.fx.push(fx);
  };
  for (const e of events) {
    switch (e.type) {
      case 'combat_start':
        units = e.units;
        beats.push({ kind: 'start', fx: [], ticks: TICKS.start });
        break;
      case 'round_start':
        beats.push({ kind: 'round', round: e.round, fx: [], ticks: TICKS.round });
        break;
      case 'action':
        beats.push({ kind: 'action', actor: e.actor, target: e.target, skill: e.kind === 'skill' ? e.skill : null, fx: [], ticks: TICKS.action });
        break;
      case 'skill_trigger':
        beats.push({ kind: 'trigger', actor: e.actor, skill: e.skill, trigger: e.trigger, fx: [], ticks: TICKS.trigger });
        break;
      case 'stunned':
        beats.push({ kind: 'skip', actor: e.actor, fx: [], ticks: TICKS.skip });
        break;
      case 'combat_end':
        beats.push({ kind: 'end', outcome: e.outcome, reason: e.reason, rounds: e.rounds, fx: [], ticks: TICKS.end });
        break;
      case 'damage':
        push({ type: 'damage', unit: e.target, amount: e.amount, absorbed: e.absorbed, hp: e.hp, shield: e.shield });
        break;
      case 'heal':
        push({ type: 'heal', unit: e.target, amount: e.amount, hp: e.hp });
        break;
      case 'shield':
        push({ type: 'shield', unit: e.target, amount: e.amount, shield: e.shield });
        break;
      case 'stun':
        push({ type: 'stun', unit: e.target, turns: e.turns });
        break;
      case 'buff_atk':
        push({ type: 'buff', unit: e.target, pct: e.pct, total: e.total });
        break;
      case 'death':
        push({ type: 'death', unit: e.unit });
        break;
    }
  }
  return { units, beats };
}

/** Ce que l'écran affiche d'un combattant à un instant donné. */
export interface UnitState {
  hp: number;
  maxHp: number;
  shield: number;
  dead: boolean;
  stunned: boolean;
  buffPct: number;
}

export const initialStates = (units: readonly CombatUnitInfo[]): Record<string, UnitState> =>
  Object.fromEntries(units.map((u) => [u.id, { hp: u.maxHp, maxHp: u.maxHp, shield: 0, dead: false, stunned: false, buffPct: 0 }]));

/** Reporte sur l'état affiché les valeurs lues dans un temps du journal (aucun calcul de règles). */
export function applyBeat(states: Record<string, UnitState>, beat: Beat): void {
  if (beat.kind === 'skip') {
    const actor = states[beat.actor];
    if (actor) actor.stunned = false;
  }
  for (const fx of beat.fx) {
    const unit = states[fx.unit];
    if (!unit) continue;
    switch (fx.type) {
      case 'damage':
        unit.hp = fx.hp;
        unit.shield = fx.shield;
        break;
      case 'heal':
        unit.hp = fx.hp;
        break;
      case 'shield':
        unit.shield = fx.shield;
        break;
      case 'stun':
        unit.stunned = true;
        break;
      case 'buff':
        unit.buffPct = fx.total;
        break;
      case 'death':
        unit.dead = true;
        unit.stunned = false;
        break;
    }
  }
}

/** État final du combat, pour le bouton « passer ». */
export function finalStates(timeline: Timeline): Record<string, UnitState> {
  const states = initialStates(timeline.units);
  for (const beat of timeline.beats) applyBeat(states, beat);
  return states;
}

export interface Labels {
  unit(id: string): string;
  skill(id: string): string;
}

/** Lignes du journal textuel pour un temps. */
export function describeBeat(beat: Beat, labels: Labels): string[] {
  const lines: string[] = [];
  switch (beat.kind) {
    case 'start':
      lines.push('Le combat commence.');
      break;
    case 'round':
      lines.push(`— Tour ${beat.round} —`);
      break;
    case 'action':
      lines.push(
        beat.skill
          ? `${labels.unit(beat.actor)} lance ${labels.skill(beat.skill)}.`
          : `${labels.unit(beat.actor)} attaque ${labels.unit(beat.target)}.`,
      );
      break;
    case 'trigger':
      lines.push(`${labels.unit(beat.actor)} : ${labels.skill(beat.skill)}.`);
      break;
    case 'skip':
      lines.push(`${labels.unit(beat.actor)}, étourdi, passe son tour.`);
      break;
    case 'end':
      lines.push(
        beat.outcome === 'victory'
          ? `Victoire en ${beat.rounds} tour${beat.rounds > 1 ? 's' : ''}.`
          : beat.reason === 'round_limit'
            ? `Défaite : la limite de ${beat.rounds} tours est atteinte.`
            : 'Défaite : l\'équipage est hors combat.',
      );
      break;
  }
  for (const fx of beat.fx) {
    const name = labels.unit(fx.unit);
    switch (fx.type) {
      case 'damage':
        lines.push(
          fx.absorbed > 0 && fx.amount === 0
            ? `  ${name} : bouclier −${fx.absorbed}.`
            : `  ${name} −${fx.amount} PV${fx.absorbed > 0 ? ` (bouclier −${fx.absorbed})` : ''} → ${fx.hp}.`,
        );
        break;
      case 'heal':
        lines.push(`  ${name} +${fx.amount} PV → ${fx.hp}.`);
        break;
      case 'shield':
        lines.push(`  ${name} gagne un bouclier de ${fx.amount}.`);
        break;
      case 'stun':
        lines.push(`  ${name} est étourdi.`);
        break;
      case 'buff':
        lines.push(`  ${name} : ATK +${fx.pct} %.`);
        break;
      case 'death':
        lines.push(`  ${name} est hors combat.`);
        break;
    }
  }
  return lines;
}
