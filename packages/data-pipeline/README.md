# @jolly-rogue/data-pipeline

CLI qui construit la base `canon` (faits du lore One Piece) à partir de deux sources, puis l'export
consommé par le moteur de jeu (`data/exports/canon.json`). Cadrage : [`docs/cadrage.md`](../../docs/cadrage.md) §9.

```
fetch ──► raw.responses ──► parse (Zod) ──► staging.api_onepiece ─┐
                                        └─► staging.fandom ───────┴─► reconcile ──► canon ──► export / report
```

## Commandes

Toutes les commandes tournent dans Docker (service `pipeline`, profil `tools`). La base doit être démarrée.

```bash
docker compose up -d db
```

Tout reconstruire, depuis une base vide ou existante :

```bash
docker compose run --rm pipeline all
```

| Commande | Rôle |
| --- | --- |
| `all` | `migrate` → `ingest` (toutes les sources) → `reconcile` → `export` → `report` |
| `migrate` | Applique les migrations Drizzle (schémas `raw`, `staging`, `canon`) |
| `ingest --source=api-onepiece` | Collecte api-onepiece.com (FR + EN) → `raw` → `staging.api_onepiece` |
| `ingest --source=fandom` | Collecte les infobox du One Piece Wiki → `raw` → `staging.fandom` |
| `reconcile` | `staging` → `canon` : rapprochement, priorité des sources, overrides (une transaction) |
| `export` | Écrit `data/exports/canon.json` (tri stable, aucun horodatage) |
| `report` | Écrit `data/exports/report.md` |

Options de `ingest` et `all` :

- `--offline` : lit uniquement le cache disque `data/cache` (aucune requête réseau, échoue sur un manque) ;
- `--refresh` : ignore le cache en lecture et re-télécharge.

Exemple, tout reconstruire sans réseau une fois le cache rempli :

```bash
docker compose run --rm pipeline all --offline
```

Idempotence : relancer `all` sur des données inchangées ne modifie **aucune** ligne (testé). Un slug, une fois
publié, n'est jamais renommé ni réutilisé : il est retrouvé à chaque exécution via `canon.external_ids`.

## Sources et licences

