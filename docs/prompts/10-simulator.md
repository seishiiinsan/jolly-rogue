# Tâche 10 — Simulateur d'équilibrage

Lis `CLAUDE.md`, `docs/cadrage.md` (sections 3, 4 et 13) et `docs/regles-j1.md`. Les tâches 1 à 9 sont mergées.

Objectif : un outil sans interface qui joue des milliers de parties avec des bots et mesure l'équilibrage, **avant** d'investir dans le front. Il répond à deux risques du cadrage : « jeu pas assez fun » et « une stratégie domine tout ».

À faire :
1. Package `packages/sim` (CLI), qui utilise uniquement l'API publique du moteur (`createRun`, `applyChoice`).
2. Bots, chacun déterministe à partir de sa propre seed (distincte de celle de la partie) :
   - `random` : choix légaux au hasard ;
   - `rarity` : prend toujours la meilleure rareté ;
   - `synergy` : vise une faction et la complète ;
   - `frontline` : privilégie la ligne avant ;
   - propose-en un ou deux autres si les règles le justifient.
3. Commande, par exemple : `sim --bot synergy --runs 10000 --seed-from 1`. Seeds consécutives, résultats reproductibles.
4. Rapport Markdown (`data/sim/report.md`, régénéré, sans horodatage) :
   - distribution de la vague atteinte par bot (médiane, déciles) ;
   - taux de recrutement et vague moyenne atteinte quand chaque perso est dans l'équipe finale ;
   - même chose par faction et par niveau de synergie atteint ;
   - durée estimée d'une partie : nombre d'événements de combat × durée d'affichage par événement + temps de choix (hypothèses écrites dans le rapport), comparée à la cible de 10 à 15 minutes ;
   - signaux d'alerte : un perso ou une synergie qui écrase les autres, des vagues trop faciles ou infranchissables.
5. Performance : 10 000 parties en moins d'une minute sur un poste de dev, sinon explique pourquoi et propose une piste.
6. Dans Docker : un service ou une commande `docker compose run --rm …` documentée, conforme à `CLAUDE.md`.

Hors périmètre : modifier les règles ou les valeurs de `packages/game-data`. Tu proposes des ajustements chiffrés dans la PR ; je déciderai, puis une PR séparée les appliquera.

Critères de fin :
- Le rapport est généré pour chaque bot, reproductible (deux exécutions = fichier identique).
- Les ajustements d'équilibrage proposés sont listés dans la PR, avec les chiffres qui les justifient.
- `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test` et la CI passent.

Commence par me proposer un plan. Ne code rien avant ma validation.
