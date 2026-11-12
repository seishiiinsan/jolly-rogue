import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { CanonExport } from '@jolly-rogue/db';
import { exportsDir, loadCanon, loadRawGameFiles } from '../src/load.js';
import { gameDataSchema } from '../src/schema.js';
import { type RawGameFiles, type ValidationIssue, formatIssue, validateGameData } from '../src/validate.js';

let canon: CanonExport;
let raw: RawGameFiles;

beforeAll(async () => {
  canon = await loadCanon();
  raw = await loadRawGameFiles();
});

/** Copie des fichiers réels, modifiable par test. */
const copy = (): Record<keyof RawGameFiles, never> => structuredClone(raw) as Record<keyof RawGameFiles, never>;

function issuesOf(files: RawGameFiles): ValidationIssue[] {
  const result = validateGameData(files, canon);
  return result.ok ? [] : result.issues;
}

type Entry = Record<string, unknown>;
const list = (files: RawGameFiles, key: 'characters' | 'skills' | 'enemies' | 'synergies'): Entry[] => files[key] as Entry[];
const find = (files: RawGameFiles, key: 'characters' | 'skills' | 'enemies', field: string, value: string): Entry => {
  const entry = list(files, key).find((e) => e[field] === value);
  if (!entry) throw new Error(`${value} introuvable`);
  return entry;
};

