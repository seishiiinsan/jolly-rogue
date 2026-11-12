# Rapport du simulateur d'équilibrage

Généré par `sim` : 10000 parties par bot, seeds 1 à 10000, données de jeu v1. Fichier régénéré, ne pas éditer à la main.

## Bots

| Bot | Stratégie |
| --- | --- |
| `random` | Choix légaux au hasard (recrue, remplacement, déplacements). |
| `rarity` | Prend toujours la meilleure rareté ; ne touche pas au placement. |
| `fusion` | Fusionne dès que possible, sinon meilleure rareté. |
| `synergy` | Vise la faction la plus représentée de son équipe et la complète. |
| `frontline` | Privilégie les persos de mêlée et remplit la ligne avant avec les plus résistants. |
| `lookahead` | Joueur appliqué : essaie chaque recrue (et chaque remplacement) en simulant la vague suivante, garde la meilleure issue ; à issue égale, préfère fusion et rareté. |

## Vagues gagnées par bot

| Bot | Moyenne | D1 | D2 | D3 | D4 | Médiane | D6 | D7 | D8 | D9 | Max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `random` | 8.3 | 5 | 7 | 8 | 8 | 9 | 9 | 9 | 9 | 11 | 19 |
| `rarity` | 19.1 | 13 | 17 | 18 | 19 | 19 | 19 | 21 | 23 | 25 | 29 |
| `fusion` | 17.7 | 12 | 15 | 16 | 17 | 19 | 19 | 19 | 21 | 23 | 29 |
| `synergy` | 17.3 | 9 | 14 | 15 | 17 | 18 | 19 | 19 | 21 | 24 | 29 |
| `frontline` | 10.8 | 8 | 9 | 9 | 9 | 9 | 9 | 11 | 14 | 16 | 26 |
| `lookahead` | 20.1 | 16 | 18 | 19 | 19 | 19 | 21 | 22 | 23 | 25 | 29 |

## Durée estimée d'une partie

Hypothèses (vitesse x1) : 0.6 s par action de combat, 12 s par choix de recrue, 5 s de placement par vague. Cible : 10 à 15 minutes.

| Bot | Moyenne (min) | Médiane (min) | D9 (min) | Dans la cible |
| --- | --- | --- | --- | --- |
| `random` | 5.4 | 5.5 | 7.3 | 1.3 % |
| `rarity` | 11.9 | 11.9 | 15.6 | 66.5 % |
| `fusion` | 11.2 | 11.4 | 14.6 | 63.9 % |
| `synergy` | 10.9 | 11.1 | 15.0 | 55.2 % |
| `frontline` | 7.6 | 6.3 | 12.1 | 20.5 % |
| `lookahead` | 12.8 | 12.7 | 16.1 | 70.5 % |

## Mortalité par vague

Part des parties qui atteignent la vague et y sont éliminées (tous bots confondus, puis par bot).

