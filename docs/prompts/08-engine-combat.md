# Tâche 8 — Moteur : RNG seedé et combat automatique

Lis `CLAUDE.md`, `docs/cadrage.md` (sections 4 et 8) et **`docs/regles-j1.md`** (sections placement, ciblage, combat, compétences, déterminisme). Les tâches 1 à 7 sont mergées.

Objectif : créer `packages/engine` et y implémenter la résolution déterministe d'**un combat** (une vague), qui produit un journal d'événements rejouable par le front.

À faire :
1. Package `packages/engine`, TypeScript pur :
   - aucune dépendance au DOM, au réseau, au système de fichiers ni à la base (`lib` sans `DOM` dans le tsconfig) ;
   - il consomme les types de `packages/game-data`, jamais la base ni `canon.json` directement ;
   - les règles de lint de la tâche 5 pour `packages/engine/**` s'appliquent.
2. RNG seedé :
   - algorithme documenté et justifié dans ton plan (ex. sfc32, xoshiro128**), entiers 32 bits, aucune dépendance externe nécessaire ;
   - injecté partout où il y a de l'aléatoire, jamais global ; état sérialisable ;
   - tests contre des valeurs de référence fixes.
3. Combat :
   - entrée : deux équipes avec placement (avant/arrière) et stats finales (niveaux et synergies déjà appliqués : c'est la tâche 9 qui les calcule) ;
   - résolution exacte selon `docs/regles-j1.md` : ordre des actions, ciblage, compétences du catalogue fermé, limite de durée ;
   - sortie : issue (victoire, défaite, ou ce que le document prévoit) et **journal d'événements typé** (début, action, dégâts, soin, effet, mort, fin), suffisant pour que le front rejoue le combat sans recalculer quoi que ce soit ;
   - fonctions pures : aucune mutation des entrées.
4. Tests (Vitest) :
   - déterminisme : même seed et mêmes équipes donnent le même journal, octet pour octet ;
   - golden tests : journaux de référence commités pour quelques combats représentatifs ;
   - l'exemple déroulé de `docs/regles-j1.md` §15 reproduit à l'identique ;
   - cas limites : équipe vide, une ligne vide, égalités de vitesse, limite de durée atteinte.
5. Si un point de `docs/regles-j1.md` est ambigu ou contradictoire, arrête-toi et pose la question ; ne tranche pas seul.

Hors périmètre : boucle de partie (recrutement, fusion, synergies, vagues), front, simulateur.

Critères de fin :
- L'exemple de `docs/regles-j1.md` §15 est reproduit par un test.
- Tests de déterminisme et golden tests verts.
- Aucun `Math.random`, `Date` ni API d'environnement dans le moteur (le lint le garantit).
- `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test` et la CI passent.

Commence par me proposer un plan. Ne code rien avant ma validation.
