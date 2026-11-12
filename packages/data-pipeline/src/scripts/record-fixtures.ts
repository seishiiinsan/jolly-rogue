/**
 * Extrait des fixtures de test depuis le cache HTTP (réponses réelles d'api-onepiece.com), sans
 * aucune requête réseau. Seul un sous-ensemble d'entrées est conservé (cas représentatifs et
 * tordus), sans retouche : chaque entrée est copiée telle quelle depuis la réponse d'origine.
 *
 *   pnpm --filter @jolly-rogue/data-pipeline build
 *   node packages/data-pipeline/dist/scripts/record-fixtures.js
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cacheDir, userAgent } from '../config.js';
import { HttpClient } from '../http/client.js';
import { API_ONEPIECE_LANGS, type ApiOnepieceResource, apiOnepieceUrl } from '../parse/api-onepiece.js';

/** Personnages retenus et pourquoi. Équipages et fruits référencés sont ajoutés automatiquement. */
const CHARACTER_IDS = [
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Chapeaux de paille (+ Zeus, membre selon l'API)
  247, // Barbe Noire : nom composé « Marchall D. Teach / Barbe Noire »
  290, 662, // Ace (décédé) et Sabo : même fruit
  51, // Absalom (décédé) : fruit repris par Shiliew
  392, 395, // Lucci et Funkfreed : deux porteurs vivants du même fruit
  254, 264, // Sanjuan Wolf ×2 : collision de slug
  59, 62, // Kid et Wire : deux « Captain » dans le même équipage
  256, // Doc Q : taille « 352cl » (rejet Zod)
  603, // Zunesha : « 35km », « 1 000 ans »
  484, // Carotte : âge « 11 ans » avec espace initial
  760, // Bigalo : statut null
  761, // Vegapunk : statut « dead », âge sans « ans »
];
const EXTRA_FRUIT_IDS = [11, 212, 93, 206, 127];
const SAGA_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ARC_IDS = [1, 2, 3, 50];
const LOCATE_IDS = [1, 106, 2, 3];

const outDir = fileURLToPath(new URL('../../fixtures/api-onepiece', import.meta.url));

type Entry = { id: number; crew?: { id: number } | null; fruit?: { id: number } | null };

async function main(): Promise<void> {
  const http = new HttpClient({ cacheDir: cacheDir(), userAgent: userAgent(), offline: true });
  const load = async (resource: ApiOnepieceResource, lang: string): Promise<Entry[]> =>
    JSON.parse((await http.get(apiOnepieceUrl(resource, lang as 'en' | 'fr'))).body) as Entry[];

  const charactersEn = await load('characters', 'en');
  const picked = charactersEn.filter((c) => CHARACTER_IDS.includes(c.id));
  const ids: Record<ApiOnepieceResource, Set<number>> = {
    characters: new Set(CHARACTER_IDS),
    crews: new Set(picked.flatMap((c) => (c.crew ? [c.crew.id] : []))),
    fruits: new Set([...picked.flatMap((c) => (c.fruit ? [c.fruit.id] : [])), ...EXTRA_FRUIT_IDS]),
    sagas: new Set(SAGA_IDS),
    arcs: new Set(ARC_IDS),
    locates: new Set(LOCATE_IDS),
  };

  await mkdir(outDir, { recursive: true });
  for (const [resource, wanted] of Object.entries(ids) as [ApiOnepieceResource, Set<number>][]) {
    for (const lang of API_ONEPIECE_LANGS) {
      const entries = (await load(resource, lang)).filter((e) => wanted.has(e.id));
      const file = path.join(outDir, `${resource}.${lang}.json`);
      await writeFile(file, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
      console.log(`${file} : ${entries.length} entrées`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
