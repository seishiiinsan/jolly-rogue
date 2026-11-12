# Tâche 5 — Lint et intégration continue

Lis `CLAUDE.md` puis `docs/cadrage.md` (sections 8 et 9.7). Les tâches 1 à 4 sont mergées.

Objectif : rendre réelles les vérifications que `CLAUDE.md` exige avant chaque PR. Aujourd'hui `pnpm -r lint` ne fait rien (aucun package n'a de script `lint`) et le dépôt n'a pas de CI.

À faire :
1. Un linter pour tout le monorepo : ESLint (flat config + typescript-eslint, règles « type-aware ») ou Biome. Compare les deux en trois lignes dans ton plan et choisis ; justifie chaque dépendance ajoutée.
2. Règles minimales :
   - `any` explicite interdit (une exception doit porter un commentaire qui la justifie) ;
   - promesses non gérées interdites ;
   - pour `packages/engine/**` (le package n'existe pas encore, la règle doit déjà être en place) : `Math.random`, `Date`, `Date.now`, `performance`, `setTimeout`, `setInterval`, `fetch`, `process`, `window` et `document` interdits.
3. Un script `lint` dans chaque package existant ; `pnpm -r lint` passe sur le code actuel. Corrige le code plutôt que d'assouplir une règle ; si une règle génère trop de bruit, montre-le-moi avant de la désactiver.
4. Formatage : vérifie ce qui est déjà en place. Si rien, propose un formateur (le linter choisi peut suffire), sans reformater tout le dépôt dans le même commit que le reste.
5. GitHub Actions (`.github/workflows/ci.yml`), sur push et PR vers `main` :
   - Node 22, pnpm via `packageManager`, cache du store pnpm ;
   - `pnpm install --frozen-lockfile`, puis `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test` ;
   - un service PostgreSQL (même version majeure que `docker-compose.yml`) et `TEST_DATABASE_URL` pour que les tests d'intégration tournent vraiment au lieu d'être ignorés ;
   - `cp .env.example .env` puis `docker compose config` ;
   - aucun secret nécessaire.
6. README racine : section « Vérifications » qui liste les commandes.

Hors périmètre : moteur, données de jeu, déploiement, release.

Critères de fin :
- `pnpm -r lint` vérifie réellement chaque package et passe.
- Un `Math.random()` ajouté dans un fichier de `packages/engine/` fait échouer le lint (montre-le dans un test ou dans la PR).
- La CI est verte sur la branche, et les tests d'intégration y sont exécutés, pas ignorés (vérifie-le dans le log).
- `docker compose config` passe.

Commence par me proposer un plan. Ne code rien avant ma validation.
