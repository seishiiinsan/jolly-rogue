# Règles chiffrées du prototype J1

Spécification complète du prototype J1 (cadrage §11). Les tâches 7 à 11 l'implémentent telle quelle :
données dans `packages/game-data/game/*.yaml`, règles dans `packages/engine`.

> **Statut des choix de game design.** Ce document a été rédigé sans étape de validation
> intermédiaire (consigne : enchaîner les tâches J1 sans s'arrêter). Tous les choix de game design
> sont donc des **propositions**, réglées au simulateur (`data/sim/report.md`) et listées en §16
> pour relecture. Les changer = modifier les YAML (valeurs) ou ce document puis le moteur (règles).

Conventions : **tous les nombres sont des entiers**. `floor(x)` = arrondi à l'entier inférieur.
Un pourcentage s'applique toujours ainsi : `floor(valeur × pct / 100)`.

---

## 1. Équipe et partie

- **Équipe de départ** : 2 persos **communs** distincts, tirés au sort (§13), niveau 1, placés sur
  leur ligne préférée (§6).
- **Taille max** : 5 persos. **Deux lignes** (avant, arrière) de 3 places chacune.
- **Déroulé** : la partie alterne deux phases.
  1. **Placement** (`prep`) : la vague suivante est déjà connue et affichée. Le joueur peut changer
     un perso de ligne, échanger deux persos, puis lance la vague.
  2. **Recrutement** (`recruit`), après une victoire : 3 persos proposés ; le joueur en recrute un
     ou **aucun**.
- **Recrutement** :
  - perso déjà dans l'équipe → **fusion** (§5), sans prendre de place ;
  - équipe non pleine → le perso est ajouté en dernière position, sur sa ligne préférée (l'autre si
    elle est pleine) ;
  - équipe pleine (6ᵉ perso) → le joueur désigne le perso **remplacé** ; la recrue prend son
    emplacement, au niveau 1 (le niveau du perso remplacé est perdu).
- **PV entre les vagues** : toute l'équipe repart avec tous ses PV à chaque vague (les morts
  reviennent). Boucliers, étourdissements et bonus d'ATK ne durent que le combat.
- **Fin de partie** : première vague perdue. Pas de seconde chance.

## 2. Persos

Trois stats :

| Stat | Rôle |
| --- | --- |
| **PV** | Points de vie. À 0, le perso est hors combat jusqu'à la vague suivante. |
| **ATK** | Dégâts de l'attaque de base ; base de calcul des compétences. |
| **VIT** | Ordre d'action dans le tour (§6). Ne donne pas d'action supplémentaire. |

Quatre archétypes, qui fixent la **portée** et la **règle de ciblage** :

| Archétype | Portée | Ligne préférée | Cible de l'attaque de base |
| --- | --- | --- | --- |
| `sabre` | mêlée | avant | l'ennemi qui a le **moins de PV** dans la ligne accessible |
| `poing` | mêlée | avant | le **premier** ennemi de la ligne accessible |
| `tir` | distance | arrière | l'ennemi qui a le moins de PV de la **ligne arrière** ennemie (ligne avant si l'arrière est vide) |
| `soutien` | distance | arrière | le premier ennemi de la ligne accessible |

- **Ligne accessible** : la ligne avant ennemie tant qu'elle compte un vivant, sinon la ligne arrière.
- **Mêlée à l'arrière** : un perso de mêlée placé en ligne arrière frappe à **50 %** de son ATK
  (attaques et compétences). Un perso à distance n'a aucun malus, où qu'il soit.

## 3. Compétences

Chaque perso a **une** compétence : un **déclencheur** et une **liste d'effets**, pris dans un
catalogue fermé et paramétrés en données. Aucun script par perso.

| Déclencheur | Moment |
| --- | --- |
| `combat_start` | Une fois, avant le tour 1, dans l'ordre d'action. |
| `every_n_actions` (`n`) | À chaque `n`ᵉ action du perso, **à la place** de son attaque de base. |
| `on_kill` | Chaque fois que le perso met un ennemi à 0 PV. |
| `on_death` | Quand le perso tombe à 0 PV. |