describe('données de jeu réelles', () => {
  it('sont valides : 15 persos, tous présents dans le canon', () => {
    const result = validateGameData(raw, canon);
    expect(result.ok ? [] : result.issues.map(formatIssue)).toEqual([]);
    if (!result.ok) return;
    expect(result.data.characters).toHaveLength(15);
    const canonSlugs = new Set(canon.characters.map((c) => c.slug));
    for (const c of result.data.characters) expect(canonSlugs.has(c.slug), c.slug).toBe(true);
    // Chaque faction a 3 à 5 membres et une synergie.
    for (const s of result.data.synergies) {
      const members = result.data.characters.filter((c) => c.faction === s.faction).length;
      expect(members).toBeGreaterThanOrEqual(3);
      expect(members).toBeLessThanOrEqual(5);
    }
    expect(new Set(result.data.characters.map((c) => c.faction)).size).toBe(result.data.synergies.length);
  });

  it('ne recopient aucun fait de lore (ni nom de perso, ni équipage, ni fruit)', () => {
    const result = validateGameData(raw, canon);
    if (!result.ok) throw new Error('données invalides');
    for (const c of result.data.characters) expect(Object.keys(c).sort()).toEqual(['archetype', 'atk', 'faction', 'hp', 'rarity', 'skill', 'slug', 'spd']);
    for (const e of result.data.enemies.filter((x) => x.boss)) expect(e.name).toBeUndefined();
  });

  it('data/exports/game.json est à jour et le build est stable', async () => {
    const first = validateGameData(await loadRawGameFiles(), canon);
    const second = validateGameData(await loadRawGameFiles(), canon);
    if (!first.ok || !second.ok) throw new Error('données invalides');
    const serialized = `${JSON.stringify(first.data, null, 2)}\n`;
    expect(`${JSON.stringify(second.data, null, 2)}\n`).toBe(serialized);
    // Si ce test échoue : `pnpm --filter @jolly-rogue/game-data build` puis commiter game.json.
    const committed = await readFile(path.join(exportsDir(), 'game.json'), 'utf8');
    expect(committed).toBe(serialized);
    expect(gameDataSchema.safeParse(JSON.parse(committed)).success).toBe(true);
    expect(committed).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});

describe('validation : erreurs', () => {
  it('un slug de perso absent du canon échoue avec un message clair', () => {
    const files = copy();
    find(files, 'characters', 'slug', 'usopp')['slug'] = 'usop';
    const issues = issuesOf(files);
    expect(issues.map(formatIssue)).toContain(
      'characters.yaml › usop : slug absent de canon.json (characters) : corrige le slug ou ajoute le perso au canon via le pipeline',
    );
  });

  it('une faction absente du canon, ou à laquelle le perso n\'appartient pas, échoue', () => {
    const files = copy();
    find(files, 'characters', 'slug', 'usopp')['faction'] = 'equipage-inconnu';
    find(files, 'characters', 'slug', 'hina')['faction'] = 'mugiwara-no-ichimi';
    const messages = issuesOf(files).map(formatIssue);
    expect(messages.some((m) => m.startsWith('characters.yaml › usopp : faction « equipage-inconnu » absente de canon.json'))).toBe(true);
    expect(messages.some((m) => m.startsWith('characters.yaml › hina : le canon ne rattache pas ce perso à « mugiwara-no-ichimi »'))).toBe(true);
  });

  it('références internes : compétence, boss et ennemi inexistants', () => {
    const files = copy();
    find(files, 'characters', 'slug', 'sanji')['skill'] = 'coup-inconnu';
    find(files, 'enemies', 'id', 'brute')['skill'] = 'coup-inconnu';
    find(files, 'enemies', 'id', 'boss-lucci')['canonSlug'] = 'personne';
    (files.waves as { boss: { order: string[] } }).boss.order.push('boss-fantome', 'matelot');
    const messages = issuesOf(files).map(formatIssue);
    expect(messages).toContain('characters.yaml › sanji : compétence « coup-inconnu » introuvable dans skills.yaml');
    expect(messages).toContain('enemies.yaml › brute : compétence « coup-inconnu » introuvable dans skills.yaml');
    expect(messages).toContain('enemies.yaml › boss-lucci : canonSlug « personne » absent de canon.json (characters)');
    expect(messages).toContain('waves.yaml › boss.order : ennemi « boss-fantome » introuvable dans enemies.yaml');
    expect(messages).toContain('waves.yaml › boss.order : « matelot » n\'est pas un boss (boss: true)');
  });

  it('doublons', () => {
    const files = copy();
    list(files, 'characters').push({ ...find(files, 'characters', 'slug', 'pica') });
    list(files, 'skills').push({ ...find(files, 'skills', 'id', 'seisme') });
    const messages = issuesOf(files).map(formatIssue);
    expect(messages).toContain('characters.yaml › pica : slug en double : garde une seule entrée');
    expect(messages).toContain('skills.yaml › seisme : id en double : garde une seule entrée');
  });

  it('budget de stats par rareté', () => {
    const files = copy();
    find(files, 'characters', 'slug', 'usopp')['atk'] = 60;
    expect(issuesOf(files).map(formatIssue)).toEqual([
      'characters.yaml › usopp : coût 406 (PV + 5×ATK + 3×VIT) hors du budget commun : 250 ± 10',
    ]);
  });

  it('schéma : champ inconnu, valeur non entière, effet hors catalogue', () => {
    const files = copy();
    find(files, 'characters', 'slug', 'usopp')['nom'] = 'Usopp';
    find(files, 'characters', 'slug', 'sanji')['hp'] = 12.5;
    find(files, 'skills', 'id', 'seisme')['effects'] = [{ type: 'teleport', target: 'self' }];
    const issues = issuesOf(files);
    const entries = new Set(issues.filter((i) => i.file === 'characters.yaml').map((i) => i.entry));
    expect(entries.has('usopp') && entries.has('sanji')).toBe(true);
    expect(issues.some((i) => i.file === 'skills.yaml' && i.entry === 'seisme')).toBe(true);
  });

  it('cible incompatible avec le déclencheur', () => {
    const files = copy();
    find(files, 'skills', 'id', 'corps-de-diamant')['effects'] = [{ type: 'damage', target: 'target', pct: 100 }];
    expect(issuesOf(files).some((i) => i.entry === 'corps-de-diamant' && i.message.includes('« target »'))).toBe(true);
  });

  it('palier de synergie inatteignable', () => {
    const files = copy();
    const synergy = list(files, 'synergies').find((s) => s['faction'] === 'kaigun') as { tiers: { count: number }[] };
    (synergy.tiers[1] as { count: number }).count = 5;
    expect(issuesOf(files).map(formatIssue)).toEqual([
      'synergies.yaml › kaigun : palier 5 inatteignable : la faction n\'a que 4 perso(s) dans characters.yaml',
    ]);
  });

  it('liste toutes les erreurs, pas seulement la première', () => {
    const files = copy();
    find(files, 'characters', 'slug', 'usopp')['slug'] = 'usop';
    find(files, 'characters', 'slug', 'sanji')['slug'] = 'sanjii';
    expect(issuesOf(files).filter((i) => i.message.startsWith('slug absent')).length).toBe(2);
  });
});
