# Tâche 9 — Moteur : partie complète

Lis `CLAUDE.md`, `docs/cadrage.md` (sections 3, 4 et 8) et **`docs/regles-j1.md`**. Les tâches 1 à 8 sont mergées.

Objectif : implémenter dans `packages/engine` la boucle de partie complète, rejouable à l'identique à partir de la seed et de la liste des choix du joueur (base de l'anti-triche de J2).

À faire :
1. État de partie :
   - sérialisable en JSON (pas de classes, de fonctions ni de `Map` dans l'état) ;
   - contient l'état du RNG, la vague courante, l'équipe et son placement, l'offre de recrutement en cours, le score.
2. API pure, par exemple :
   - `createRun(seed, gameData)` → état initial (équipe de départ, première vague prête) ;
   - `applyChoice(state, choice)` → nouvel état + événements, ou erreur explicite si le choix est illégal ;
   - choix possibles : recruter l'offre n° i ou aucune, remplacer un perso (6e recrue), déplacer un perso avant/arrière, lancer la vague ;
   - `replay(seed, gameData, choices)` → même état final et même score que la partie jouée.
3. Règles, toutes selon `docs/regles-j1.md` :
   - offre de 3 persos avec probabilités de rareté qui montent avec les vagues ;
   - fusion d'un perso déjà présent ;
   - synergies de faction calculées sur l'équipe et appliquées aux stats avant le combat (tâche 8) ;
   - vagues générées par la formule du document, boss toutes les 10 vagues, vagues infinies ;
   - défaite = fin de partie, calcul du score.
4. Ordre de consommation du RNG documenté dans le code et conforme au document (sinon le replay serveur casse au moindre refactor).
5. Tests :
   - replay : pour des centaines de seeds, une partie jouée au hasard (avec un générateur de choix lui-même seedé) puis rejouée donne le même état final ;
   - choix illégaux refusés (recruter hors offre, 6e perso sans remplacement…) ;
   - fusion, synergies et probabilités de rareté (sur un grand nombre de tirages, à tolérance près) ;
   - état sérialisé, désérialisé, et la partie continue à l'identique.

Hors périmètre : front, simulateur, back, coffres et collection.

Critères de fin :
- `replay(seed, choices)` reproduit exactement l'état final de la partie jouée (testé sur de nombreuses seeds).
- L'état passe par `JSON.stringify` / `JSON.parse` sans perte.
- `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test` et la CI passent.

Commence par me proposer un plan. Ne code rien avant ma validation.
