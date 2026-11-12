# Tâche 3 — Source One Piece Wiki (Fandom)

Lis `CLAUDE.md` puis `docs/cadrage.md` (section 9.3). Les tâches 1 et 2 sont mergées.

Objectif : collecter les infobox du One Piece Wiki via l'API MediaWiki (`https://onepiece.fandom.com/api.php`) vers `raw` et `staging`.

**Étape d'exploration obligatoire, avant tout code de parser :**
- Récupère le wikitext réel d'une dizaine de pages variées (Luffy, un Marine, un perso mort, un perso sans fruit, un fruit, un équipage).
- Liste-moi les noms de templates d'infobox, leurs paramètres, et les cas tordus (valeurs multiples, primes historiques, références, balises).
- **Arrête-toi là et attends ma validation.**

Ensuite :
1. Listing des pages par catégories, en réutilisant le client HTTP de la tâche 2 (même limite de débit).
2. Parser d'infobox testé sur les fixtures enregistrées.
3. Chargement dans `staging` uniquement : pas encore d'écriture dans `canon`.
4. Licence CC-BY-SA renseignée sur tout texte descriptif stocké.

Hors périmètre : réconciliation avec api-onepiece (tâche 4), images.

Critères de fin : `ingest --source=fandom` remplit `staging`, tests verts, lignes rejetées listées dans le rapport.