| Source | Données | Licence |
| --- | --- | --- |
| [api-onepiece.com](https://api.api-onepiece.com) | Persos, équipages, fruits, lieux, sagas, arcs ; **noms FR** | Aucune déclarée (`provenance.license` vide, signalé dans le rapport) |
| [One Piece Wiki](https://onepiece.fandom.com) (Fandom) | Infobox des persos, équipages et fruits | **CC-BY-SA** ([détail](https://www.fandom.com/licensing)) |

- Collecte respectueuse : un seul client HTTP, cache disque, 1 requête/s max par domaine, User-Agent explicite
  (`PIPELINE_USER_AGENT`), retry sur 429/5xx. Premier `all` : ~385 requêtes (~7 min), aucune ensuite.
- Aucune image ni prose n'est stockée : uniquement les valeurs des infobox. Chaque ligne de `staging.fandom` porte
  sa licence et le permalien de la révision lue ; `canon.provenance` dit, champ par champ, quelle source (et quelle
  URL, à quelle date) a fourni la valeur retenue, avec sa licence.
- Détail des règles de lecture Fandom (non-canon écarté, âges, primes…) : [README racine](../../README.md#source-fandom-one-piece-wiki).

## Réconciliation

### Rapprochement

Pour les personnages, équipages et fruits, chaque page Fandom est rapprochée d'une entité api-onepiece dans cet ordre :

1. **alias** de `overrides/aliases.yaml` (décision humaine : passe avant tout, y compris un rapprochement déjà enregistré) ;
2. **id déjà connu** : la page a déjà été rapprochée ou créée (`canon.external_ids`) ;
3. **nom normalisé** (minuscules, sans accents ni ponctuation), d'abord le titre exact de la page, puis tous ses noms
   (romanisé, anglais). Le rapprochement n'a lieu que s'il est univoque dans les deux sens.

Il n'y a **aucune fusion fuzzy**. Une page qui ressemble à une entité api-onepiece non rapprochée (nom proche, ou même
fruit du démon) reste **en attente** : elle n'est pas créée, et elle est listée dans le rapport avec ses candidats.
Une page sans aucun candidat est créée seule. Les clones de fruits d'api-onepiece sont exclus du rapprochement
automatique (ils portent le même nom que l'original).

### Priorité des sources

Un fichier unique, [`config/field-priority.yaml`](config/field-priority.yaml), donne pour chaque champ l'ordre des
sources. La première qui a une valeur l'emporte (`unknown` et une relation vide comptent comme « pas de valeur »).
Deux valeurs différentes sont un **conflit**, listé dans le rapport (les textes sont comparés après normalisation).
En résumé : noms FR depuis api-onepiece ; statut, âge, taille, primes, affiliations, fruits, haki et capitaines
depuis Fandom (plus à jour), avec api-onepiece en repli.

### Overrides

Les corrections manuelles vivent uniquement dans [`overrides/`](overrides), validées par Zod au démarrage de
`reconcile` : un fichier invalide (champ inconnu, slug ou page introuvable) fait **échouer** la commande. Dans Docker,
le dossier est monté en lecture seule : pas besoin de reconstruire l'image après une modification.

#### Rapprocher deux entités, ou en séparer deux confondues

1. Dans `data/exports/report.md`, repérer la page Fandom (sections « en attente » ou « Candidats fuzzy »), puis l'id
   api-onepiece (section « api-onepiece sans page Fandom »).
2. Ajouter une entrée dans `overrides/aliases.yaml`, sous `characters`, `crews` ou `devil_fruits` :

   ```yaml
   characters:
     - fandom: Marshall D. Teach   # titre exact de la page Fandom
       api-onepiece: "247"         # id api-onepiece, ou null : « aucun équivalent »
       note: nom api « Marchall D. Teach / Barbe Noire »
   ```

   `api-onepiece: null` sert à empêcher un rapprochement par nom erroné (homonymes) : la page est créée seule.
3. Relancer :

   ```bash
   docker compose run --rm pipeline all --offline
   ```

Un alias ajouté **après** la création de deux entités ne supprime rien : l'entité api-onepiece garde son slug, et
l'autre apparaît dans « Entités canon sans source » (slug publié, à traiter à la main).

#### Corriger une valeur

Ajouter une entrée dans `overrides/corrections.yaml`. Elle s'applique en dernier, quelle que soit la source retenue,
et clôt le conflit éventuel sur ce champ. La provenance devient `override`.

```yaml
- entity: characters        # locations | sagas | arcs | devil_fruits | crews | characters
  slug: monkey-d-luffy      # slug canon (data/exports/canon.json)
  field: age                # colonne scalaire en snake_case
  value: 19
  reason: "pourquoi la source a tort"
  date: 2026-11-12          # date de la correction (sert de fetched_at dans la provenance)
```

Pour une affiliation (personnages) : `field: affiliations` et `value: { crew: <slug>, is_current: true|false }`.

## Rapport

`data/exports/report.md`, régénéré à chaque `report` (et à la fin de `all`), sans horodatage :

- sources et licences, comptes par table, lignes rejetées par Zod ;
- anomalies de chargement api-onepiece (traductions manquantes, équipages de type `other`…) ;
- rapprochement : résumé, **toutes** les entités non rapprochées (en attente, api-onepiece seule, Fandom seule),
  candidats fuzzy ;
- conflits entre sources par champ, références Fandom non résolues, anomalies de réconciliation, corrections appliquées ;
- contrôle de l'équipage du Chapeau de paille (10 membres, fruits et primes actuels) ;
- entités canon sans source, slugs suffixés après collision, complétude (valeurs manquantes).

## Développement

Sur l'hôte (Node >= 22), avec la base Docker démarrée :

```bash
pnpm --filter @jolly-rogue/data-pipeline typecheck
```

```bash
TEST_DATABASE_URL=postgres://jolly:change-me@127.0.0.1:5432/jolly_rogue pnpm --filter @jolly-rogue/data-pipeline test
```

- Tests unitaires : parsers (fixtures réelles), rapprochement, modèle de réconciliation, fichiers de config.
- Test d'intégration : pipeline complet en `--offline` (cache pré-rempli avec les fixtures) contre une base jetable,
  deux exécutions de suite sans aucune écriture. Les overrides de test sont dans `test/overrides/`.
- Fixtures : `fixtures/` (api-onepiece, et Fandom sous CC-BY-SA avec ses révisions), régénérables depuis le cache
  (voir le [README racine](../../README.md#développement-sur-lhôte)).

Après un changement de code, reconstruire l'image :

```bash
docker compose build pipeline
```

| Chemin | Rôle |
| --- | --- |
| `src/sources`, `src/parse`, `src/staging` | Collecte, parsing Zod, écriture dans `staging` |
| `src/load/plan.ts` | Lecture d'api-onepiece (paires FR/EN, anomalies) |
| `src/reconcile/` | Rapprochement (`match.ts`), modèle pur (`model.ts`), application en base (`apply.ts`), config (`config.ts`) |
| `src/export`, `src/report` | `canon.json` et `report.md` |
| `config/field-priority.yaml` | Priorité des sources par champ |
| `overrides/` | Alias et corrections manuelles |
