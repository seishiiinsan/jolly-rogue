import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type CombatEvent, applyChoice, createRun } from '@jolly-rogue/engine';
import { type GameData, gameDataSchema } from '@jolly-rogue/game-data';
import { describe, expect, it } from 'vitest';
import { applyBeat, buildTimeline, describeBeat, finalStates, initialStates } from '../src/timeline.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const data: GameData = gameDataSchema.parse(JSON.parse(readFileSync(path.resolve(here, '../../../data/exports/game.json'), 'utf8')));

/** Journal réel du moteur : première vague d'une seed. */
function firstCombat(seed: number): CombatEvent[] {
  const result = applyChoice(createRun(seed, data).state, { type: 'start' }, data);
  if (!result.ok) throw new Error(result.error.message);
  const combat = result.events.find((e) => e.type === 'combat');
  if (combat?.type !== 'combat') throw new Error('combat attendu');
  return combat.events;
}

const labels = { unit: (id: string) => id.toUpperCase(), skill: (id: string) => `«${id}»` };

describe('journal → animations', () => {
  const events = firstCombat(2);
  const timeline = buildTimeline(events);

  it('découpe le journal en temps : début, tours, actions, fin', () => {
    expect(timeline.units.map((u) => u.id)).toEqual(['p0', 'p1', 'e0', 'e1']);
    expect(timeline.beats.map((b) => b.kind)).toEqual([
      'start', 'trigger', 'round', 'action', 'action', 'action', 'action', 'round', 'action', 'action', 'action', 'round', 'action', 'end',
    ]);
    expect(timeline.beats.at(-1)).toMatchObject({ kind: 'end', outcome: 'victory', rounds: 3 });
  });

  it('rattache chaque effet au temps qui le provoque', () => {
    expect(timeline.beats[1]).toMatchObject({ kind: 'trigger', actor: 'p1', skill: 'corps-de-diamant', fx: [{ type: 'shield', unit: 'p1', amount: 48 }] });
    expect(timeline.beats[3]).toMatchObject({ kind: 'action', actor: 'p0', target: 'e1', skill: null, fx: [{ type: 'damage', unit: 'e1', amount: 28, hp: 22 }] });
    expect(timeline.beats[8]?.fx.map((f) => f.type)).toEqual(['damage', 'death']);
    expect(timeline.beats[12]).toMatchObject({ kind: 'action', skill: 'etoile-explosive' });
  });

  it('ne perd aucun événement', () => {
    const fxCount = timeline.beats.reduce((sum, b) => sum + b.fx.length, 0);
    expect(timeline.beats.length + fxCount).toBe(events.length);
  });

  it('reporte les PV et boucliers lus dans le journal, sans rien recalculer', () => {
    const states = initialStates(timeline.units);
    expect(states['p1']).toEqual({ hp: 160, maxHp: 160, shield: 0, dead: false, stunned: false, buffPct: 0 });
    for (const beat of timeline.beats.slice(0, 5)) applyBeat(states, beat);
    expect(states['p1']).toMatchObject({ hp: 160, shield: 32 });
    expect(states['e1']).toMatchObject({ hp: 22, dead: false });
    expect(finalStates(timeline)).toMatchObject({
      p0: { hp: 70, dead: false },
      p1: { hp: 160, shield: 8 },
      e0: { hp: 0, dead: true },
      e1: { hp: 0, dead: true },
    });
  });

  it('étourdissement : affiché jusqu\'au tour passé', () => {
    const stunTimeline = buildTimeline([
      { type: 'combat_start', units: timeline.units },
      { type: 'action', actor: 'p0', kind: 'skill', skill: 'cage-noire', target: 'e0' },
      { type: 'stun', source: 'p0', target: 'e0', turns: 1 },
      { type: 'stunned', actor: 'e0' },
      { type: 'combat_end', outcome: 'defeat', reason: 'round_limit', rounds: 30 },
    ]);
    const states = initialStates(stunTimeline.units);
    applyBeat(states, stunTimeline.beats[0] as never);
    applyBeat(states, stunTimeline.beats[1] as never);
    expect(states['e0']?.stunned).toBe(true);
    applyBeat(states, stunTimeline.beats[2] as never);
    expect(states['e0']?.stunned).toBe(false);
    expect(describeBeat(stunTimeline.beats[2] as never, labels)).toEqual(['E0, étourdi, passe son tour.']);
    expect(describeBeat(stunTimeline.beats[3] as never, labels)).toEqual(['Défaite : la limite de 30 tours est atteinte.']);
  });

  it('journal textuel', () => {
    const lines = timeline.beats.flatMap((b) => describeBeat(b, labels));
    expect(lines.slice(0, 6)).toEqual([
      'Le combat commence.',
      'P1 : «corps-de-diamant».',
      '  P1 gagne un bouclier de 48.',
      '— Tour 1 —',
      'P0 attaque E1.',
      '  E1 −28 PV → 22.',
    ]);
    expect(lines).toContain('  P1 : bouclier −16.');
    expect(lines).toContain('P0 lance «etoile-explosive».');
    expect(lines).toContain('  E0 est hors combat.');
    expect(lines.at(-1)).toBe('Victoire en 3 tours.');
  });

  it('tient sur des journaux longs de toutes les seeds testées', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const log = firstCombat(seed);
      const t = buildTimeline(log);
      expect(t.beats[0]?.kind).toBe('start');
      expect(t.beats.at(-1)?.kind).toBe('end');
      const last = finalStates(t);
      for (const e of log) if (e.type === 'death') expect(last[e.unit]?.dead).toBe(true);
    }
  });

  it('refuse un journal qui ne commence pas par le début du combat', () => {
    expect(() => buildTimeline([{ type: 'death', unit: 'p0' }])).toThrow();
  });
});
