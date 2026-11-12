import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Racine des données : `/data` dans Docker (DATA_DIR), `<repo>/data` sur l'hôte. */
export function dataDir(): string {
  const fromEnv = process.env['DATA_DIR'];
  if (fromEnv) return fromEnv;
  return fileURLToPath(new URL('../../../data', import.meta.url));
}

export const cacheDir = (): string => path.join(dataDir(), 'cache');
export const exportsDir = (): string => path.join(dataDir(), 'exports');

/** User-Agent explicite avec un moyen de contact (docs/cadrage.md §9.3). */
export const DEFAULT_USER_AGENT =
  'jolly-rogue-data-pipeline/0.1 (non-commercial One Piece fan game; +https://github.com/seishiiinsan/jolly-rogue)';

export function userAgent(): string {
  return process.env['PIPELINE_USER_AGENT'] || DEFAULT_USER_AGENT;
}
