/**
 * Enregistre les fixtures Fandom : la réponse réelle de l'API (`prop=revisions`) pour une liste de
 * pages représentatives, puis celle de leurs `Template:… Tabs Top`. Les URL sont construites comme
 * dans le pipeline (`revisionsParams`), si bien que les tests peuvent pré-remplir le cache avec.
 * Passe par le client HTTP (cache disque, 1 requête/s) : `--offline` pour ne lire que le cache.
 *
 *   pnpm --filter @jolly-rogue/data-pipeline build
 *   node packages/data-pipeline/dist/scripts/record-fixtures-fandom.js [--offline]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cacheDir, userAgent } from '../config.js';
import { HttpClient } from '../http/client.js';
import { fandomApiUrl, parseApiBody, revisionsResponse, wikiPagesFromResponse } from '../parse/fandom/api.js';
import { revisionsParams, templatesToFetch } from '../sources/fandom.js';

/** Pages retenues et pourquoi. */
export const FIXTURE_TITLES = [
  'Monkey D. Luffy', // Tabs Top, 7 primes historiques, fruit Paramecia + Mythical Zoan
  'Roronoa Zoro', // sans fruit, résidence {{Status|noncanon}}
  'Nami', // affiliation « defected »
  'Portgas D. Ace', // mort (status=2, age2), toutes primes barrées, « At least », taille non chronologique
  'Edward Newgate', // mort, prime barrée
  'Smoker', // prime « At least ★★★★★ » sur deux lignes
  'Borsalino', // infobox dans la page, prime {{C|3}}
  'Tony Tony Chopper', // Zoan, primes minuscules
  'Brook', // âges en liste à puces
  'Marshall D. Teach', // deux fruits (dfname2)
  'Gomu Gomu no Mi', // fruit à deux identités (----)
  'Mera Mera no Mi', // plusieurs porteurs, pas de rname
  'Straw Hat Pirates', // Crew Box dans un Tabs Top, prime totale avec Refn
  // Réconciliation (tâche 4) : équipage du Chapeau de paille complet et ses fruits.
  'Usopp',
  'Sanji',
  'Nico Robin',
  'Franky',
  'Jinbe',
  'Hana Hana no Mi',
  'Hito Hito no Mi',
  'Yomi Yomi no Mi',
  'Zeus', // affiliation Straw Hat Pirates sans qualificatif (corrigée dans les overrides)
  'Pirate Bear', // idem, absent d'api-onepiece
  'Kurozumi Tama', // homonymie « Tama » : alias
  'Tama (Sphinx)',
  'Supa Supa no Mi', // porteur actuel + copie artificielle (S-Hawk)
  'S-Hawk', // « (Artifical) » : copie artificielle
  'Jolly Rogue Fixture Missing Page', // page inexistante : rejet « page introuvable »
].sort();

const outDir = fileURLToPath(new URL('../../fixtures/fandom', import.meta.url));

async function main(): Promise<void> {
  const http = new HttpClient({
    cacheDir: cacheDir(),
    userAgent: userAgent(),
    offline: process.argv.includes('--offline'),
    log: (m) => console.log(m),
  });

  const pagesUrl = fandomApiUrl(revisionsParams(FIXTURE_TITLES, true));
  const pagesBody = (await http.get(pagesUrl)).body;
  const pages = wikiPagesFromResponse(parseApiBody(revisionsResponse, pagesBody, pagesUrl));
  const templates = templatesToFetch(pages);
  const templatesUrl = fandomApiUrl(revisionsParams(templates, false));
  const templatesBody = (await http.get(templatesUrl)).body;

  await mkdir(outDir, { recursive: true });
  for (const [name, body] of [
    ['pages', pagesBody],
    ['templates', templatesBody],
  ] as const) {
    const file = path.join(outDir, `${name}.json`);
    await writeFile(file, `${JSON.stringify(JSON.parse(body), null, 2)}\n`, 'utf8');
    console.log(`${file} écrit`);
  }
  console.log(`${pages.length} pages, ${templates.length} templates Tabs Top`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
