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
| `docs/` | Cadrage et tâches |
