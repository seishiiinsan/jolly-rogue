# @jolly-rogue/sim

Simulateur d'équilibrage sans interface : des bots jouent des milliers de parties via l'API publique
du moteur (`createRun`, `applyChoice`) et le résultat est résumé dans `data/sim/report.md`.

## Commandes

Sur l'hôte (la première fois, ou après un changement de code) :

```bash
pnpm -r build
```

```bash
pnpm --filter @jolly-rogue/sim start --runs 10000 --seed-from 1
```

Un seul bot :

```bash
pnpm --filter @jolly-rogue/sim start --bot synergy --runs 10000 --seed-from 1
```

Dans Docker :

```bash
docker compose run --rm sim --runs 10000 --seed-from 1
```

| Option | Défaut | Rôle |
| --- | --- | --- |
| `--bot` | `all` | `random`, `rarity`, `fusion`, `synergy`, `frontline`, `lookahead` ou `all` |
| `--runs` | `10000` | Parties par bot |
| `--seed-from` | `1` | Première seed ; les suivantes sont consécutives |
| `--out` | `data/sim/report.md` | Fichier du rapport |

Les résultats sont reproductibles : mêmes options = même fichier, octet pour octet (aucun horodatage).
Le rapport commité est celui de `--bot all --runs 10000 --seed-from 1`.

## Bots

Chaque bot est déterministe à partir de sa propre seed, dérivée de celle de la partie mais distincte
(`seed XOR 0x5bd1e995`), pour ne jamais partager le RNG du moteur.

| Bot | Stratégie |
| --- | --- |
| `random` | Choix légaux au hasard |
| `rarity` | Meilleure rareté, placement par défaut |
| `fusion` | Fusionne dès que possible, sinon meilleure rareté |
| `synergy` | Complète la faction la plus représentée de son équipe |
| `frontline` | Persos de mêlée et ligne avant d'abord |
| `lookahead` | Simule la vague suivante pour chaque recrue possible et garde la meilleure issue (proxy d'un joueur appliqué) |

## Rapport

- distribution des vagues gagnées par bot (moyenne, déciles) ;
- durée estimée d'une partie, hypothèses écrites dans le rapport, comparée à la cible de 10 à 15 minutes ;
- mortalité par vague (vagues trop faciles ou infranchissables) ;
- par bot : taux de recrutement et vague moyenne par perso, par faction et par palier de synergie ;
- signaux d'alerte (seuils dans `src/report.ts`).

## Performance

10 000 parties prennent 2 à 5 s par bot sur un poste de dev, sauf `lookahead` (≈ 50 s) qui rejoue
une quinzaine de combats par décision. Pour itérer vite : `--bot rarity` ou `--runs 2000`.

## Périmètre

Le simulateur ne modifie ni les règles ni les valeurs de `packages/game-data` : il mesure.
Un ajustement se propose avec les chiffres du rapport, puis s'applique dans une PR séparée.
