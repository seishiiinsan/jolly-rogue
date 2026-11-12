# Tâche 7 — Données de jeu et validation contre le canon

Lis `CLAUDE.md`, `docs/cadrage.md` (sections 4, 9.6 et 13) et **`docs/regles-j1.md`** (référence de cette tâche). Les tâches 1 à 6 sont mergées.

Objectif : écrire les données de jeu de J1 à la main, les valider, et les rendre consommables par le moteur sans aucune base ni YAML à l'exécution.

À faire :
1. Package `packages/game-data` :
   - fichiers YAML écrits à la main (persos, compétences, ennemis, vagues, synergies) au format de `docs/regles-j1.md` §14, dans `packages/game-data/game/` ;
   - schémas Zod et types TypeScript exportés ;
   - un script `build` qui valide tout et écrit `data/exports/game.json` (version de schéma, tri stable, aucun horodatage), que le moteur importera.
2. Validation (`validate`, lancée aussi par `build` et par les tests) :
   - chaque fichier respecte son schéma Zod ;
   - **chaque slug de perso et de faction existe dans `data/exports/canon.json`** (types de l'export importés depuis `packages/db`) ;
   - références internes cohérentes : une compétence, une faction, un ennemi référencé existe ; pas de doublon ; budgets de stats par rareté respectés si le document en fixe ;
   - messages d'erreur qui disent quel fichier, quelle entrée et quoi corriger.
3. Les données de jeu ne recopient aucun fait du lore : nom, équipage, fruit viennent de `canon.json` par le slug. Les noms affichés sont résolus depuis l'export.
4. CI : la validation tourne dans le workflow existant ; un slug absent du canon fait échouer la CI.
5. README du package : format des fichiers et procédure pour ajouter un perso.

Hors périmètre : moteur, front, équilibrage (les valeurs sont celles de `docs/regles-j1.md`).

Critères de fin :
- Les 15 persos de `docs/regles-j1.md` sont présents et valides.
- Un test montre qu'un slug inexistant fait échouer la validation avec un message clair.
- `data/exports/game.json` est généré, stable (deux builds = fichier identique) et commité.
- `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test` et la CI passent.

Commence par me proposer un plan. Ne code rien avant ma validation.