| Vague | Parties | Tous | `random` | `rarity` | `fusion` | `synergy` | `frontline` | `lookahead` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 60000 | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % |
| 2 | 59996 | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % |
| 3 | 59993 | 0.6 % | 3.8 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % |
| 4 | 59618 | 0.3 % | 1.8 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % |
| 5 | 59449 | 0.7 % | 4.5 % | 0.0 % | 0.1 % | 0.0 % | 0.1 % | 0.0 % |
| 6 | 59005 | 0.4 % | 2.5 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % | 0.0 % |
| 7 | 58779 | 1.1 % | 5.9 % | 0.0 % | 0.3 % | 0.1 % | 0.9 % | 0.0 % |
| 8 | 58139 | 1.0 % | 5.5 % | 0.0 % | 0.0 % | 0.0 % | 1.0 % | 0.0 % |
| 9 | 57571 | 6.0 % | 26.2 % | 0.1 % | 0.4 % | 0.6 % | 12.9 % | 0.0 % |
| **10 (boss)** | 54132 | 22.1 % | 73.4 % | 7.7 % | 5.8 % | 9.7 % | 59.9 % | 3.0 % |
| 11 | 42174 | 1.7 % | 22.8 % | 0.3 % | 0.6 % | 1.2 % | 5.0 % | 0.1 % |
| 12 | 41445 | 2.4 % | 30.9 % | 0.7 % | 1.3 % | 1.6 % | 8.4 % | 0.2 % |
| 13 | 40459 | 3.3 % | 37.6 % | 1.2 % | 2.9 % | 2.8 % | 12.8 % | 0.4 % |
| 14 | 39105 | 3.8 % | 47.7 % | 1.4 % | 3.5 % | 3.9 % | 15.4 % | 0.7 % |
| 15 | 37622 | 5.3 % | 48.9 % | 2.1 % | 5.9 % | 7.2 % | 20.6 % | 1.4 % |
| 16 | 35630 | 6.7 % | 57.7 % | 3.2 % | 8.3 % | 9.6 % | 23.7 % | 2.4 % |
| 17 | 33233 | 7.9 % | 75.9 % | 4.6 % | 9.8 % | 11.5 % | 26.2 % | 3.7 % |
| 18 | 30606 | 10.1 % | 71.4 % | 6.4 % | 12.5 % | 15.9 % | 28.0 % | 5.6 % |
| 19 | 27518 | 12.2 % | 50.0 % | 9.3 % | 14.2 % | 17.1 % | 32.1 % | 8.7 % |
| **20 (boss)** | 24160 | 42.6 % | 100.0 % | 42.9 % | 48.4 % | 41.5 % | 80.5 % | 36.8 % |
| 21 | 13859 | 13.4 % | – | 11.9 % | 18.1 % | 11.8 % | 19.1 % | 12.7 % |
| 22 | 12007 | 17.4 % | – | 16.4 % | 23.3 % | 15.0 % | 22.4 % | 16.3 % |
| 23 | 9922 | 23.5 % | – | 21.8 % | 29.4 % | 19.5 % | 47.5 % | 24.0 % |
| 24 | 7586 | 29.7 % | – | 27.5 % | 34.0 % | 28.3 % | 54.8 % | 30.1 % |
| 25 | 5335 | 38.0 % | – | 35.0 % | 42.2 % | 37.8 % | 50.0 % | 39.0 % |
| 26 | 3308 | 54.2 % | – | 56.1 % | 55.9 % | 53.0 % | 57.1 % | 52.4 % |
| 27 | 1516 | 61.4 % | – | 65.7 % | 58.5 % | 63.3 % | 100.0 % | 57.4 % |
| 28 | 585 | 73.3 % | – | 83.0 % | 82.5 % | 59.6 % | – | 70.3 % |
| 29 | 156 | 73.1 % | – | 92.6 % | 71.4 % | 67.4 % | – | 69.6 % |
| **30 (boss)** | 42 | 100.0 % | – | 100.0 % | 100.0 % | 100.0 % | – | 100.0 % |

## Bot `random`

### Par perso

Taux de recrutement = fois recruté / fois proposé. Vague moyenne = vagues gagnées quand le perso est dans l'équipe finale.

| Perso | Rareté | Proposé | Taux de recrutement | Équipes finales | Vague moyenne |
| --- | --- | --- | --- | --- | --- |
| `borsalino-kizaru` | rare | 15113 | 24.7 % | 2305 | 9.5 |
| `diamante` | commun | 23495 | 25.1 % | 4655 | 8.3 |
| `diamond-joz` | commun | 23590 | 25.1 % | 4870 | 8.2 |
| `don-quijote-doflamingo` | rare | 14841 | 25.2 % | 2185 | 9.7 |
| `edward-newgate-barbe-blanche` | legendaire | 3733 | 25.6 % | 639 | 10.4 |
| `hina` | commun | 23596 | 25.2 % | 4725 | 8.2 |
| `momonga` | commun | 23582 | 25.0 % | 4766 | 8.3 |
| `monkey-d-luffy` | legendaire | 3699 | 24.6 % | 650 | 10.0 |
| `pica` | commun | 23365 | 24.8 % | 4593 | 8.4 |
| `portgas-d-ace` | rare | 14863 | 25.3 % | 2446 | 9.2 |
| `roronoa-zoro` | rare | 15019 | 24.8 % | 2319 | 9.4 |
| `sakazuki-akainu` | legendaire | 3689 | 24.9 % | 637 | 9.9 |
| `sanji` | rare | 14950 | 24.7 % | 2426 | 9.2 |
| `tony-tony-chopper` | commun | 23212 | 24.9 % | 4503 | 8.6 |
| `usopp` | commun | 23243 | 24.8 % | 4554 | 8.5 |

