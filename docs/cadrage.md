# Cadrage – Roguelike One Piece

Version du 11 novembre 2026.

## 1. Pitch

Un auto-battler roguelike jouable dans le navigateur, dans l'univers de One Piece. Ton équipage affronte des vagues d'ennemis en combat automatique. Après chaque vague, tu recrutes un pirate parmi trois tirés au sort. Tu vas le plus loin possible, tu compares ton score au classement, et tu complètes ta collection grâce aux coffres de fin de partie.

## 2. Objectifs et contraintes

- **Objectif :** publication avec de vrais joueurs.
- **Plateforme :** web desktop uniquement pour l'instant.
- **Modèle :** fan game non commercial (aucune monétisation, ni pub ni achat).
- **Temps disponible :** non chiffré, hypothèse à confirmer (voir Questions ouvertes).

## 3. Boucle de jeu

1. Début de partie : une équipe de départ (1 ou 2 persos communs).
2. Une vague d'ennemis arrive et le combat se résout automatiquement.
3. Si la vague est gagnée, 3 persos sont proposés et tu en recrutes 1 (ou aucun).
4. Tu ajustes le placement (avant/arrière) et tu remplaces un perso si l'équipe est pleine.
5. Tous les 10 vagues, un boss sert de palier.
6. Défaite : fin de partie, score, coffre selon la profondeur atteinte.

Durée cible d'une partie : **10 à 15 minutes**.

## 4. Règles de partie

| Élément | Règle |
| --- | --- |
| Taille d'équipe | 5 persos max ; recruter un 6e oblige à en remplacer un |
| Recrutement | 1 parmi 3 tirés au sort, pool indépendant de la collection |
| Raretés | 3 niveaux pour la v1 (ex. commun, rare, légendaire) ; les chances de rareté montent avec les vagues |
| Placement | Ligne avant et ligne arrière ; les ennemis tapent d'abord l'avant |
| Synergies | Bonus de faction (ex. 2 persos d'un même équipage = bonus d'attaque) |
| Fusion | Recruter un perso déjà dans l'équipe le fait monter de niveau |
| Progression | Vagues infinies, boss toutes les 10 vagues |
| Combat | Entièrement automatique |

Le joueur décide donc à trois niveaux : qui recruter, où le placer, et quelles synergies construire.

## 5. Méta : collection

- **Séparée du jeu :** la collection ne donne aucun avantage en partie (le classement reste équitable).
- **Coffres :** un coffre en fin de partie, de plus en plus gros et riche en cartes rares selon la profondeur atteinte.
- **Doublons :** convertis en fragments ; X fragments permettent d'obtenir la carte de son choix.
- **Anti-malchance :** une légendaire garantie au bout de N coffres sans en avoir eu.
- **À quoi elle sert :** fiche de lore par perso, cosmétiques (cadres de carte), vitrine sur le profil, succès (ex. compléter un équipage).

## 6. Classement

- **Critère :** vague atteinte, puis PV restants ou temps pour départager.
- **Deux modes :**
  - **Seed du jour :** mêmes vagues et mêmes tirages pour tout le monde ; seul le premier essai donne un coffre.
  - **Partie libre :** seed aléatoire, classement séparé.

## 7. Visuels et cadre juridique

- **Cartes typographiques :** nom, couleur de faction, icônes d'archétype (sabre, poing, tir…). **Aucune image officielle** (ni captures de l'anime, ni scans, ni modèles 3D extraits de jeux).
- **Combat en 2D :** des cartes qui se percutent, des chiffres de dégâts, des effets (secousse, particules). Pas de 3D.
- **Mention claire :** fan game non officiel, non affilié aux ayant-droits, non commercial.
- **Risque assumé :** les ayant-droits peuvent demander le retrait à tout moment.
- **Évolution possible :** passer à des persos originaux dessinés (option B/C) si le jeu prend.

## 8. Architecture (vue d'ensemble)

- **Moteur de jeu déterministe** en TypeScript pur, indépendant de l'affichage : même seed + mêmes choix = même partie. Aucun aléatoire non contrôlé à l'intérieur.
- **Moteur partagé** entre client et serveur (monorepo).
- **Front :** l'affichage rejoue les événements produits par le moteur (HTML/CSS d'abord, PixiJS ensuite).
- **Back :** Node (Fastify) pour réutiliser le moteur côté serveur ; base PostgreSQL (joueurs, parties, collection, classement).
- **Anti-triche :** le client envoie seulement la seed et ses choix ; le serveur rejoue la partie et calcule lui-même le score et la profondeur.
- **Coffres :** contenu tiré côté serveur avec son propre aléatoire, jamais celui de la partie.

