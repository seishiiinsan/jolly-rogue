import { type RunState, applyChoice, createRun, teamSynergies } from '@jolly-rogue/engine';
import type { GameData } from '@jolly-rogue/game-data';
import { type Bot, botRng } from './bots.js';

/** Garde-fou : une partie de bot s'arrête de toute façon ici. */
export const MAX_CHOICES = 5000;

export interface RunSummary {
  seed: number;
  wavesCleared: number;
  score: number;
  /** Actions de combat (attaques et compétences) sur toute la partie. */
  combatActions: number;
  /** Offres de recrutement vues. */
  offers: number;
  finalTeam: { slug: string; level: number }[];
  /** Palier de synergie atteint par faction dans l'équipe finale (0 = aucun). */
  finalSynergies: { faction: string; tier: number }[];
  /** Pour chaque perso : fois proposé, fois recruté. */
  offered: Map<string, number>;
  recruited: Map<string, number>;
}

const bump = (map: Map<string, number>, key: string): void => {
  map.set(key, (map.get(key) ?? 0) + 1);
};

/** Joue une partie complète avec un bot, uniquement via `createRun` et `applyChoice`. */
export function playRun(seed: number, bot: Bot, data: GameData): RunSummary {
  const rng = botRng(seed);
  let state: RunState = createRun(seed, data).state;
  let combatActions = 0;
  let offers = 0;
  const offered = new Map<string, number>();
  const recruited = new Map<string, number>();

  for (let i = 0; i < MAX_CHOICES && state.phase !== 'over'; i++) {
    const result = applyChoice(state, bot.next(state, data, rng), data);
    if (!result.ok) throw new Error(`bot ${bot.name}, seed ${seed} : choix illégal (${result.error.code})`);
    state = result.state;
    for (const event of result.events) {
      if (event.type === 'combat') {
        for (const e of event.events) if (e.type === 'action') combatActions += 1;
      } else if (event.type === 'offer') {
        offers += 1;
        for (const slug of event.offer) bump(offered, slug);
      } else if (event.type === 'recruited') {
        bump(recruited, event.slug);
      }
    }
  }

  return {
    seed,
    wavesCleared: state.wavesCleared,
    score: state.score,
    combatActions,
    offers,
    finalTeam: state.team.map((m) => ({ slug: m.slug, level: m.level })),
    finalSynergies: teamSynergies(state.team, data).map((s) => ({ faction: s.faction, tier: s.activeTier ?? 0 })),
    offered,
    recruited,
  };
}

export function playRuns(bot: Bot, data: GameData, runs: number, seedFrom: number): RunSummary[] {
  const out: RunSummary[] = [];
  for (let i = 0; i < runs; i++) out.push(playRun(seedFrom + i, bot, data));
  return out;
}