### Par faction et palier de synergie

| Faction | Palier atteint | Équipes finales | Vague moyenne |
| --- | --- | --- | --- |
| `donkihote-kaizokudan` | aucun | 6976 | 8.1 |
| `donkihote-kaizokudan` | 2 | 2778 | 8.8 |
| `donkihote-kaizokudan` | 3 | 246 | 9.9 |
| `kaigun` | aucun | 6466 | 8.1 |
| `kaigun` | 2 | 3528 | 8.8 |
| `kaigun` | 4 | 6 | 9.0 |
| `mugiwara-no-ichimi` | aucun | 5393 | 7.6 |
| `mugiwara-no-ichimi` | 2 | 4567 | 9.2 |
| `mugiwara-no-ichimi` | 4 | 40 | 10.7 |
| `shirohige-kaizokudan` | aucun | 8721 | 8.2 |
| `shirohige-kaizokudan` | 2 | 1253 | 9.3 |
| `shirohige-kaizokudan` | 3 | 26 | 10.7 |

## Bot `rarity`

### Par perso

Taux de recrutement = fois recruté / fois proposé. Vague moyenne = vagues gagnées quand le perso est dans l'équipe finale.

| Perso | Rareté | Proposé | Taux de recrutement | Équipes finales | Vague moyenne |
| --- | --- | --- | --- | --- | --- |
| `borsalino-kizaru` | rare | 41438 | 41.2 % | 5104 | 19.2 |
| `diamante` | commun | 43067 | 7.9 % | 140 | 9.3 |
| `diamond-joz` | commun | 43410 | 8.2 % | 84 | 10.5 |
| `don-quijote-doflamingo` | rare | 42900 | 39.3 % | 5140 | 18.7 |
| `edward-newgate-barbe-blanche` | legendaire | 17877 | 89.1 % | 7866 | 20.1 |
| `hina` | commun | 43121 | 8.4 % | 119 | 9.4 |
| `momonga` | commun | 42659 | 8.6 % | 114 | 9.4 |
| `monkey-d-luffy` | legendaire | 17977 | 89.1 % | 7968 | 20.0 |
| `pica` | commun | 42763 | 8.2 % | 67 | 10.0 |
| `portgas-d-ace` | rare | 44436 | 37.7 % | 5129 | 17.9 |
| `roronoa-zoro` | rare | 43481 | 38.8 % | 5173 | 18.4 |
| `sakazuki-akainu` | legendaire | 17554 | 88.5 % | 7819 | 20.0 |
| `sanji` | rare | 45203 | 37.4 % | 5151 | 17.8 |
| `tony-tony-chopper` | commun | 42884 | 8.2 % | 84 | 9.5 |
| `usopp` | commun | 42916 | 8.6 % | 27 | 9.9 |

### Par faction et palier de synergie

| Faction | Palier atteint | Équipes finales | Vague moyenne |
| --- | --- | --- | --- |
| `donkihote-kaizokudan` | aucun | 9930 | 19.1 |
| `donkihote-kaizokudan` | 2 | 70 | 9.9 |
| `donkihote-kaizokudan` | 3 | 0 | – |
| `kaigun` | aucun | 6251 | 18.3 |
| `kaigun` | 2 | 3749 | 20.4 |
| `kaigun` | 4 | 0 | – |
| `mugiwara-no-ichimi` | aucun | 2972 | 19.7 |
| `mugiwara-no-ichimi` | 2 | 7028 | 18.8 |
| `mugiwara-no-ichimi` | 4 | 0 | – |
| `shirohige-kaizokudan` | aucun | 6404 | 18.9 |
| `shirohige-kaizokudan` | 2 | 3594 | 19.3 |
| `shirohige-kaizokudan` | 3 | 2 | 14.0 |

## Bot `fusion`

### Par perso

