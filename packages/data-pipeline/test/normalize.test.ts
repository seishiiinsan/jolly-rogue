import { describe, expect, it } from 'vitest';
import {
  parseAge,
  parseBounty,
  parseChapterRange,
  parseFruitType,
  parseHeightCm,
  parseVitalStatus,
} from '../src/parse/normalize.js';
import { slugify } from '../src/slug.js';

describe('normaliseurs api-onepiece', () => {
  it('prime : séparateurs de milliers, vide → null, format inconnu → undefined', () => {
    expect(parseBounty('3.000.000.000')).toBe(3_000_000_000);
    expect(parseBounty('1000')).toBe(1000);
    expect(parseBounty('')).toBeNull();
    expect(parseBounty(null)).toBeNull();
    expect(parseBounty('beaucoup')).toBeUndefined();
  });

  it('âge : « 19 ans », « 1 000 ans », « 11 ans » avec espace, « 65 »', () => {
    expect(parseAge('19 ans')).toBe(19);
    expect(parseAge('1 000 ans')).toBe(1000);
    expect(parseAge(' 11 ans')).toBe(11);
    expect(parseAge('65')).toBe(65);
    expect(parseAge('-')).toBeNull();
    expect(parseAge('"')).toBeNull();
    expect(parseAge('environ 20')).toBeUndefined();
  });

  it('taille : cm, m, km ; unité inconnue rejetée', () => {
    expect(parseHeightCm('174cm')).toBe(174);
    expect(parseHeightCm('1 187cm')).toBe(1187);
    expect(parseHeightCm('2,5m')).toBe(250);
    expect(parseHeightCm('35km')).toBe(3_500_000);
    expect(parseHeightCm('')).toBeNull();
    expect(parseHeightCm('352cl')).toBeUndefined();
  });

  it('statut vital EN/FR', () => {
    for (const v of ['living', 'alive', 'vivant']) expect(parseVitalStatus(v)).toBe('alive');
    for (const v of ['dead', 'deceased', 'mort', 'décédé']) expect(parseVitalStatus(v)).toBe('deceased');
    expect(parseVitalStatus('inconnu')).toBe('unknown');
    expect(parseVitalStatus(null)).toBe('unknown');
    expect(parseVitalStatus('zombie')).toBeUndefined();
  });

  it('type de fruit : sous-types Zoan, SMILE, clone', () => {
    expect(parseFruitType('Paramecia')).toEqual({ type: 'paramecia', subtype: null });
    expect(parseFruitType('Zoan Mythique')).toEqual({ type: 'zoan', subtype: 'mythical' });
    expect(parseFruitType('Zoan Antique')).toEqual({ type: 'zoan', subtype: 'ancient' });
    expect(parseFruitType('Smile')).toEqual({ type: 'zoan', subtype: 'smile' });
    expect(parseFruitType('Clone')).toEqual({ type: null, subtype: 'clone' });
    expect(parseFruitType('Inconnu')).toBeUndefined();
  });

  it('plage de chapitres', () => {
    expect(parseChapterRange('1 à 100')).toEqual({ start: 1, end: 100 });
    expect(parseChapterRange('802 à ?')).toEqual({ start: 802, end: null });
    expect(parseChapterRange('-')).toEqual({ start: null, end: null });
    expect(parseChapterRange('100 à 1')).toBeUndefined();
  });

  it('slugify', () => {
    expect(slugify('Monkey D Luffy')).toBe('monkey-d-luffy');
    expect(slugify('Gōto-jima')).toBe('goto-jima');
    expect(slugify('Marchall D. Teach / Barbe Noire')).toBe('marchall-d-teach-barbe-noire');
    expect(slugify('L’équipage du Chapeau de Paille')).toBe('lequipage-du-chapeau-de-paille');
    expect(slugify('Vegapunk “Shaka”')).toBe('vegapunk-shaka');
  });
});
