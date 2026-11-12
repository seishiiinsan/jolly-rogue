# Jolly Rogue — instructions pour l'agent de code

Fan game non commercial : auto-battler roguelike web dans l'univers One Piece.
Le cadrage complet est dans `docs/cadrage.md`. **Lis-le avant toute tâche**, en particulier la section 9 (base de données).
Les tâches à exécuter sont décrites une par une dans `docs/prompts/`.

## Règles de travail
- Une tâche = une session = une branche = une PR. Ne déborde jamais du périmètre de la tâche demandée.
- Commence toujours par un plan (fichiers créés ou modifiés, choix techniques) et attends ma validation avant de coder.
- Si une info manque ou qu'un choix n'est pas tranché dans le cadrage : pose la question, n'invente pas.
- Petits commits lisibles, messages en anglais au format Conventional Commits (`feat:`, `fix:`, `chore:`…).
- Pas de dépendance ajoutée sans la justifier dans le plan.

## Stack
- Monorepo **pnpm workspaces** : `packages/engine`, `packages/db`, `packages/data-pipeline` (d'autres viendront).
- TypeScript strict partout (`"strict": true`, pas de `any` non justifié).
- Node : version LTS épinglée dans les Dockerfile (image node). Sur l'hôte et en session cloud, Node >= 22 suffit (typecheck, lint, tests).
- PostgreSQL + **Drizzle ORM / drizzle-kit** (schéma et migrations dans `packages/db`).
- **Zod** pour valider toute donnée entrante, **Vitest** pour les tests.
- Back prévu plus tard : Fastify. Front prévu plus tard : HTML/CSS puis PixiJS.

## Docker
- Les services (base, pipeline, plus tard back) tournent dans Docker (Compose v2).
- Services : `db` (postgres, version majeure épinglée), `adminer`, `pipeline` (profile `tools`).
- Ports liés à `127.0.0.1` uniquement. Identifiants via `.env` (jamais commité) ; `.env.example` commité.
- Healthcheck `pg_isready` sur `db`, `depends_on: condition: service_healthy` pour les services qui en dépendent.
- Toute commande documentée doit fonctionner via `docker compose run --rm <service> <commande>`.
- En session cloud : si `.env` est absent, `cp .env.example .env`. Si le daemon Docker ne tourne pas, démarre-le avant `docker compose`. Pas d'accès navigateur : vérifie la base avec `docker compose exec db psql`.

## Données One Piece
- Schéma `canon` = faits du lore, alimenté uniquement par le pipeline. Les données de jeu (stats, raretés, compétences) sont séparées et écrites à la main.
- Le moteur de jeu ne lit jamais la base : il consomme `data/exports/canon.json`.
- Collecte respectueuse : un seul client HTTP, cache disque, 1 requête/s max par domaine, User-Agent explicite, retry sur 429/5xx, mode `--offline`.
- **Aucune image ni asset officiel** téléchargé ou commité. Textes Fandom = CC-BY-SA, stockés avec leur licence.
- Corrections manuelles uniquement dans `packages/data-pipeline/overrides/*.yaml`.

## Moteur de jeu
- Déterministe : même seed + mêmes choix = même partie. Aucun `Math.random()`, aucun `Date.now()` dans le moteur : RNG seedé injecté.
- Le moteur ne dépend d'aucun DOM, réseau ou base.

## Vérifications avant chaque PR
- `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test`
- `docker compose config` (le compose est valide)
