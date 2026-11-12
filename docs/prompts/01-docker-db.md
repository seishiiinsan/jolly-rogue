# Tâche 1 — Docker, PostgreSQL et schéma canon

Lis `CLAUDE.md` puis `docs/cadrage.md` (sections 8 et 9).

Objectif : poser l'infrastructure locale de la base de données, rien d'autre.

À faire :
1. `docker-compose.yml` avec les services `db`, `adminer` et `pipeline` (profile `tools`) conformes à la section 9.2. Vérifie dans la doc officielle de l'image postgres le chemin de montage du volume pour la version que tu épingles.
2. `.env.example` (le `.gitignore` existe déjà, complète-le si besoin).
3. `packages/db` : schéma Drizzle des tables `canon` de la section 9.5 (+ schémas `raw` et `staging` vides pour l'instant), migrations générées par drizzle-kit.
4. `packages/data-pipeline` : Dockerfile + CLI minimale avec une seule commande `migrate` qui applique les migrations.
5. README racine : prérequis et commandes pour démarrer.

Hors périmètre : collecte de données, parsers, moteur, back.

Critères de fin :
- `docker compose up -d db adminer` puis `docker compose run --rm pipeline migrate` crée toutes les tables sur une base vide.
- Relancer `migrate` ne fait rien et ne plante pas.
- `docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB -c '\dt canon.*'` liste toutes les tables canon.
- `pnpm -r typecheck` passe.

Commence par me proposer un plan. Ne code rien avant ma validation.