## 9. Base de données One Piece (instructions pour l'agent de code)

L'agent construit un pipeline TypeScript qui collecte les données du lore One Piece, les croise et les charge dans PostgreSQL, le tout dans Docker. Ce chantier ne bloque pas J1 : un export partiel (les 15 persos du prototype) suffit pour démarrer.

### 9.1 Principes non négociables

- **Deux couches séparées.** Le schéma `canon` contient les faits du lore et seul le pipeline l'alimente. Les données de jeu (rareté, stats, compétences, tags de synergie) sont saisies à la main et référencent `canon` par slug. Le pipeline n'écrit jamais dans les données de jeu.
- **Le moteur ne lit jamais la base.** Il consomme un export JSON versionné (voir 9.6), condition du déterminisme et du rejeu serveur.
- **Idempotence.** Relancer le pipeline donne le même résultat : upserts par clé source, aucun doublon.
- **Provenance.** Chaque valeur garde sa source, son URL, sa date de collecte et sa licence.
- **Corrections manuelles versionnées.** Alias et corrections vivent dans `overrides/*.yaml`, appliqués en dernier. Jamais d'édition directe en base.
- **Aucun asset.** Aucune image ni média téléchargé. Les textes descriptifs Fandom (CC-BY-SA) sont stockés avec leur licence et ne vont pas dans le jeu sans attribution.
- **Tout dans Docker.** Les services (base, pipeline, plus tard back) tournent dans Docker. Sur l'hôte, seuls Node >= 22 et pnpm, pour l'IDE, le typecheck et les tests unitaires.
- **Stack alignée sur le projet.** TypeScript, Node LTS, Drizzle ORM + drizzle-kit pour le schéma et les migrations (types partagés avec le back Fastify), Zod pour valider les données entrantes, Vitest pour les tests.

### 9.2 Environnement Docker

Arborescence attendue dans le monorepo :

```
docker-compose.yml
.env.example            # commité ; .env ignoré par Git
packages/
  engine/               # moteur de jeu (créé à J1)
  db/                   # schéma Drizzle, migrations, types partagés
  data-pipeline/
    Dockerfile
    src/sources/        # un client par source
    src/parse/          # parsers + schémas Zod
    src/reconcile/      # croisement des sources
    src/export/
    overrides/          # aliases.yaml, corrections.yaml
    fixtures/           # réponses réelles pour les tests
data/
  cache/                # réponses HTTP brutes, ignoré par Git
  exports/              # JSON pour le moteur, commité
```

| Service | Image | Rôle | Port hôte |
| --- | --- | --- | --- |
| `db` | `postgres` (version majeure épinglée, alpine) | Base PostgreSQL | 127.0.0.1:5432 |
| `adminer` | `adminer` | Consulter la base | 127.0.0.1:8080 |
| `pipeline` | build `packages/data-pipeline` (Node LTS alpine) | Ingestion, lancé à la demande (profile `tools`) | aucun |

- Volume nommé `pgdata` pour la base. Vérifier le chemin de montage dans la doc de l'image : il a changé avec PostgreSQL 18.
- Healthcheck `pg_isready` sur `db` ; `pipeline` démarre avec `depends_on: condition: service_healthy`.
- Identifiants uniquement via `.env`. Ports liés à 127.0.0.1, jamais exposés sur le réseau.
- `./data/cache` et `./data/exports` montés en bind dans `pipeline`.

Commandes à fournir (et documenter dans le README du package) :

```bash
docker compose up -d db adminer
docker compose run --rm pipeline migrate
docker compose run --rm pipeline ingest --source=api-onepiece
docker compose run --rm pipeline ingest --source=fandom
docker compose run --rm pipeline reconcile
docker compose run --rm pipeline export
docker compose run --rm pipeline report
docker compose run --rm pipeline all
docker compose down -v
```

`all` enchaîne toutes les étapes ; `down -v` remet tout à zéro.

### 9.3 Sources et règles de collecte