| Effet | Paramètre | Calcul |
| --- | --- | --- |
| `damage` | `pct` | `max(1, floor(ATK effective × pct / 100))` |
| `heal` | `pct` | `floor(ATK effective × pct / 100)`, plafonné aux PV manquants de la cible |
| `shield` | `pct` | bouclier de `floor(PV max du lanceur × pct / 100)`, cumulable, absorbe les dégâts avant les PV |
| `stun` | `turns` | la cible passe ses `turns` prochains tours (non cumulable : on garde le max) |
| `buff_atk` | `pct` | ATK de la cible + `pct` % jusqu'à la fin du combat (les bonus s'additionnent) |

| Cible | Désigne |
| --- | --- |
| `self` | le lanceur |
| `target` | la cible de l'attaque de base du lanceur (§2) |
| `target_row` | tous les ennemis vivants de la ligne de cette cible |
| `all_enemies` | tous les ennemis vivants |
| `random_enemy` | un ennemi vivant tiré au sort (seul tirage aléatoire du combat, §13) |
| `lowest_hp_ally` | l'allié vivant (lanceur compris) à qui il **manque le plus de PV** ; à égalité, le premier emplacement |
| `all_allies` | tous les alliés vivants, lanceur compris |

- `target` et `target_row` n'existent que pour `every_n_actions` (la validation le vérifie).
- **ATK effective** = `floor(ATK × (100 + bonus d'ATK) / 100)`, puis `floor(× 50 / 100)` pour un
  perso de mêlée en ligne arrière.
- Les effets s'appliquent dans l'ordre de la liste. Les cibles d'un effet sont déterminées juste
  avant de l'appliquer ; une cible morte entre-temps est ignorée.
- Un étourdissement ne compte pas comme une action : il ne fait pas avancer le compteur de
  `every_n_actions`.

Compétences des persos de J1 :

| Compétence | Déclencheur | Effets |
| --- | --- | --- |
| `gatling` (Rafale de poings) | toutes les 2 actions | dégâts 180 % sur la cible |
| `trois-sabres` (Style à trois sabres) | toutes les 3 actions | dégâts 200 % sur la cible |
| `jambe-ardente` (Jambe ardente) | toutes les 3 actions | dégâts 120 % sur la cible, puis ATK +15 % pour soi |
| `etoile-explosive` (Étoile explosive) | toutes les 3 actions | dégâts 160 % sur un ennemi au hasard |
| `premiers-soins` (Premiers soins) | toutes les 2 actions | soin 150 % à l'allié le plus blessé |
| `pluie-de-magma` (Pluie de magma) | toutes les 3 actions | dégâts 90 % à tous les ennemis |
| `pluie-de-lumiere` (Pluie de lumière) | toutes les 3 actions | dégâts 60 % à tous les ennemis |
| `cage-noire` (Cage noire) | toutes les 4 actions | dégâts 100 % sur la cible, puis étourdissement 1 tour |
| `lame-affutee` (Lame affûtée) | à l'élimination | ATK +20 % pour soi |
| `seisme` (Séisme) | toutes les 3 actions | dégâts 130 % à la ligne de la cible, puis étourdissement 1 tour de la cible |
| `poing-ardent` (Poing ardent) | toutes les 3 actions | dégâts 110 % à la ligne de la cible |
| `corps-de-diamant` (Corps de diamant) | début de combat | bouclier 30 % pour soi |
| `fils-parasites` (Fils parasites) | toutes les 4 actions | dégâts 120 % sur la cible, puis étourdissement 1 tour |
| `lame-ondulante` (Lame ondulante) | toutes les 3 actions | dégâts 80 % à la ligne de la cible |
| `rempart-de-pierre` (Rempart de pierre) | début de combat | bouclier 10 % à tous les alliés |

Les noms de compétences sont inventés pour le jeu (ce ne sont pas des faits de lore).

## 4. Raretés

Trois raretés : `commun`, `rare`, `legendaire`.

**Budget de stats** : coût d'un perso = `PV + 5 × ATK + 3 × VIT`, à ± 10 du budget de sa rareté.
La puissance de la compétence s'équilibre à la main, hors budget.

| Rareté | Budget |
| --- | --- |
| commun | 250 |
| rare | 330 |
| légendaire | 430 |

**Probabilités de l'offre**, selon la vague `w` qui vient d'être gagnée (en %) :

- légendaire = `min(25, 2 × floor(w / 2))`
- rare = `min(45, 15 + 3 × w)`
- commun = `100 − légendaire − rare`