Taux de recrutement = fois recruté / fois proposé. Vague moyenne = vagues gagnées quand le perso est dans l'équipe finale.

| Perso | Rareté | Proposé | Taux de recrutement | Équipes finales | Vague moyenne |
| --- | --- | --- | --- | --- | --- |
| `borsalino-kizaru` | rare | 37839 | 43.4 % | 5948 | 18.1 |
| `diamante` | commun | 41144 | 16.1 % | 555 | 11.3 |
| `diamond-joz` | commun | 41284 | 16.4 % | 519 | 11.5 |
| `don-quijote-doflamingo` | rare | 38368 | 42.0 % | 5885 | 17.9 |
| `edward-newgate-barbe-blanche` | legendaire | 15993 | 64.2 % | 5652 | 19.1 |
| `hina` | commun | 41111 | 16.5 % | 547 | 11.7 |
| `momonga` | commun | 40709 | 17.2 % | 531 | 11.8 |
| `monkey-d-luffy` | legendaire | 16132 | 64.4 % | 5727 | 19.0 |
| `pica` | commun | 41075 | 16.4 % | 417 | 12.0 |
| `portgas-d-ace` | rare | 40380 | 40.7 % | 6003 | 17.2 |
| `roronoa-zoro` | rare | 39153 | 41.9 % | 5965 | 17.6 |
| `sakazuki-akainu` | legendaire | 15821 | 63.3 % | 5567 | 19.2 |
| `sanji` | rare | 40665 | 40.3 % | 5952 | 17.1 |
| `tony-tony-chopper` | commun | 40804 | 16.3 % | 272 | 12.0 |
| `usopp` | commun | 40492 | 17.4 % | 264 | 13.0 |

### Par faction et palier de synergie

| Faction | Palier atteint | Équipes finales | Vague moyenne |
| --- | --- | --- | --- |
| `donkihote-kaizokudan` | aucun | 9647 | 17.9 |
| `donkihote-kaizokudan` | 2 | 347 | 12.8 |
| `donkihote-kaizokudan` | 3 | 6 | 12.2 |
| `kaigun` | aucun | 6544 | 17.2 |
| `kaigun` | 2 | 3456 | 18.7 |
| `kaigun` | 4 | 0 | – |
| `mugiwara-no-ichimi` | aucun | 3128 | 17.3 |
| `mugiwara-no-ichimi` | 2 | 6872 | 17.9 |
| `mugiwara-no-ichimi` | 4 | 0 | – |
| `shirohige-kaizokudan` | aucun | 6873 | 17.6 |
| `shirohige-kaizokudan` | 2 | 3115 | 18.0 |
| `shirohige-kaizokudan` | 3 | 12 | 14.9 |

## Bot `synergy`

### Par perso

Taux de recrutement = fois recruté / fois proposé. Vague moyenne = vagues gagnées quand le perso est dans l'équipe finale.

| Perso | Rareté | Proposé | Taux de recrutement | Équipes finales | Vague moyenne |
| --- | --- | --- | --- | --- | --- |
| `borsalino-kizaru` | rare | 38602 | 22.8 % | 3997 | 17.0 |
| `diamante` | commun | 37410 | 28.4 % | 4757 | 15.4 |
| `diamond-joz` | commun | 44516 | 4.6 % | 1483 | 14.5 |
| `don-quijote-doflamingo` | rare | 37543 | 31.9 % | 4778 | 16.2 |
| `edward-newgate-barbe-blanche` | legendaire | 17053 | 6.3 % | 819 | 17.2 |
| `hina` | commun | 39462 | 18.7 % | 3839 | 16.5 |
| `momonga` | commun | 39132 | 18.9 % | 3856 | 16.5 |
| `monkey-d-luffy` | legendaire | 15366 | 32.7 % | 2551 | 20.8 |
| `pica` | commun | 36866 | 28.3 % | 4698 | 15.5 |
| `portgas-d-ace` | rare | 43667 | 8.0 % | 2240 | 15.0 |
| `roronoa-zoro` | rare | 36634 | 22.8 % | 3983 | 18.9 |
| `sakazuki-akainu` | legendaire | 15575 | 28.4 % | 2237 | 19.1 |
| `sanji` | rare | 36515 | 23.2 % | 3939 | 18.7 |
| `tony-tony-chopper` | commun | 40175 | 14.5 % | 3341 | 19.5 |
| `usopp` | commun | 40259 | 14.8 % | 3469 | 19.3 |