| Priorité | Source | Usage | Accès |
| --- | --- | --- | --- |
| 1 | api-onepiece.com (v2) | Référentiel de base : persos, équipages, fruits, sagas, arcs, lieux ; noms FR et EN | `https://api.api-onepiece.com/v2/{ressource}/{fr\|en}` |
| 2 | One Piece Wiki (Fandom), API MediaWiki | Enrichissement : affiliations, primes, statut, fruit, débuts, taille, âge, nom japonais | `https://onepiece.fandom.com/api.php` (`action=query`, `action=parse&prop=wikitext`) |
| 3 (optionnel) | Dump Fandom sur Hugging Face (`nyuuzyou/fandom`, fév. 2025) | Amorce hors ligne pour limiter les appels à l'API Fandom | Téléchargement unique, filtré sur le wiki One Piece |

- **Un seul client HTTP** pour toutes les sources : cache disque (clé = URL), 1 requête/s max par domaine, User-Agent explicite avec un contact, retry exponentiel sur 429 et 5xx, timeout.
- **Mode `--offline`** qui ne lit que le cache (dev et tests).
- **Réponse brute d'abord** : chaque réponse est stockée telle quelle dans `raw` avant tout parsing, pour pouvoir re-parser sans re-télécharger.
- **Fandom** : lister les pages via les catégories (persos canon, fruits, équipages), puis parser les infobox du wikitext. L'agent inspecte d'abord le wikitext réel de quelques pages pour relever les noms de templates et de paramètres. Il ne suppose rien.
- **Pas de scraping HTML** tant qu'une API fournit la donnée.
- **Hors périmètre** : images, textes de chapitres, données de l'anime filler.

### 9.4 Étapes du pipeline

1. **migrate** : applique les migrations Drizzle (schémas `raw`, `staging`, `canon`).
2. **fetch** : collecte vers `raw.responses` (source, url, statut HTTP, body, hash, fetched_at). Un hash identique à la dernière collecte = rien à retraiter.
3. **parse** : `raw` vers `staging.*`, une table par source, chaque ligne validée par Zod. Une ligne invalide est rejetée et listée dans le rapport, elle ne bloque pas le lot.
4. **reconcile** : `staging` vers `canon`. Ordre de rapprochement :
   1. ID déjà connu (table de correspondance par source) ;
   2. nom romanisé normalisé (minuscules, sans accents ni ponctuation) ;
   3. `overrides/aliases.yaml`.

   Aucune fusion automatique en fuzzy : les candidats approchants vont dans le rapport pour validation humaine.
5. **Priorité par champ**, définie dans un fichier de config unique. Exemple : noms FR depuis api-onepiece ; primes, affiliations et statut depuis Fandom (plus à jour). Un conflit entre sources est tracé dans le rapport.
6. **overrides** : `overrides/corrections.yaml` appliqué en dernier.
7. **export** : génère les fichiers pour le moteur (9.6).
8. **report** : génère `data/exports/report.md` (voir 9.7).

### 9.5 Schéma de la base canon

| Table | Colonnes clés | Rôle |
| --- | --- | --- |
| `characters` | id, slug, name_en, name_fr, name_jp, epithet, status (alive, deceased, unknown), age, height_cm, origin_location_id, debut_chapter | Persos ; le slug est la clé utilisée par le jeu |
| `character_aliases` | character_id, alias, kind | Rapprochement des noms |
| `crews` | id, slug, name_en, name_fr, kind (pirate, marine, government, revolutionary, other), captain_id, is_yonko | Factions des synergies |
| `character_affiliations` | character_id, crew_id, role, is_current | Appartenances passées et actuelles |
| `devil_fruits` | id, slug, name_romaji, name_en, name_fr, type (paramecia, zoan, logia), subtype | Fruits du démon |
| `character_fruits` | character_id, fruit_id, is_current | Porteurs |
| `bounties` | character_id, amount_berry (bigint), as_of_chapter, is_current | Historique des primes |
| `haki` | character_id, kind (observation, armament, conqueror) | Haki connus |
| `locations` | id, slug, name_en, name_fr, sea, kind | Mers et îles |
| `sagas`, `arcs` | id, slug, name_en, name_fr, saga_id, chapter_start, chapter_end, sort_order | Biomes ou paliers possibles |
| `provenance` | entity, entity_id, field, source, source_url, fetched_at, license | Traçabilité champ par champ |