| Vague gagnée | 1 | 2 | 4 | 6 | 8 | 10 | 15 | 20 | 26+ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| légendaire | 0 | 2 | 4 | 6 | 8 | 10 | 14 | 20 | 25 |
| rare | 18 | 21 | 27 | 33 | 39 | 45 | 45 | 45 | 45 |
| commun | 82 | 77 | 69 | 61 | 53 | 45 | 41 | 35 | 30 |

**Tirage de l'offre** (3 places, l'une après l'autre) : on tire la rareté, puis un perso au hasard
parmi ceux de cette rareté qui ne sont **ni déjà dans l'offre, ni au niveau max** dans l'équipe.
Si ce vivier est vide, on se rabat sur une autre rareté : légendaire → rare → commun ;
rare → commun → légendaire ; commun → rare → légendaire. L'offre ne dépend pas de la collection.

## 5. Fusion

- Recruter un perso déjà dans l'équipe lui donne **+1 niveau**. Une copie par niveau.
- **Niveau max : 3** (un perso au niveau 3 n'est plus proposé).
- Effet : PV et ATK de base × **100 % / 150 % / 200 %** aux niveaux 1 / 2 / 3. VIT inchangée.

Stats finales d'un perso pour un combat, dans cet ordre :

1. `floor(stat de base × multiplicateur de niveau / 100)` (PV et ATK) ;
2. `floor(résultat × (100 + bonus de synergie en %) / 100)` (§8) ; VIT + bonus fixe de synergie.

## 6. Placement et ciblage

- Chaque perso a une **ligne** (avant ou arrière) et un **emplacement** : son rang dans l'équipe
  (0, 1, 2…). « Premier » veut toujours dire « plus petit emplacement ».
- Choix de placement : **déplacer** un perso sur l'autre ligne (refusé si elle a déjà 3 persos),
  ou **échanger** deux persos (ils échangent emplacement et ligne). Uniquement en phase de placement.
- Les ennemis suivent exactement les mêmes règles de ciblage (§2) contre l'équipe du joueur.
- **Ordre d'action** dans un tour, parmi les vivants : VIT décroissante ; à égalité, le camp du
  **joueur** d'abord ; puis la **ligne avant** ; puis le plus petit **emplacement**. Aucun aléatoire.
- **Égalité de PV** pour un ciblage « moins de PV » : le plus petit emplacement.

## 7. Combat

Le combat est résolu d'un coup par le moteur, par **tours** :

1. Compétences `combat_start`, dans l'ordre d'action.
2. Tours 1, 2, 3… : l'ordre d'action est calculé au début du tour ; chaque vivant agit une fois.
   - S'il est étourdi : il passe son tour (l'étourdissement baisse de 1).
   - Sinon il choisit sa cible (§2), son compteur d'actions augmente de 1, puis il lance sa
     compétence `every_n_actions` si le compteur est un multiple de `n`, sinon il attaque :
     dégâts = `max(1, ATK effective)`.