### Par faction et palier de synergie

| Faction | Palier atteint | Équipes finales | Vague moyenne |
| --- | --- | --- | --- |
| `donkihote-kaizokudan` | aucun | 5435 | 18.8 |
| `donkihote-kaizokudan` | 2 | 532 | 10.9 |
| `donkihote-kaizokudan` | 3 | 4033 | 16.1 |
| `kaigun` | aucun | 6643 | 17.5 |
| `kaigun` | 2 | 1650 | 13.2 |
| `kaigun` | 4 | 1707 | 20.4 |
| `mugiwara-no-ichimi` | aucun | 6686 | 16.3 |
| `mugiwara-no-ichimi` | 2 | 1119 | 14.5 |
| `mugiwara-no-ichimi` | 4 | 2195 | 21.8 |
| `shirohige-kaizokudan` | aucun | 9516 | 17.4 |
| `shirohige-kaizokudan` | 2 | 356 | 13.8 |
| `shirohige-kaizokudan` | 3 | 128 | 18.2 |

## Bot `frontline`

### Par perso

Taux de recrutement = fois recruté / fois proposé. Vague moyenne = vagues gagnées quand le perso est dans l'équipe finale.

| Perso | Rareté | Proposé | Taux de recrutement | Équipes finales | Vague moyenne |
| --- | --- | --- | --- | --- | --- |
| `borsalino-kizaru` | rare | 22281 | 0.5 % | 1 | 8.0 |
| `diamante` | commun | 30676 | 7.3 % | 4074 | 9.7 |
| `diamond-joz` | commun | 22544 | 87.5 % | 9006 | 10.8 |
| `don-quijote-doflamingo` | rare | 22100 | 1.6 % | 4 | 8.3 |
| `edward-newgate-barbe-blanche` | legendaire | 6284 | 50.2 % | 1800 | 13.9 |
| `hina` | commun | 29546 | 27.0 % | 6388 | 10.3 |
| `momonga` | commun | 30306 | 15.2 % | 5208 | 10.0 |
| `monkey-d-luffy` | legendaire | 6448 | 39.6 % | 1655 | 11.9 |
| `pica` | commun | 24920 | 68.0 % | 8504 | 10.8 |
| `portgas-d-ace` | rare | 19650 | 42.9 % | 4490 | 11.5 |
| `roronoa-zoro` | rare | 21217 | 23.9 % | 3255 | 11.0 |
| `sakazuki-akainu` | legendaire | 6301 | 34.3 % | 1512 | 11.8 |
| `sanji` | rare | 20817 | 32.0 % | 3966 | 10.8 |
| `tony-tony-chopper` | commun | 30723 | 0.4 % | 32 | 8.4 |
| `usopp` | commun | 30877 | 0.0 % | 39 | 7.7 |

### Par faction et palier de synergie

| Faction | Palier atteint | Équipes finales | Vague moyenne |
| --- | --- | --- | --- |
| `donkihote-kaizokudan` | aucun | 6751 | 11.4 |
| `donkihote-kaizokudan` | 2 | 3249 | 9.7 |
| `donkihote-kaizokudan` | 3 | 0 | – |
| `kaigun` | aucun | 6103 | 11.3 |
| `kaigun` | 2 | 3897 | 10.0 |
| `kaigun` | 4 | 0 | – |
| `mugiwara-no-ichimi` | aucun | 8291 | 10.6 |
| `mugiwara-no-ichimi` | 2 | 1709 | 11.9 |
| `mugiwara-no-ichimi` | 4 | 0 | – |
| `shirohige-kaizokudan` | aucun | 4874 | 9.7 |
| `shirohige-kaizokudan` | 2 | 4620 | 11.3 |
| `shirohige-kaizokudan` | 3 | 506 | 17.2 |

## Bot `lookahead`

### Par perso

Taux de recrutement = fois recruté / fois proposé. Vague moyenne = vagues gagnées quand le perso est dans l'équipe finale.

