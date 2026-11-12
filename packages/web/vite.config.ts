import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CanonExport } from '@jolly-rogue/db';
import type { GameData } from '@jolly-rogue/game-data';
import { type Plugin, defineConfig } from 'vite';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const exportsDir = path.join(repoRoot, 'data', 'exports');

/**
 * Module virtuel `virtual:canon-names` : les noms affichés, résolus au build depuis canon.json
 * pour les seuls slugs utilisés par game.json. Évite d'embarquer tout l'export (≈ 1 Mo) et de
 * recopier un nom à la main.
 */
function canonNames(): Plugin {
  const id = 'virtual:canon-names';
  return {
    name: 'canon-names',
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    load(resolved) {
      if (resolved !== `\0${id}`) return undefined;
      const canon = JSON.parse(readFileSync(path.join(exportsDir, 'canon.json'), 'utf8')) as CanonExport;
      const game = JSON.parse(readFileSync(path.join(exportsDir, 'game.json'), 'utf8')) as GameData;
      const slugs = new Set([...game.characters.map((c) => c.slug), ...game.enemies.flatMap((e) => (e.canonSlug ? [e.canonSlug] : []))]);
      const factions = new Set(game.characters.map((c) => c.faction));
      const names = {
        characters: Object.fromEntries(canon.characters.filter((c) => slugs.has(c.slug)).map((c) => [c.slug, c.nameFr ?? c.nameEn])),
        crews: Object.fromEntries(canon.crews.filter((c) => factions.has(c.slug)).map((c) => [c.slug, c.nameFr ?? c.nameEn])),
        sources: canon.sources.filter((s) => s.url !== ''),
      };
      for (const slug of [...slugs]) if (!(slug in names.characters)) throw new Error(`canon-names : slug absent du canon : ${slug}`);
      return `export default ${JSON.stringify(names)};`;
    },
  };
}

export default defineConfig({
  // Chemins relatifs : le build statique se sert depuis n'importe quel dossier (playtest J1).
  base: './',
  plugins: [canonNames()],
  // `source` : moteur et données importés depuis leurs sources TS, sans build préalable.
  resolve: { conditions: ['source', 'module', 'browser', 'development|production'] },
  server: { host: '127.0.0.1', port: 5173, strictPort: true, fs: { allow: [repoRoot] } },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: { target: 'es2022' },
});
