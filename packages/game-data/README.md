# @jolly-rogue/game-data

Données de jeu de J1, **écrites à la main** : stats, raretés, compétences, ennemis, vagues, synergies.
Elles sont séparées du lore : le nom, l'équipage et le fruit d'un perso viennent de
`data/exports/canon.json` par son slug et ne sont jamais recopiés ici.

Référence des règles et des valeurs : [`docs/regles-j1.md`](../../docs/regles-j1.md).

## Fichiers (`game/`)

| Fichier | Contenu |
| --- | --- |
| `rules.yaml` | Constantes : taille d'équipe, niveaux de fusion, limite de tours, courbes de rareté, score, budgets, archétypes |
| `characters.yaml` | Persos jouables : `slug` et `faction` (slugs du canon), rareté, archétype, PV, ATK, VIT, compétence |
| `skills.yaml` | Catalogue fermé de compétences : un déclencheur et une liste d'effets paramétrés |
| `enemies.yaml` | Sbires génériques et boss (`canonSlug`) |
| `waves.yaml` | Formules de génération des vagues et ordre des boss |
| `synergies.yaml` | Paliers et bonus par faction |

Le format exact de chaque fichier, avec un exemple, est dans `docs/regles-j1.md` §14 ; les schémas
Zod et les types TypeScript sont dans `src/schema.ts` (`import { type GameData, gameDataSchema } from '@jolly-rogue/game-data'`).

## Commandes

Valider (schémas, slugs présents dans le canon, références internes, doublons, budgets de stats) :

```bash
pnpm --filter @jolly-rogue/game-data validate
```

Valider puis écrire `data/exports/game.json` (tri stable, aucun horodatage ; le fichier est commité) :

```bash
pnpm --filter @jolly-rogue/game-data build
```

Les deux commandes ont besoin du package `db` compilé : la première fois, `pnpm --filter @jolly-rogue/db build`.

Dans Docker :

```bash
docker compose run --rm game-data build
```

Une erreur dit quel fichier, quelle entrée et quoi corriger, par exemple :

```
characters.yaml › usop : slug absent de canon.json (characters) : corrige le slug ou ajoute le perso au canon via le pipeline
```

La CI lance la validation (tests + build) : un slug absent du canon ou un `game.json` pas à jour la fait échouer.

## Ajouter un perso

1. Trouver son slug dans `data/exports/canon.json` (`characters[].slug`) et celui de son équipage (`crews[].slug`). Le canon doit rattacher le perso à cet équipage ; sinon, corriger le canon via `packages/data-pipeline/overrides/`.
2. Ajouter l'entrée dans `game/characters.yaml`. Son coût `PV + 5 × ATK + 3 × VIT` doit tomber dans le budget de sa rareté (± 10).
3. Lui donner une compétence : une entrée existante de `game/skills.yaml`, ou une nouvelle, composée uniquement de déclencheurs et d'effets du catalogue. Un nouvel effet ou déclencheur est une évolution des règles : d'abord `docs/regles-*.md`, puis le moteur.
4. Si sa faction est nouvelle, ajouter ses paliers dans `game/synergies.yaml` (une faction jouable a 3 à 5 persos).
5. `pnpm --filter @jolly-rogue/game-data build`, puis commiter les YAML **et** `data/exports/game.json`.
6. Relancer le simulateur (`packages/sim`) pour vérifier l'équilibrage, et mettre à jour les tableaux de `docs/regles-j1.md`.

Changer une valeur modifie le résultat des parties : les journaux de référence du moteur
(`packages/engine/test/golden`) sont alors à régénérer (`UPDATE_GOLDEN=1 pnpm --filter @jolly-rogue/engine test`).
