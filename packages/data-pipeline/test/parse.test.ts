import { describe, expect, it } from 'vitest';
import { parseApiOnepieceResponse } from '../src/parse/api-onepiece.js';
import { fixtureBody } from './helpers.js';

describe('parse api-onepiece (fixtures réelles)', () => {
  it('personnages EN : Luffy normalisé, Doc Q rejeté pour sa taille', () => {
    const { records, rejections } = parseApiOnepieceResponse('characters', fixtureBody('characters', 'en'));
    expect(records).toHaveLength(25);
    expect(records.find((r) => r.externalId === '1')?.data).toEqual({
      name: 'Monkey D Luffy',
      heightCm: 174,
      age: 19,
      bounty: 3_000_000_000,
      job: 'Captain',
      status: 'alive',
      crewId: '1',
      fruitId: '196',
    });
    expect(rejections).toEqual([
      { externalId: '256', errors: [{ path: 'size', message: 'taille non reconnu(e) : "352cl"' }] },
    ]);
  });

  it('personnages FR : statut « vivant », nom FR', () => {
    const { records } = parseApiOnepieceResponse('characters', fixtureBody('characters', 'fr'));
    const zunesha = records.find((r) => r.externalId === '603')?.data;
    expect(zunesha).toMatchObject({ heightCm: 3_500_000, age: 1000, status: 'alive' });
    expect(records.find((r) => r.externalId === '760')?.data.status).toBe('unknown');
    expect(records.find((r) => r.externalId === '761')?.data).toMatchObject({ status: 'deceased', age: 65 });
  });

  it('fruits : types et sous-types, descriptions non conservées', () => {
    const { records, rejections } = parseApiOnepieceResponse('fruits', fixtureBody('fruits', 'en'));
    expect(rejections).toEqual([]);
    const byId = new Map(records.map((r) => [r.externalId, r.data]));
    expect(byId.get('196')).toEqual({
      name: 'Hito Hito no Mi, Nika model',
      romanName: 'Hito Hito no Mi, Moderu: Nika',
      type: 'zoan',
      subtype: 'mythical',
    });
    expect(byId.get('127')).toMatchObject({ romanName: null, type: 'zoan', subtype: 'smile' });
    expect(byId.get('212')).toMatchObject({ type: null, subtype: 'clone' });
  });

  it('sagas et arcs', () => {
    const sagas = parseApiOnepieceResponse('sagas', fixtureBody('sagas', 'en'));
    expect(sagas.rejections).toEqual([]);
    expect(sagas.records.map((r) => [r.data.number, r.data.chapterStart, r.data.chapterEnd])).toContainEqual([9, 802, null]);
    expect(sagas.records.find((r) => r.data.number === 10)?.data).toMatchObject({ chapterStart: null, chapterEnd: null });

    const arcs = parseApiOnepieceResponse('arcs', fixtureBody('arcs', 'fr'));
    expect(arcs.records[0]?.data).toEqual({ title: 'Arc Romance Dawn', sagaId: '1' });
  });

  it('entrée invalide ou id en double : rejetée sans bloquer le lot', () => {
    const body = JSON.stringify([
      { id: 1, title: 'A', saga: { id: 1 } },
      { id: 1, title: 'B', saga: { id: 1 } },
      { id: 2, title: '', saga: null },
      { title: 'sans id' },
    ]);
    const { records, rejections } = parseApiOnepieceResponse('arcs', body);
    expect(records.map((r) => r.externalId)).toEqual(['1']);
    expect(rejections.map((r) => r.externalId)).toEqual(['1#1', '2', '#3']);
  });

  it('body non tableau : erreur', () => {
    expect(() => parseApiOnepieceResponse('arcs', '{"error":"x"}')).toThrow(/tableau JSON/);
  });
});