3. **Dégâts** : le bouclier de la cible absorbe d'abord, le reste est retiré des PV.
4. **Mort** (PV à 0) : compétence `on_death` de la victime, puis compétence `on_kill` du tueur
   (s'il est vivant et du camp adverse). Un perso mort avant son tour n'agit pas.
5. Après chaque action : si le camp du **joueur** n'a plus de vivant → **défaite** (même si
   l'ennemi tombe en même temps) ; sinon si l'ennemi n'a plus de vivant → **victoire**.
6. **Limite de durée** : 30 tours. Au-delà, la vague n'est pas vaincue → **défaite**.

**Journal d'événements** (`eventLogVersion` 1), suffisant pour rejouer le combat sans rien recalculer.
Les combattants sont identifiés par `p0`, `p1`… (joueur) et `e0`, `e1`… (ennemi), dans l'ordre des emplacements.

| Événement | Contenu |
| --- | --- |
| `combat_start` | tous les combattants : id, camp, emplacement, ligne, référence (slug ou id d'ennemi), niveau, archétype, PV max, ATK, VIT, compétence |
| `round_start` | numéro du tour |
| `action` | acteur, `attack` ou `skill` (+ id de la compétence), cible de l'attaque |
| `skill_trigger` | acteur, compétence, déclencheur (`combat_start`, `on_kill`, `on_death`) |
| `damage` | source, cible, PV perdus, dégâts absorbés par le bouclier, PV et bouclier restants |
| `heal` | source, cible, PV rendus, PV après soin |
| `shield` | source, cible, montant, bouclier total |
| `stun` | source, cible, nombre de tours |
| `stunned` | combattant qui passe son tour |
| `buff_atk` | source, cible, bonus ajouté, bonus total |
| `death` | combattant |
| `combat_end` | issue (`victory` / `defeat`), raison (`wipe` / `round_limit`), nombre de tours |

## 8. Synergies

Une faction = un équipage canon (`crews.slug`). On compte les persos **distincts** de la faction
dans l'équipe ; le **palier le plus haut atteint** s'applique, **aux seuls membres de la faction**.

| Faction (`crews.slug`) | Membres J1 | Palier 1 | Palier 2 |
| --- | --- | --- | --- |
| `mugiwara-no-ichimi` | 5 | **2** : PV +15 %, ATK +15 % | **4** : PV +40 %, ATK +40 % |
| `kaigun` | 4 | **2** : PV +30 % | **4** : PV +60 %, ATK +20 % |
| `shirohige-kaizokudan` | 3 | **2** : ATK +25 % | **3** : ATK +50 %, PV +15 % |
| `donkihote-kaizokudan` | 3 | **2** : VIT +3, ATK +15 % | **3** : VIT +6, ATK +40 % |

## 9. Catalogue J1

15 persos. Chaque `slug` existe dans `data/exports/canon.json`, et le canon rattache chaque perso
à sa faction (vérifié par `pnpm --filter @jolly-rogue/game-data validate` et par les tests).

| Slug | Faction | Rareté | Archétype | PV | ATK | VIT | Compétence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `monkey-d-luffy` | `mugiwara-no-ichimi` | légendaire | poing | 190 | 36 | 19 | `gatling` |
| `roronoa-zoro` | `mugiwara-no-ichimi` | rare | sabre | 120 | 32 | 15 | `trois-sabres` |
| `sanji` | `mugiwara-no-ichimi` | rare | poing | 125 | 28 | 22 | `jambe-ardente` |
| `usopp` | `mugiwara-no-ichimi` | commun | tir | 70 | 28 | 12 | `etoile-explosive` |
| `tony-tony-chopper` | `mugiwara-no-ichimi` | commun | soutien | 100 | 20 | 14 | `premiers-soins` |
| `sakazuki-akainu` | `kaigun` | légendaire | poing | 170 | 40 | 18 | `pluie-de-magma` |
| `borsalino-kizaru` | `kaigun` | rare | tir | 100 | 30 | 26 | `pluie-de-lumiere` |
| `hina` | `kaigun` | commun | poing | 110 | 18 | 15 | `cage-noire` |
| `momonga` | `kaigun` | commun | sabre | 95 | 24 | 11 | `lame-affutee` |
| `edward-newgate-barbe-blanche` | `shirohige-kaizokudan` | légendaire | poing | 230 | 34 | 10 | `seisme` |
| `portgas-d-ace` | `shirohige-kaizokudan` | rare | poing | 130 | 30 | 16 | `poing-ardent` |
| `diamond-joz` | `shirohige-kaizokudan` | commun | poing | 160 | 12 | 8 | `corps-de-diamant` |
| `don-quijote-doflamingo` | `donkihote-kaizokudan` | rare | tir | 110 | 30 | 22 | `fils-parasites` |
| `diamante` | `donkihote-kaizokudan` | commun | sabre | 85 | 26 | 12 | `lame-ondulante` |
| `pica` | `donkihote-kaizokudan` | commun | poing | 150 | 14 | 7 | `rempart-de-pierre` |

Répartition : 7 communs, 5 rares, 3 légendaires ; 5 + 4 + 3 + 3 persos par faction.
« Jambe » n'est pas un archétype en J1 : Sanji est rangé en `poing` (mêlée).

## 10. Ennemis et vagues

**Sbires** génériques (aucun fait de lore) :

| Id | Nom | Archétype | Ligne | PV | ATK | VIT | Dès la vague | Compétence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `matelot` | Matelot | poing | avant | 60 | 12 | 9 | 1 | – |
| `sabreur` | Sabreur | sabre | avant | 50 | 16 | 12 | 1 | – |
| `tireur` | Tireur | tir | arrière | 40 | 18 | 13 | 2 | – |
| `brute` | Brute | poing | avant | 110 | 10 | 6 | 4 | `cuirasse` : début de combat, bouclier 20 % pour soi |
| `medecin` | Médecin de bord | soutien | arrière | 55 | 10 | 11 | 6 | `bandage` : toutes les 2 actions, soin 150 % à l'allié le plus blessé |
| `artificier` | Artificier | tir | arrière | 45 | 14 | 10 | 8 | `baril-de-poudre` : à sa mort, dégâts 60 % à tous ses ennemis |

**Boss** (persos du canon, nom résolu depuis `canon.json`), tous `poing`, en ligne avant :

| Id | `canonSlug` | PV | ATK | VIT | Compétence |
| --- | --- | --- | --- | --- | --- |
| `boss-lucci` | `rob-lucci` | 400 | 30 | 20 | `griffe-du-leopard` : toutes les 3 actions, dégâts 200 % sur la cible |
| `boss-crocodile` | `crocodile` | 320 | 20 | 14 | `tempete-de-sable` : toutes les 3 actions, dégâts 90 % à la ligne de la cible |
| `boss-teach` | `marchall-d-teach-barbe-noire` | 340 | 20 | 12 | `tenebres` : toutes les 3 actions, dégâts 70 % à tous les ennemis |
| `boss-kaido` | `kaido` | 380 | 22 | 16 | `souffle-ardent` : toutes les 2 actions, dégâts 60 % à tous les ennemis |

**Courbe de difficulté** : PV et ATK de tous les ennemis de la vague `w` sont multipliés par

`mult(w) = 100 + 8 × (w − 1) + floor(40 × (w − 1)² / 100)` (en %), la VIT ne change pas.

| Vague | 1 | 2 | 5 | 10 | 15 | 20 | 30 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| mult (%) | 100 | 108 | 138 | 204 | 290 | 396 | 668 |

**Vague normale** : `min(6, 2 + floor((w − 1) / 2))` sbires (2 à la vague 1, 6 dès la vague 9).
Chaque sbire est tiré au hasard parmi ceux débloqués (`minWave ≤ w`), triés par id ; le **premier**
est tiré parmi les sbires de ligne avant seulement. Chacun va sur sa ligne préférée, ou sur l'autre
si elle a déjà 3 ennemis.

**Vague de boss** : toutes les 10 vagues. Palier `k = w / 10`. Le boss est le `k`ᵉ de la liste
`lucci, crocodile, teach, kaido`, qui boucle (vague 50 : Lucci à nouveau). Il occupe l'emplacement 0,
suivi de `min(5, 1 + k)` sbires d'escorte tirés comme ci-dessus. Le boss subit le même `mult(w)`.

**Vagues infinies** : la formule ne s'arrête jamais ; le terme quadratique garantit qu'une partie finit.

## 11. Score

- `score = 1000 × vagues gagnées + bonus`
- `bonus = min(999, floor(S / vagues gagnées))`, où `S` est la somme, sur les vagues gagnées, de
  `floor(1000 × PV restants de l'équipe / PV max de l'équipe)` en fin de combat. Bonus 0 sans victoire.

Le nombre de vagues gagnées prime toujours ; le bonus départage (qui gagne « proprement »).
Égalité parfaite : pas d'autre départage en J1 (pas de classement).

## 12. Durée

Mesurée par le simulateur (`data/sim/report.md`), avec ces hypothèses à l'écran, vitesse ×1 :
0,6 s par action de combat, 12 s par choix de recrue, 5 s de placement par vague.

- Un joueur appliqué (bots `rarity`, `lookahead`) gagne **19 à 20 vagues** en médiane :
  **≈ 12 à 13 minutes**.
- Un joueur qui choisit au hasard tombe vers la vague 9 (boss de la vague 10) : ≈ 5 à 6 minutes.
- Cible du cadrage : 10 à 15 minutes pour une partie « type » ✔. Le bouton ×2 et « passer »
  raccourcissent les premières vagues.

## 13. Déterminisme

- **Entiers uniquement** ; tout arrondi est un `floor` explicite écrit dans ce document.
- **Une seule source d'aléatoire** : un RNG `sfc32` seedé par un entier 32 bits non signé, dont
  l'état (4 entiers) est stocké dans l'état de la partie. `int(n)` = `floor(u32 × n / 2³²)`.
- **Ordre de consommation du RNG** :
  1. création de la partie : équipe de départ (un `int(restants)` par perso, tirage sans remise
     parmi les communs triés par slug), puis génération de la vague 1 (un `int(vivier)` par sbire) ;
  2. à chaque vague lancée : les tirages du combat (un `int(ennemis vivants)` par résolution de
     `random_enemy`, dans l'ordre des événements) ;
  3. en cas de victoire : l'offre (pour chaque place : `int(100)` pour la rareté, puis
     `int(vivier)` pour le perso), **puis** la génération de la vague suivante.
- Placement, recrutement et « passer » ne consomment aucun tirage. Un choix illégal non plus.
- **Rejeu** : `replay(seed, choix)` redonne le même état final ; l'état de partie est du JSON pur.

## 14. Format des données

Fichiers écrits à la main dans `packages/game-data/game/`, validés par Zod
(`packages/game-data/src/schema.ts`) et assemblés dans `data/exports/game.json`.
Aucun fait de lore n'y est recopié : nom, équipage et fruit viennent de `canon.json` par le slug.

`characters.yaml` — un perso :

```yaml
- slug: roronoa-zoro            # characters.slug de canon.json
  faction: mugiwara-no-ichimi   # crews.slug de canon.json
  rarity: rare                  # commun | rare | legendaire
  archetype: sabre              # sabre | poing | tir | soutien
  hp: 120
  atk: 32
  spd: 15
  skill: trois-sabres           # id de skills.yaml
```

`skills.yaml` — une compétence :

```yaml
- id: cage-noire
  name: Cage noire              # nom affiché, inventé pour le jeu
  trigger: { type: every_n_actions, n: 4 }   # combat_start | every_n_actions | on_kill | on_death
  effects:
    - { type: damage, target: target, pct: 100 }
    - { type: stun, target: target, turns: 1 }
```

`enemies.yaml` — un sbire et un boss :

```yaml
- { id: brute, name: Brute, archetype: poing, row: front, hp: 110, atk: 10, spd: 6, minWave: 4, skill: cuirasse }
- { id: boss-lucci, canonSlug: rob-lucci, boss: true, archetype: poing, row: front, hp: 400, atk: 30, spd: 20, skill: griffe-du-leopard }
```

`waves.yaml` :

```yaml
count: { base: 2, step: 2, max: 6 }                 # min(max, base + floor((w - 1) / step))
scaling: { base: 100, linear: 8, quadratic: 40 }    # base + linear × (w-1) + floor(quadratic × (w-1)² / 100)
boss:
  every: 10
  order: [boss-lucci, boss-crocodile, boss-teach, boss-kaido]
  escorts: { base: 1, max: 5 }                      # min(max, base + palier)
```

`synergies.yaml` — une faction :

```yaml
- faction: shirohige-kaizokudan
  tiers:
    - { count: 2, bonuses: [{ stat: atk_pct, value: 25 }] }
    - { count: 3, bonuses: [{ stat: atk_pct, value: 50 }, { stat: hp_pct, value: 15 }] }
```

`rules.yaml` — constantes de ce document (taille d'équipe, niveaux, limite de tours, courbes de
rareté, score, budgets, archétypes) :

```yaml
team: { max: 5, rowMax: 3, startingCount: 2, startingRarity: commun }
fusion: { maxLevel: 3, levelMultiplierPct: [100, 150, 200] }
combat: { roundLimit: 30, meleeBackRowPct: 50 }
offer:
  size: 3
  legendaire: { base: 0, perStep: 2, step: 2, cap: 25 }
  rare: { base: 15, perStep: 3, step: 1, cap: 45 }
score: { perWave: 1000, bonusCap: 999 }
budget: { atk: 5, spd: 3, tolerance: 10, commun: 250, rare: 330, legendaire: 430 }
archetypes:
  sabre: { range: melee, targeting: lowest_hp }
  poing: { range: melee, targeting: first }
  tir: { range: ranged, targeting: back_first }
  soutien: { range: ranged, targeting: first }
```

## 15. Exemple déroulé

**Seed 2, vague 1.** Reproduit à l'identique par `packages/engine/test/combat.test.ts`.

Équipe tirée : `usopp` (tir, arrière, `p0`, PV 70, ATK 28, VIT 12) et `diamond-joz` (poing, avant,
`p1`, PV 160, ATK 12, VIT 8). Aucune synergie (une faction chacun).
Vague 1 (`mult` = 100 %) : `matelot` (`e0`, PV 60, ATK 12, VIT 9) et `sabreur` (`e1`, PV 50, ATK 16,
VIT 12), tous deux en ligne avant.

Ordre d'action : Usopp et le sabreur ont VIT 12 → le joueur d'abord : `p0`, `e1`, `e0` (9), `p1` (8).

| # | Événement | Calcul |
| --- | --- | --- |
| – | `p1` début de combat : Corps de diamant | bouclier `floor(160 × 30 / 100)` = 48 |
| **Tour 1** | | |
| 1 | `p0` attaque `e1` | tir : ligne arrière ennemie vide → ligne avant, moins de PV : sabreur (50 < 60). 50 − 28 = **22** |
| 2 | `e1` attaque `p1` | sabre : seul Joz est en ligne avant. Bouclier 48 − 16 = 32, PV 160 |
| 3 | `e0` attaque `p1` | bouclier 32 − 12 = 20, PV 160 |
| 4 | `p1` attaque `e0` | poing : premier de la ligne avant. 60 − 12 = **48** |
| **Tour 2** | | |
| 5 | `p0` attaque `e1` | 22 − 28 → **0**, le sabreur meurt (22 PV perdus) |
| 6 | `e0` attaque `p1` | bouclier 20 − 12 = 8 |
| 7 | `p1` attaque `e0` | 48 − 12 = **36** |
| **Tour 3** | | |
| 8 | `p0` 3ᵉ action : Étoile explosive | un ennemi au hasard parmi 1 (un tirage consommé) : `e0`. `floor(28 × 160 / 100)` = 44 ≥ 36 → **0**, le matelot meurt |
| – | Fin : victoire en 3 tours | |

Score : PV restants 70 + 160 = 230 sur 230 → 1000 ‰ ; `bonus = min(999, 1000)` = 999 ;
**score = 1 × 1000 + 999 = 1999**.
Offre tirée ensuite (vague 1 : rare 18 %, commun 82 %) : `portgas-d-ace`, `roronoa-zoro`, `momonga`.
Vague 2 générée (`mult` = 108 %) : `sabreur` (PV 54, ATK 17) et `matelot` (PV 64, ATK 12).

## 16. Choix de game design à relire et questions ouvertes

Choix faits sans validation (propositions, toutes modifiables) :

1. **PV restaurés à chaque vague** (pas d'attrition) : plus simple à lire, mais retire une tension.
2. **Remplacement = perte du niveau** du perso sorti ; pas de « banc ».
3. **Échange d'emplacements** (`swap`) en plus du changement de ligne : l'ordre dans la ligne
   compte pour le ciblage `poing`.
4. **La vague suivante est visible avant de recruter et de se placer** (décision lisible).
5. **Limite de 30 tours = défaite**, et **double K.-O. = défaite**.
6. **La compétence remplace l'attaque de base** (au lieu de s'y ajouter).
7. **Archétypes** : 4 seulement, `soutien` au lieu de `soin` ; Sanji en `poing`.
8. **Factions** : Chapeau de paille, Marine, Barbe Blanche, Don Quichotte ; bonus du §8.
9. **Boss** : Lucci, Crocodile, Barbe Noire, Kaido ; même multiplicateur que les sbires.
10. **Score** : bonus de PV restants en ‰ ; pas de prise en compte du temps.
11. **Toutes les valeurs** des §3, §4, §9 et §10.

Questions ouvertes :

- **Plafond vers la vague 29-30** : aucun bot ne passe le boss de la vague 30 (`mult` = 668 %).
  Voulu pour borner la durée, mais à confirmer au playtest : un mur, ou une courbe plus douce ?
- **Vagues 1 à 8 sans risque** pour un joueur appliqué (≈ 0 % d'éliminations) : montée en
  puissance agréable ou début trop long ? À trancher au playtest (T12).
- **« Meilleure rareté » est une heuristique très forte** (`rarity` ≈ `lookahead` au simulateur) :
  les synergies pèsent encore trop peu face à la rareté. Pistes chiffrées dans le rapport du simulateur.
- **Étourdissement des boss** : aucun boss n'y est immunisé ; à surveiller (Hina, Doflamingo).
- Le canon ne rattache `crocodile` à aucun équipage courant : sans importance pour un boss, à
  corriger côté pipeline si Crocodile devient jouable.
