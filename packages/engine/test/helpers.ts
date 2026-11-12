import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type GameData, type Skill, gameDataSchema } from '@jolly-rogue/game-data';
import { expect } from 'vitest';
import type { CombatantInput } from '../src/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Données de jeu réelles, telles que le moteur les reçoit (data/exports/game.json). */
export const gameData: GameData = gameDataSchema.parse(
  JSON.parse(readFileSync(path.resolve(here, '../../../data/exports/game.json'), 'utf8')),
);

export const skill = (id: string): Skill => {
  const found = gameData.skills.find((s) => s.id === id);
  if (!found) throw new Error(`compétence inconnue : ${id}`);
  return found;
};

/** Combattant de test : poing sans compétence par défaut. */
export const unit = (overrides: Partial<CombatantInput> = {}): CombatantInput => ({
  ref: 'test',
  kind: 'enemy',
  level: 1,
  row: 'front',
  archetype: 'poing',
  hp: 100,
  atk: 10,
  spd: 10,
  skill: null,
  ...overrides,
});

/**
 * Compare à un fichier de référence commité (test/golden). `UPDATE_GOLDEN=1 pnpm test` le régénère :
 * à ne faire que pour un changement de règles voulu, car il casse le rejeu des parties existantes.
 */
export function expectGolden(name: string, value: unknown): void {
  const file = path.join(here, 'golden', `${name}.json`);
  const actual = `${JSON.stringify(value, null, 1)}\n`;
  if (process.env['UPDATE_GOLDEN'] === '1' || !existsSync(file)) {
    if (process.env['CI']) throw new Error(`fichier de référence manquant : ${file}`);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, actual);
  }
  expect(actual).toBe(readFileSync(file, 'utf8'));
}
