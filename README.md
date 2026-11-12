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

### Source Fandom (One Piece Wiki)

Collecte des infobox du [One Piece Wiki](https://onepiece.fandom.com) via l'API MediaWiki → `raw.responses` →
`staging.fandom` (validé par Zod). **Aucune écriture dans `canon`** à ce stade (rapprochement : tâche 4).

```bash
docker compose run --rm pipeline ingest --source=fandom
```

- Listing : pages de l'espace principal qui transcluent `Template:Char Box`, `Devil Fruit Box` ou `Crew Box`
  (`list=embeddedin`), sans les sous-pages d'onglets (`…/Gallery`).
- Non canon : une page est écartée si elle est dans un arbre `Category:Non-Canon Characters`, `Non-Canon Devil Fruits`
  ou `Non-Canon Pirate Crews` **et** que son infobox n'a aucun chapitre de début. L'arbre seul exclurait des persos
  canon apparus dans un film (Zoro est dans « Non-Canon First Mates ») ; le chapitre seul exclurait le canon hors
  manga (Vivre Card, SBS).
- Wikitext lu par lots de 50 titres (`prop=revisions`), avec les catégories Haki. Pour les persos et équipages
  majeurs, l'infobox est dans `Template:<Nom> Tabs Top`, récupéré dans une seconde passe.
- Environ 370 requêtes au premier lancement (1 requête/s, ~7 min), aucune ensuite grâce au cache.
- Une page sans infobox lisible ou avec une valeur au format inconnu est rejetée (`staging.rejections`,
  listée dans le rapport) sans bloquer le lot.
- Règles de lecture : âge et taille = **plus grande valeur** de la liste du wiki (l'ordre n'y est pas toujours chronologique) ; prime actuelle = non barrée
  (toutes barrées : aucune prime actuelle) ; « At least X » → `isMinimum` ; grade Marine en étoiles seul → montant `null`.
- **Licence** : textes du wiki sous `CC-BY-SA` (déclarée par l'API, détail sur <https://www.fandom.com/licensing>).
  Chaque ligne de `staging.fandom` porte `license` et `source_url` (permalien de la révision lue). Aucune prose
  (intro, histoire) ni image n'est stockée : uniquement les infobox.

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

Fixtures Fandom (réponses réelles de l'API pour une quinzaine de pages ; passe par le cache, `--offline` possible) :

```bash
pnpm --filter @jolly-rogue/data-pipeline build && node packages/data-pipeline/dist/scripts/record-fixtures-fandom.js
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
