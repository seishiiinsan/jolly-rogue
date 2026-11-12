# Tâche 2 — Client HTTP et source api-onepiece.com

Lis `CLAUDE.md` puis `docs/cadrage.md` (sections 9.3, 9.4 et 9.6). La tâche 1 est mergée.

Objectif : remplir `canon` avec les données d'api-onepiece.com (FR + EN) et produire un premier export.

À faire :
1. Client HTTP unique : cache disque dans `data/cache` (clé = URL), 1 requête/s max par domaine, User-Agent explicite, retry exponentiel sur 429/5xx, timeout, mode `--offline`.
2. Avant de coder les parsers, appelle réellement l'API (`https://api.api-onepiece.com/v2/...`), enregistre quelques réponses comme fixtures et montre-moi leur structure.
3. Étapes `fetch` → `raw.responses`, `parse` → `staging` (validation Zod), puis chargement dans `canon` (upserts, slugs stables, table `provenance` remplie).
4. Commandes `ingest --source=api-onepiece`, `export` (écrit `data/exports/canon.json`, tri stable) et `report` (`data/exports/report.md`).
5. Tests Vitest des parsers sur les fixtures + test d'idempotence en `--offline`.

Hors périmètre : Fandom, réconciliation multi-sources, données de jeu.

Critères de fin :
- `ingest`, `export` et `report` fonctionnent via `docker compose run --rm pipeline ...`.
- Deux `ingest` de suite ne modifient aucune ligne.
- `canon.json` contient l'équipage du Chapeau de paille avec ses fruits.
- Tests verts.

Commence par me proposer un plan. Ne code rien avant ma validation.