| Perso | Rareté | Proposé | Taux de recrutement | Équipes finales | Vague moyenne |
| --- | --- | --- | --- | --- | --- |
| `borsalino-kizaru` | rare | 45820 | 44.5 % | 4510 | 20.2 |
| `diamante` | commun | 45562 | 9.8 % | 645 | 17.2 |
| `diamond-joz` | commun | 44751 | 13.4 % | 1395 | 19.5 |
| `don-quijote-doflamingo` | rare | 46693 | 44.2 % | 4024 | 19.8 |
| `edward-newgate-barbe-blanche` | legendaire | 20714 | 80.1 % | 5308 | 20.8 |
| `hina` | commun | 45430 | 8.0 % | 440 | 17.7 |
| `momonga` | commun | 45681 | 5.9 % | 345 | 17.4 |
| `monkey-d-luffy` | legendaire | 19894 | 83.2 % | 5742 | 20.8 |
| `pica` | commun | 43343 | 21.9 % | 1971 | 18.2 |
| `portgas-d-ace` | rare | 49279 | 37.6 % | 4302 | 19.8 |
| `roronoa-zoro` | rare | 42119 | 54.0 % | 6259 | 20.3 |
| `sakazuki-akainu` | legendaire | 20543 | 76.4 % | 5049 | 20.7 |
| `sanji` | rare | 46923 | 44.2 % | 4977 | 20.2 |
| `tony-tony-chopper` | commun | 41085 | 30.4 % | 4017 | 19.6 |
| `usopp` | commun | 44902 | 13.1 % | 1016 | 19.5 |

### Par faction et palier de synergie

| Faction | Palier atteint | Équipes finales | Vague moyenne |
| --- | --- | --- | --- |
| `donkihote-kaizokudan` | aucun | 8650 | 20.4 |
| `donkihote-kaizokudan` | 2 | 1144 | 18.4 |
| `donkihote-kaizokudan` | 3 | 206 | 18.0 |
| `kaigun` | aucun | 7303 | 20.0 |
| `kaigun` | 2 | 2666 | 20.4 |
| `kaigun` | 4 | 31 | 20.8 |
| `mugiwara-no-ichimi` | aucun | 2835 | 20.3 |
| `mugiwara-no-ichimi` | 2 | 5721 | 19.7 |
| `mugiwara-no-ichimi` | 4 | 1444 | 21.3 |
| `shirohige-kaizokudan` | aucun | 7039 | 20.0 |
| `shirohige-kaizokudan` | 2 | 2320 | 20.2 |
| `shirohige-kaizokudan` | 3 | 641 | 20.8 |

## Signaux d'alerte

Seuils : vague moyenne > ×1.25 de celle du bot (échantillon ≥ 30), mur > 50.0 % d'éliminations, vague trop facile < 0.5 % après la vague 3. Une corrélation n'est pas une cause : un perso légendaire arrive tard, donc surtout dans les parties déjà longues.

- Vague 4 : trop facile, 0.3 % d'éliminations.
- Vague 6 : trop facile, 0.4 % d'éliminations.
- Vague 26 : mur, 54.2 % des parties qui l'atteignent y sont éliminées.
- Vague 27 : mur, 61.4 % des parties qui l'atteignent y sont éliminées.
- Vague 28 : mur, 73.3 % des parties qui l'atteignent y sont éliminées.
- Bot `random` : `edward-newgate-barbe-blanche` dans l'équipe finale → 10.4 vagues en moyenne contre 8.3 (×1.25).
- Bot `random` : synergie `mugiwara-no-ichimi` palier 4 → 10.7 vagues en moyenne contre 8.3 (×1.28).
- Bot `synergy` : synergie `mugiwara-no-ichimi` palier 4 → 21.8 vagues en moyenne contre 17.3 (×1.26).
- Bot `frontline` : `edward-newgate-barbe-blanche` dans l'équipe finale → 13.9 vagues en moyenne contre 10.8 (×1.29).
- Bot `frontline` : synergie `shirohige-kaizokudan` palier 3 → 17.2 vagues en moyenne contre 10.8 (×1.59).

