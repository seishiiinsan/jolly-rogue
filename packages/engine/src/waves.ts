import type { Enemy, GameData, Row } from '@jolly-rogue/game-data';
import type { CombatantInput } from './combat.js';
import { indexOf, mustGet } from './data.js';
import type { Rng } from './rng.js';

/** Un ennemi d'une vague générée : stats déjà mises à l'échelle de la vague. */
export interface WaveEnemy {
  enemyId: string;
  row: Row;
  hp: number;
  atk: number;
  spd: number;
}

/** Multiplicateur (en %) des PV et de l'ATK des ennemis de la vague `wave`. */
export function waveScalingPct(wave: number, data: GameData): number {
  const { base, linear, quadratic } = data.waves.scaling;
  const n = wave - 1;
  return base + linear * n + Math.floor((quadratic * n * n) / 100);
}

export const isBossWave = (wave: number, data: GameData): boolean => wave % data.waves.boss.every === 0;

/**
 * Génère la vague `wave` (docs/regles-j1.md §10).
 *
 * Consommation du RNG : un tirage `int(taille du vivier)` par sbire, dans l'ordre des emplacements.
 * Le boss ne consomme aucun tirage.
 */
export function generateWave(wave: number, data: GameData, rng: Rng): WaveEnemy[] {
  const index = indexOf(data);
  const { rowMax } = data.rules.team;
  const pct = waveScalingPct(wave, data);
  const out: WaveEnemy[] = [];
  const rowCount = { front: 0, back: 0 };

  const place = (enemy: Enemy): void => {
    const other: Row = enemy.row === 'front' ? 'back' : 'front';
    const row = rowCount[enemy.row] < rowMax ? enemy.row : other;
    rowCount[row] += 1;
    out.push({
      enemyId: enemy.id,
      row,
      hp: Math.floor((enemy.hp * pct) / 100),
      atk: Math.floor((enemy.atk * pct) / 100),
      spd: enemy.spd,
    });
  };

  let minions: number;
  if (isBossWave(wave, data)) {
    const tier = wave / data.waves.boss.every;
    const order = data.waves.boss.order;
    place(mustGet(index.enemies, order[(tier - 1) % order.length] as string, 'boss'));
    minions = Math.min(data.waves.boss.escorts.max, data.waves.boss.escorts.base + tier);
  } else {
    const { base, step, max } = data.waves.count;
    minions = Math.min(max, base + Math.floor((wave - 1) / step));
  }

  const available = index.minions.filter((e) => (e.minWave ?? 1) <= wave);
  const frontOnly = available.filter((e) => e.row === 'front');
  for (let i = 0; i < minions; i++) {
    // Le premier combattant de la vague tient toujours la ligne avant.
    const pool = out.length === 0 ? frontOnly : available;
    place(pool[rng.int(pool.length)] as Enemy);
  }
  return out;
}

export function waveCombatants(enemies: readonly WaveEnemy[], data: GameData): CombatantInput[] {
  const index = indexOf(data);
  return enemies.map((e) => {
    const enemy = mustGet(index.enemies, e.enemyId, 'ennemi');
    return {
      ref: e.enemyId,
      kind: 'enemy',
      level: 1,
      row: e.row,
      archetype: enemy.archetype,
      hp: e.hp,
      atk: e.atk,
      spd: e.spd,
      skill: enemy.skill === undefined ? null : mustGet(index.skills, enemy.skill, 'compétence'),
    };
  });
}
