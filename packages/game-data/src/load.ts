import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type CanonExport, canonExportSchema } from '@jolly-rogue/db';
import { parse } from 'yaml';
import type { RawGameFiles } from './validate.js';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Dossier des YAML écrits à la main (`packages/game-data/game`). */
export const GAME_DIR = path.resolve(here, '..', 'game');
/** Dossier des exports : `DATA_DIR/exports` dans Docker, `<repo>/data/exports` sinon. */
export const exportsDir = (): string =>
  path.join(process.env['DATA_DIR'] ?? path.resolve(here, '..', '..', '..', 'data'), 'exports');

const readYaml = async (dir: string, name: string): Promise<unknown> =>
  parse(await readFile(path.join(dir, name), 'utf8')) as unknown;

export async function loadRawGameFiles(dir: string = GAME_DIR): Promise<RawGameFiles> {
  const [rules, characters, skills, enemies, waves, synergies] = await Promise.all(
    ['rules.yaml', 'characters.yaml', 'skills.yaml', 'enemies.yaml', 'waves.yaml', 'synergies.yaml'].map((name) =>
      readYaml(dir, name),
    ),
  );
  return { rules, characters, skills, enemies, waves, synergies };
}

export async function loadCanon(file: string = path.join(exportsDir(), 'canon.json')): Promise<CanonExport> {
  return canonExportSchema.parse(JSON.parse(await readFile(file, 'utf8')));
}
