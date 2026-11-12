# Tâche 4 — Réconciliation, overrides, export et rapport final

Lis `CLAUDE.md` puis `docs/cadrage.md` (sections 9.4 à 9.7). Les tâches 1 à 3 sont mergées.

Objectif : croiser api-onepiece et Fandom dans `canon`.

À faire :
1. Réconciliation dans l'ordre de la section 9.4 : ID connu, nom romanisé normalisé, puis `overrides/aliases.yaml`. Aucune fusion fuzzy automatique : les candidats vont dans le rapport.
2. Priorité des sources par champ dans un fichier de config unique.
3. Application de `overrides/corrections.yaml` en dernier.
4. Commande `all` qui enchaîne migrate → ingest (toutes sources) → reconcile → export → report.
5. Rapport complet (section 9.7) : comptes, non-rapprochés, candidats fuzzy, conflits entre sources, lignes rejetées.
6. README de `packages/data-pipeline` : commandes, sources, licences, ajout d'un override.

Critères de fin : la checklist « Le chantier est fini quand » de la section 9.7 est entièrement cochée. Montre-moi le rapport final.

Commence par me proposer un plan. Ne code rien avant ma validation.
