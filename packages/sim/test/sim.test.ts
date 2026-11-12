import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { replay } from '@jolly-rogue/engine';
import { type GameData, gameDataSchema } from '@jolly-rogue/game-data';
import { describe, expect, it } from 'vitest';
import { BOTS, botByName } from '../src/bots.js';
import { renderReport } from '../src/report.js';
import { playRun, playRuns } from '../src/simulate.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const data: GameData = gameDataSchema.parse(
  JSON.parse(readFileSync(path.resolve(here, '../../../data/exports/game.json'), 'utf8')),
);

describe('bots', () => {
  it('les bots demandés existent', () => {
    for (const name of ['random', 'rarity', 'synergy', 'frontline']) expect(botByName(name)).toBeDefined();
    expect(botByName('inconnu')).toBeUndefined();
  });

  for (const bot of BOTS) {
    it(`${bot.name} : ne joue que des coups légaux et termine ses parties`, () => {
      for (const run of playRuns(bot, data, 40, 1)) {
        expect(run.wavesCleared).toBeGreaterThanOrEqual(0);
        expect(run.finalTeam.length).toBeGreaterThanOrEqual(2);
        expect(run.finalTeam.length).toBeLessThanOrEqual(data.rules.team.max);
      }
    });

    it(`${bot.name} : déterministe pour une seed donnée`, () => {
      expect(playRun(123, bot, data)).toEqual(playRun(123, bot, data));
    });
  }

  it('un bot appliqué va plus loin que le hasard', () => {
    const mean = (name: string): number => {
      const runs = playRuns(botByName(name) as (typeof BOTS)[number], data, 200, 1);
      return runs.reduce((sum, r) => sum + r.wavesCleared, 0) / runs.length;
    };
    expect(mean('rarity')).toBeGreaterThan(mean('random') + 3);
  });

  it('le score d\'une partie de bot est celui du moteur', () => {
    const run = playRun(7, botByName('rarity') as (typeof BOTS)[number], data);
    expect(run.score).toBeGreaterThanOrEqual(run.wavesCleared * data.rules.score.perWave);
    expect(replay(7, data, []).ok).toBe(true);
  });
});

describe('rapport', () => {
  const results = () => BOTS.filter((b) => b.name !== 'lookahead').map((bot) => ({ bot, runs: playRuns(bot, data, 60, 1) }));

  it('est reproductible : deux exécutions donnent le même fichier, sans horodatage', () => {
    const a = renderReport(results(), data, 60, 1);
    const b = renderReport(results(), data, 60, 1);
    expect(a).toBe(b);
    expect(a).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('contient les sections attendues', () => {
    const report = renderReport(results(), data, 60, 1);
    for (const title of [
      '## Vagues gagnées par bot',
      '## Durée estimée d\'une partie',
      '## Mortalité par vague',
      '### Par perso',
      '### Par faction et palier de synergie',
      '## Signaux d\'alerte',
    ]) {
      expect(report).toContain(title);
    }
    for (const c of data.characters) expect(report).toContain(`\`${c.slug}\``);
  });
});