Conventions : snake_case, enums PostgreSQL pour les listes fermées, clés étrangères et `UNIQUE` sur chaque slug, `bigint` pour les primes, `created_at` et `updated_at` partout. Un slug publié n'est jamais renommé ni réutilisé (la collection des joueurs en dépend).

### 9.6 Export vers le moteur de jeu

- `pipeline export` écrit `data/exports/canon.json`, avec une version de schéma et un tri stable (diffs Git lisibles).
- Les types TypeScript et schémas Zod de l'export vivent dans `packages/db` et sont importés par le moteur et le back.
- Les données de jeu (`game/characters.yaml` : slug canon, rareté, stats, compétences, tags de synergie) restent écrites à la main. Un script les valide contre l'export : un slug absent du canon fait échouer la CI.
- Le moteur importe ces fichiers au build. Aucune requête en base pendant une partie.

### 9.7 Qualité, tests et définition de fini

- **Tests unitaires** (Vitest) des parsers sur des fixtures réelles enregistrées depuis le cache.
- **Tests d'intégration** du pipeline complet en `--offline` contre une base Docker jetable.
- **Rapport** à chaque exécution : compte par table, entités non rapprochées, candidats fuzzy, conflits entre sources, lignes rejetées par Zod, champs obligatoires manquants.

Le chantier est fini quand :

- [ ] Sur une machine vierge avec Docker, `docker compose up -d db` puis `pipeline all` reconstruit tout depuis zéro.
- [ ] Deux exécutions de suite ne changent aucune ligne (idempotence testée).
- [ ] L'équipage du Chapeau de paille est complet et cohérent : 10 membres, fruits et primes actuelles.
- [ ] Toute entité non rapprochée apparaît dans le rapport.
- [ ] Le README du package décrit commandes, sources, licences et procédure d'ajout d'un override.

## 10. Exigences liées à la publication

- Comptes joueurs (authentification) pour le classement et la collection.
- RGPD : mentions légales, politique de confidentialité, suppression de compte.
- Modération des pseudos (filtre et signalement).
- Hébergement, sauvegardes de la base, monitoring des erreurs.
- Limitation de débit (rate limiting) sur l'envoi des parties.

## 11. Périmètre par jalons

| Jalon | Contenu | Résultat |
| --- | --- | --- |
| J1 – Prototype local | Moteur, 10 vagues, 15 persos, 3 raretés, placement, synergies, fusion ; pas de compte | Le jeu est-il fun ? |
| J2 – Compétition | Seed du jour, envoi de la partie, vérification serveur, classement | Scores fiables |
| J3 – Méta | Comptes, coffres, collection, fragments, anti-malchance | Raison de revenir |
| J4 – Bêta publique | Polish, RGPD, modération, monitoring, contenu élargi | Ouverture à de vrais joueurs |

Règle : **on ne passe pas au jalon suivant tant que J1 n'est pas fun.**

## 12. Hors périmètre (pour l'instant)

Mobile, multijoueur temps réel, 3D, monétisation, images officielles, persos originaux dessinés.

## 13. Risques

| Risque | Impact | Parade |
| --- | --- | --- |
| Retrait demandé par les ayant-droits | Fermeture du jeu | Aucune image officielle, non commercial, mention fan game ; option B/C prête |
| Jeu pas assez fun | Projet abandonné | Valider J1 avec des testeurs avant toute la partie serveur |
| Équilibrage | Une stratégie domine tout | Données de parties (stats des choix) et ajustements réguliers |
| Volume de contenu | Collection trop vite vide | Catalogue de persos sous forme de données, facile à étendre |
| Triche | Classement discrédité | Rejeu serveur, coffres côté serveur |
| Scope qui explose | Projet jamais publié | Jalons stricts, hors-périmètre respecté |

## 14. Questions ouvertes

- Temps réel par semaine à consacrer au projet (chiffré).
- Taille du catalogue de persos pour la bêta.
- ~~Liste des factions et leurs bonus de synergie.~~ Tranché pour J1 (proposition à relire) : [regles-j1.md §8](regles-j1.md#8-synergies).
- ~~Statistiques et compétences des persos (format de données).~~ Tranché pour J1 (proposition à relire) : [regles-j1.md §2, §3, §9 et §14](regles-j1.md#14-format-des-données).
- Hébergement et budget mensuel.
- Nom du jeu.
