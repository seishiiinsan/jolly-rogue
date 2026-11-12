# Jolly Rogue

Fan game non officiel et non commercial : auto-battler roguelike web dans l'univers One Piece.
Non affilié aux ayants droit. Cadrage complet : [`docs/cadrage.md`](docs/cadrage.md).

## Prérequis

- **Docker** avec Compose v2 (base de données, pipeline).
- **Node >= 22** et **pnpm 10** sur l'hôte, uniquement pour l'IDE, le typecheck et les tests.

## Démarrer

```bash
cp .env.example .env
```

```bash
docker compose up -d db adminer
```

```bash
docker compose run --rm pipeline migrate
```

- PostgreSQL : `127.0.0.1:5432` (identifiants dans `.env`).
- Adminer : <http://127.0.0.1:8080> (serveur `db`).
- Vérifier les tables :

```bash
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt canon.*"'
```

## Pipeline de données

Collecte api-onepiece.com (FR + EN) → `raw.responses` → `staging.api_onepiece` (validé par Zod) → `canon` :

```bash
docker compose run --rm pipeline ingest --source=api-onepiece
```

```bash
docker compose run --rm pipeline export
```

```bash
docker compose run --rm pipeline report
```

- `export` écrit `data/exports/canon.json` (tri stable, aucun horodatage) ; `report` écrit `data/exports/report.md`
  (comptes, lignes rejetées, anomalies, slugs suffixés, complétude).
- Client HTTP : cache disque `data/cache` (clé = URL), 1 requête/s par domaine, retry sur 429/5xx.
  `--offline` lit uniquement le cache, `--refresh` re-télécharge. Relancer `ingest` ne modifie aucune ligne
  si les données n'ont pas changé.
- Le conteneur écrit dans `./data` avec l'uid `PIPELINE_UID:PIPELINE_GID` (défaut `1000:1000`) :
  renseigne `id -u` / `id -g` dans `.env` si ton utilisateur a un autre uid.
- Licence d'api-onepiece.com : aucune déclarée (`provenance.license` vide, signalé dans le rapport).

Tout remettre à zéro (supprime le volume de la base) :

```bash
docker compose down -v
```

## Développement sur l'hôte

```bash
pnpm install
```

```bash
pnpm -r typecheck
```

Tests (le test d'intégration crée puis supprime sa propre base ; il est ignoré sans `TEST_DATABASE_URL`) :

```bash
TEST_DATABASE_URL=postgres://jolly:change-me@127.0.0.1:5432/jolly_rogue pnpm -r test
```

Régénérer les fixtures de test depuis le cache HTTP (aucune requête réseau) :

```bash
pnpm --filter @jolly-rogue/data-pipeline build && node packages/data-pipeline/dist/scripts/record-fixtures.js
```

Modifier le schéma (`packages/db/src/schema/`) puis générer la migration (aucune base nécessaire) :

```bash
pnpm --filter @jolly-rogue/db db:generate --name <nom>
```

Après un changement de code de la pipeline, reconstruire l'image :

```bash
docker compose build pipeline
```

## Structure

| Chemin | Rôle |
| --- | --- |
| `packages/db` | Schéma Drizzle (`raw`, `staging`, `canon`), migrations, client partagé |
| `packages/data-pipeline` | CLI d'ingestion (image Docker `pipeline`) |
| `data/exports` | Exports JSON consommés par le moteur (commités) |
| `data/cache` | Cache HTTP brut (ignoré par Git) |
| `packages/data-pipeline/fixtures` | Extraits réels des réponses API pour les tests |
| `docs/` | Cadrage et tâches |
