# @jolly-rogue/engine

Moteur de jeu de J1 : TypeScript pur, déterministe, sans DOM, réseau, fichiers ni base.
Même seed + mêmes choix = même partie. Les règles sont celles de [`docs/regles-j1.md`](../../docs/regles-j1.md).

```ts
import { applyChoice, createRun, replay } from '@jolly-rogue/engine';

let { state } = createRun(2026, gameData);            // gameData = data/exports/game.json
const result = applyChoice(state, { type: 'start' }, gameData);
if (result.ok) state = result.state;                   // result.events : journal du combat, offre…
replay(2026, gameData, choices);                       // même état final et même score
```

| Fichier | Rôle |
| --- | --- |
| `src/rng.ts` | RNG seedé `sfc32`, état sérialisable (4 entiers) |
| `src/combat.ts` | Résolution d'un combat et journal d'événements typé (`EVENT_LOG_VERSION`) |
| `src/team.ts` | Niveaux de fusion et synergies → stats finales |
| `src/waves.ts` | Génération des vagues et des boss |
| `src/run.ts` | Boucle de partie : `createRun`, `applyChoice`, `replay`, score |

- L'état de partie (`RunState`) est du JSON pur ; il contient l'état du RNG.
- L'ordre de consommation du RNG est documenté dans `src/run.ts`, `src/waves.ts` et `src/combat.ts` : le changer casse le rejeu.
- Le lint interdit `Math.random`, `Date`, `performance`, `setTimeout`, `setInterval`, `fetch`, `process`, `window` et `document` dans ce package.
- Journaux de référence dans `test/golden/`. Un changement de règles **voulu** les régénère : `UPDATE_GOLDEN=1 pnpm --filter @jolly-rogue/engine test`.
