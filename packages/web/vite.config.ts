import { existsSync, readFileSync, readdirSync } from 'node:fs';
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

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const ART_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.avif']);

/**
 * Module virtuel `virtual:art` : inventaire des illustrations locales déposées dans `public/art/`
 * (dossier ignoré par Git, voir son README). Le dépôt n'en fournit aucune.
 */
function localArt(): Plugin {
  const id = 'virtual:art';
  const scan = (dir: string): Record<string, string> => {
    const full = path.join(webRoot, 'public', 'art', dir);
    if (!existsSync(full)) return {};
    return Object.fromEntries(
      readdirSync(full)
        .filter((file) => ART_EXTENSIONS.has(path.extname(file).toLowerCase()))
        .sort()
        .map((file) => [path.basename(file, path.extname(file)), `art/${dir}/${file}`]),
    );
  };
  return {
    name: 'local-art',
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    load: (resolved) =>
      resolved === `\0${id}` ? `export default ${JSON.stringify({ portraits: scan('portraits'), backgrounds: scan('backgrounds') })};` : undefined,
  };
}

export default defineConfig({
  // Chemins relatifs : le build statique se sert depuis n'importe quel dossier (playtest J1).
  base: './',
  plugins: [canonNames(), localArt()],
  // `source` : moteur et données importés depuis leurs sources TS, sans build préalable.
  resolve: { conditions: ['source', 'module', 'browser', 'development|production'] },
  server: { host: '127.0.0.1', port: 5173, strictPort: true, fs: { allow: [repoRoot] } },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  build: { target: 'es2022' },
});
