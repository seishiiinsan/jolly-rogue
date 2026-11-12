# Jolly Rogue — Plan directeur jusqu'à la version 1.0

Document de référence pour les agents de code, du prototype à la version finale. Il complète
`docs/cadrage.md` (le « quoi » et le « pourquoi ») avec le « comment » et l'ordre de construction.

> **Ambition** : un auto-battler roguelike web qui soit, visuellement et mécaniquement, ce qu'on
> peut faire de mieux sans une seule image officielle. Des cartes typographiques qui ressemblent
> à des affiches de prime imprimées à la main, des combats chorégraphiés comme une planche de
> manga en mouvement, une mer vivante, une bande-son originale adaptative, une méta qui donne
> envie de revenir chaque jour, et un classement auquel on peut faire confiance.

---

## 0. Mode d'emploi pour l'agent de code

1. **`CLAUDE.md` prime sur ce document.** En cas de contradiction, applique `CLAUDE.md` et signale l'écart.
2. **Une tâche = une session = une branche = une PR.** Les tâches sont numérotées (`T05`, `T06`…). Ne déborde jamais de la tâche demandée, même si la suivante est « juste à côté ».
3. **Plan d'abord.** Chaque tâche commence par un plan (fichiers, choix techniques, dépendances justifiées), puis tu attends la validation.
4. **Les tâches `T05` à `T11` ont un prompt détaillé** dans `docs/prompts/`. Pour les suivantes, l'humain rédigera le prompt à partir de la fiche de ce document ; si on te donne directement une fiche, traite-la comme un prompt et applique le déroulé ci-dessus.
5. **Portes de jalon.** On ne commence pas un jalon tant que le précédent n'a pas passé sa porte (§12). En particulier : **rien après J1 tant que J1 n'est pas fun** (cadrage §11).
6. **Les valeurs de game design ne s'inventent pas.** Toute nouvelle mécanique passe d'abord par une mise à jour de `docs/regles-*.md` validée par l'humain, puis par l'implémentation.
7. **Si une fiche est ambiguë, pose la question.** Une fiche ambitieuse n'autorise jamais à improviser du périmètre.

---

## 1. Vision de la version finale

### 1.1 L'expérience en une minute

Tu ouvres le jeu : une mer animée à l'aquarelle numérique, un navire minuscule, le titre gravé
comme sur un vieux parchemin. « Nouvelle traversée ». Tu choisis ton capitaine parmi trois
affiches de prime. La carte de la Grand Line se déplie : des îles reliées par des routes, chacune
avec une icône (combat, taverne, marchand, tempête, Marine, trésor, boss d'arc). Tu tires une route.
Combat : tes cinq cartes s'avancent en deux lignes, l'ennemi surgit de la brume, les coups
s'enchaînent en rythme, les chiffres claquent façon onomatopées manga, un Haki des rois fait
vibrer l'écran et tomber les sbires ennemis. Victoire : trois affiches de prime glissent sur la
table, tu en recrutes une, qui fusionne avec ton second et passe au niveau 2 dans une gerbe
d'encre dorée. Vingt minutes plus tard, Barbe Noire t'arrête à la vague 34. Ta prime finale
s'imprime : 1,2 milliard. 14e du classement du jour. Le coffre s'ouvre : une carte légendaire
holographique, Shanks, que tu n'avais pas.

### 1.2 Piliers

| Pilier | Ce qu'il impose |
| --- | --- |
| **Décisions lisibles** | Chaque choix (recrue, placement, route, relique) a des conséquences visibles et explicables : aperçu des synergies, journal de combat consultable, simulation « et si ». |
| **Spectacle** | Le combat automatique est un spectacle : chorégraphie, rythme, effets, son. Le joueur doit avoir envie de le regarder, pas de le passer. |
| **Rejouabilité** | Carte procédurale, reliques, événements, mutateurs, modes : deux parties ne se ressemblent pas. |
| **Équité** | La collection ne donne aucun avantage. Le classement repose sur un rejeu serveur. Un même défi quotidien pour tous. |
| **Respect du lore** | Les faits viennent de `canon` (pipeline) ; les persos se comportent comme dans l'œuvre (Zoro à trois sabres, Usopp tireur à l'arrière, Chopper soigneur). |
| **Légalité et éthique** | Aucun asset officiel, non commercial, aucune mécanique prédatrice (pas de FOMO payant, pas de loot box payante, pas de dark pattern). |

---

## 2. Contraintes non négociables

- **Aucune image, musique, police, logo ni son officiel**, ni extrait, ni « inspiré trop près ». Le Jolly Roger de chaque équipage est **généré** par un éditeur maison (crâne, os, chapeau, ornements) et n'imite pas le dessin officiel. Toute police, icône ou son tiers a une licence compatible (OFL, CC0, CC-BY avec attribution), listée dans `docs/licences.md`.
- **Non commercial** : ni publicité, ni achat, ni don conditionnant du contenu.
- **Mention fan game** visible partout, page « À propos » avec sources et licences (CC-BY-SA pour les textes issus de Fandom).
- **Moteur déterministe** : même seed + mêmes choix = même partie, au bit près, sur tous les navigateurs et sur le serveur. Entiers uniquement, RNG seedé injecté, aucun `Math.random` / `Date` dans `packages/engine`.
- **Le client n'est jamais cru** : il envoie la seed et ses choix, le serveur rejoue.
- **Données de lore ≠ données de jeu** : `canon` via le pipeline, stats et compétences écrites à la main dans `packages/game-data`.
- **Accessibilité** : jouable au clavier, contrastes AA, option « réduire les animations », daltonisme pris en compte dans les couleurs de faction.
- **RGPD** dès qu'il y a des comptes : minimisation, export et suppression des données, pas de traceur tiers.

---

## 3. Architecture cible

```
packages/
  db/            Schémas Drizzle (canon, raw, staging, puis app : joueurs, parties, collection…)
  data-pipeline/ Collecte et réconciliation du lore → data/exports/canon.json
  game-data/     Données de jeu écrites à la main (YAML → game.json validé contre canon)
  engine/        Moteur pur, déterministe : combat, partie, carte, reliques, événements, score
  sim/           Bots, équilibrage, détection de stratégies dominantes
  renderer/      Rendu PixiJS du combat et de la carte, piloté par le journal d'événements
  audio/         Moteur audio adaptatif (Web Audio), piloté par les mêmes événements
  ui/            Design system : composants, tokens, thèmes, accessibilité
  web/           Application joueur (écrans, routage, état client, PWA)
  server/        API Fastify : comptes, parties, rejeu, classements, coffres, collection
  workers/       Rejeu asynchrone, calcul des classements, saisons, nettoyage
  admin/         Back-office : modération, équilibrage en direct, événements, tableaux de bord
  tools/         Éditeur de persos et de Jolly Rogers, visualiseur de journaux, outils de contenu
```

Principes :
- **Le journal d'événements est le contrat central.** Le moteur le produit ; le rendu, l'audio, le replay, les statistiques et le spectateur le consomment. Il est versionné (`eventLogVersion`).
- **Le moteur est la seule source de vérité des règles**, partagé tel quel entre navigateur, serveur, simulateur et outils.
- **Chaque couche se teste seule** : le moteur sans rendu, le rendu sur des journaux enregistrés (tests visuels), le serveur avec des parties générées par le simulateur.

---

## 4. Direction artistique et graphismes

### 4.1 Identité visuelle

- **Thème « carnet de bord et affiche de prime »** : papier vieilli, encre, tampons, cartes marines, gravure. Une palette par mer (East Blue lumineux, Grand Line saturé, Nouveau Monde sombre et électrique).
- **Cartes de perso typographiques**, entièrement procédurales :
  - format affiche de prime : « WANTED », nom en grande capitale à empattement, épithète, prime en berries, tampon de faction ;
  - fond généré : texture papier (bruit procédural), motif de faction (vagues, flammes, éclairs, fleurs…), Jolly Roger maison en filigrane ;
  - cadre par rareté (commun bois, rare laiton, légendaire or animé) et cadres cosmétiques de collection (holographique, encre vivante, édition de saison) ;
  - **portrait typographique** : silhouette abstraite composée de glyphes et formes géométriques propre à chaque archétype (aucun dessin de personnage) ; plus tard, si l'option B/C du cadrage est retenue, des illustrations originales.
- **Typographie** : une police d'affiche et une police de texte sous licence OFL, plus des onomatopées dessinées en SVG maison pour les impacts.
- **Iconographie maison** : archétypes (sabre, poing, tir, jambe, soin, savoir, navigation), types de fruit (paramecia, zoan, logia), haki (observation, armement, rois), reliques. Un seul style de trait, exporté en atlas.

### 4.2 Rendu du combat (PixiJS v8, WebGL/WebGPU)

- **Scène** : un pont de navire ou une plage selon l'île, en couches parallaxes ; mer en shader (vagues, écume, reflets) ; météo (pluie, brume, tempête, neige de Drum) et cycle jour/nuit.
- **Chorégraphie pilotée par le journal** : chaque événement a une animation (déplacement, élan, impact, recul, esquive, mort) ; un **directeur de combat** regroupe les événements en « temps forts » (combo, coup critique, compétence ultime) pour rythmer la scène au lieu de tout jouer à la même cadence.
- **Effets** :
  - impacts : flashs, lignes de vitesse manga, onomatopées animées, chiffres qui rebondissent ;
  - fruits : effets par type (logia = particules élémentaires et transformation du corps de la carte ; zoan = déformation et ombre de la forme animale ; paramecia = effet propre à la compétence) ;
  - haki : observation (ralenti et contour lumineux), armement (cartes qui s'assombrissent en métal), rois (onde de choc, éclairs noirs et rouges, sbires qui s'évanouissent) ;
  - morts : la carte se déchire ou brûle, l'encre coule.
- **Caméra** : zoom sur les temps forts, tremblement d'écran proportionnel à l'impact, ralenti sur le coup final d'un boss.
- **Lisibilité avant tout** : barres de vie et statuts toujours lisibles, mode « tactique » sans effets, journal textuel synchronisé et consultable après le combat.
- **Performance** : 60 i/s sur un portable de milieu de gamme, budget de particules, atlas de textures, pooling d'objets, dégradation automatique de la qualité, mesure en CI (scénarios de référence).
- **Option « réduire les animations »** : pas de tremblement, transitions en fondu, effets réduits.

### 4.3 Carte de navigation

- Carte de la Grand Line générée par seed : îles reliées par des routes, style carte marine annotée à la plume, brouillard sur les zones non explorées, navire qui avance, courants et tempêtes animés.
- Chaque arc ou saga a son biome (sagas de `canon`) : couleurs, météo, musique et ennemis propres.

### 4.4 Interface

- Design system (`packages/ui`) : tokens (couleurs, espacements, typographie), thèmes par mer, composants accessibles.
- Motion design : transitions entre écrans « page qui tourne », cartes qui glissent sur une table, tampons qui s'impriment.
- Infobulles riches : survol d'une synergie = aperçu chiffré, survol d'un perso = fiche, comparaison avant/après recrutement.
- Responsive desktop (1280 à 4K) ; tablette en paysage après la 1.0.

---

## 5. Audio

- **Musique originale** (composition maison ou licence CC compatible), **adaptative** : couches qui s'ajoutent avec l'intensité du combat, thème par mer, thème de boss, jingles de victoire, de fusion et de légendaire.
- **Sound design** : impacts par archétype (lame, poing, tir), fruits, haki, mer, foule de taverne, tampon, papier. Banque de sons maison ou CC0.
- **Moteur audio** (`packages/audio`, Web Audio API) : piloté par le journal d'événements comme le rendu, mixage dynamique (le son ne sature jamais lors des combos), réglages séparés musique / effets / interface.

---

## 6. Systèmes de jeu (version finale)

Chaque système ci-dessous est d'abord spécifié et chiffré dans un `docs/regles-*.md` validé par l'humain, puis implémenté dans le moteur, testé par le simulateur, enfin rendu.

### 6.1 Boucle de partie complète

1. Choix du capitaine (3 proposés), qui donne un bonus passif à toute la partie.
2. Carte de la mer en cours : choix d'une route parmi 2 ou 3.
3. Nœud de la route : combat, élite, boss d'arc, taverne (recrutement), marchand (reliques contre berries de partie), événement narratif, chantier naval (amélioration du navire), trésor, tempête (risque contre récompense).
4. Après un combat : recrutement 1 parmi 3, berries de partie, parfois une relique.
5. Fin d'une mer : boss, puis passage à la mer suivante (East Blue → Paradise → Nouveau Monde → mode infini).
6. Défaite : prime finale (score), coffre selon la profondeur.

### 6.2 Combat

- Deux lignes, ciblage déterministe, vitesse et initiative, compétences du catalogue fermé (étendu à chaque jalon).
- Statuts : saignement, brûlure, gel, étourdissement, peur, provocation, bouclier, contre-attaque, esquive.
- **Haki** : jauge qui se remplit pendant le combat ; observation (esquive garantie), armement (perce les logia et les boucliers), rois (étourdit les ennemis de niveau inférieur, réservé aux persos qui l'ont dans `canon.haki`).
- **Fruits du démon** : les porteurs (d'après `canon.character_fruits`) ont une compétence liée au type de fruit ; faiblesse à l'eau pour les combats en mer (événements tempête).
- Interactions de rôles : tank, combattant, tireur, soigneur, soutien, navigateur (bonus sur la carte), cuisinier (soin entre les combats).

### 6.3 Synergies

- **Factions** : équipages canon (Chapeau de paille, Barbe Blanche, Big Mom, Marine, Révolutionnaires, CP9…), avec seuils et bonus chiffrés.
- **Traits transverses** : porteurs de fruit, épéistes, Supernovae, Shichibukai, Empereurs, liens de lore (frères, mentor et élève) tirés de `canon` ou annotés à la main.
- **Écran de synergies** : progression des seuils, aperçu « si je recrute X ».

### 6.4 Reliques et navire

- **Reliques** (trésors) : effets passifs pour la partie (« Log Pose : voir un nœud de plus », « Poneglyphe : +1 choix de recrue »…), raretés, combinaisons.
- **Navire** : pièces améliorables au chantier (coque = PV d'équipe en tempête, voiles = vitesse sur la carte, canons = dégâts d'ouverture de combat).

### 6.5 Économie de partie

- Berries de partie, gagnées aux combats, dépensées chez le marchand, à la taverne (relancer l'offre) et au chantier. **Elles n'existent que dans la partie** ; rien ne s'achète hors partie.

### 6.6 Difficulté et modes

- **Niveaux de prime** (difficulté croissante façon « ascension ») : chaque niveau ajoute un mutateur (ennemis plus rapides, moins de soin, boss supplémentaire…). Débloqués en jouant.
- **Modes** :
  - **Traversée** : mode principal, seed libre ;
  - **Défi du jour** : même seed et mêmes mutateurs pour tous, une tentative classée par jour ;
  - **Défi de la semaine** : règles spéciales (« équipage Marine uniquement », « aucun porteur de fruit »…) ;
  - **Infini** : après le Nouveau Monde, jusqu'à la défaite ;
  - **Draft** : recrutement en début de partie, puis plus de taverne ;
  - **Abordage asynchrone** : combattre l'équipe fantôme enregistrée d'un autre joueur (rejouée par le moteur, sans temps réel), classement dédié.

---

## 7. Méta, collection et social

- **Collection** (cadrage §5) : cartes de collection séparées du jeu, coffres de fin de partie selon la profondeur, doublons → fragments, carte au choix contre fragments, légendaire garantie au bout de N coffres.
- **Codex** : fiche de lore par perso alimentée par `canon` (équipages, fruits, primes historiques, première apparition), attribution CC-BY-SA, déblocage par collection.
- **Cosmétiques** : cadres, dos de carte, Jolly Rogers de profil (éditeur maison), thèmes de table ; tous gagnés en jouant.
- **Succès** : compléter un équipage, gagner une partie sans porteur de fruit, atteindre la vague 50…
- **Profil** : vitrine de cartes, Jolly Roger, statistiques, historique de parties avec replay.
- **Saisons** (par arc de l'œuvre) : thème visuel, défis, cosmétiques de saison ; jamais d'avantage en jeu.
- **Partage** : lien de replay (seed + choix) jouable par n'importe qui dans le visualiseur, image de fin de partie générée (affiche de prime avec le score) pour les réseaux.

---

## 8. Compétition et anti-triche

- Le client envoie `{ seed, version moteur, choix }` ; le serveur rejoue dans un worker, calcule le score et la profondeur, et rejette toute incohérence.
- Version du moteur et des données épinglée par partie ; les classements sont cloisonnés par version d'équilibrage.
- Classements : du jour, de la semaine, de la saison, par mode, entre amis.
- Détection : parties impossibles (rejet), temps de jeu aberrant, comptes multiples, signalement des pseudos.
- Coffres tirés côté serveur avec un RNG séparé (cadrage §8).

---

## 9. Contenu et outils

- **Catalogue** : 15 persos en J1, 60 en bêta, 150+ en 1.0, chaque perso validé contre `canon`.
- **Assistant de création** : à partir de `canon` (prime, fruit, haki, équipage, statut), l'outil **propose** un brouillon de stats et de compétences ; le game designer tranche et l'écrit dans `game-data`. Rien n'est généré automatiquement en production.
- **Éditeur de persos** (`packages/tools`) : formulaire + aperçu de la carte + simulation immédiate contre un panel d'équipes.
- **Éditeur de Jolly Rogers** : formes vectorielles maison pour les factions et les profils.
- **Visualiseur de journaux** : rejouer n'importe quelle partie pas à pas, inspecter l'état, comparer deux versions du moteur.
- **Pipeline d'équilibrage** : le simulateur tourne en CI sur chaque PR de `game-data` et commente les écarts (taux de victoire par perso, synergie dominante).
- **Qualité des données** : réduire les 162 pages en attente et les conflits du rapport du pipeline, au fil des persos ajoutés au catalogue.

---

## 10. Qualité, performance, accessibilité, langues

- Tests : unitaires, propriétés (déterminisme), golden tests de journaux, tests visuels du rendu (captures sur journaux de référence), bout en bout Playwright, tests de charge du serveur de rejeu.
- Performance : budget de bundle, chargement initial < 3 s, 60 i/s en combat, rejeu serveur < 50 ms par partie.
- Accessibilité : clavier complet, lecteur d'écran sur les écrans de décision, contrastes AA, palettes compatibles daltonisme, réduction des animations.
- Langues : français et anglais (noms FR/EN déjà dans `canon`), toutes les chaînes externalisées.
- PWA : installation, cache hors ligne du mode Traversée.

---

## 11. Exploitation, légal, RGPD

- Hébergement sobre : un VPS ou un PaaS, Docker Compose en production, PostgreSQL sauvegardé, budget mensuel suivi.
- Observabilité : logs structurés, métriques, alertes, tableau de bord (parties jouées, rejeux rejetés, erreurs front).
- Analytique respectueuse : agrégats anonymes de choix pour l'équilibrage, sans traceur tiers, documentés.
- RGPD : connexion par lien magique ou fournisseur OAuth, données minimales, export et suppression en libre-service, politique de confidentialité.
- Modération : pseudos filtrés, signalements, outil d'administration.
- Procédure de retrait : si les ayants droit le demandent, le jeu passe en maintenance en une commande ; l'option B/C (persos originaux) est documentée.

---

## 12. Jalons et tâches

Chaque jalon se termine par une **porte** : on ne passe pas au suivant sans l'avoir franchie.

### J1 — Prototype local : « est-ce fun ? »

Prompts détaillés dans `docs/prompts/` pour T05 à T11 ; T12 est une fiche :

| Tâche | Objet |
| --- | --- |
| T05 | Lint et CI |
| T06 | Règles chiffrées J1 (`docs/regles-j1.md`) |
| T07 | Données de jeu et validation contre le canon |
| T08 | Moteur : RNG seedé et combat |
| T09 | Moteur : partie complète |
| T10 | Simulateur d'équilibrage |
| T11 | Front HTML/CSS jouable |
| T12 | **Playtest J1** : build statique partagé à 5–10 testeurs, formulaire de retours, export des parties (seed + choix), synthèse dans `docs/playtests/j1.md` |

**Porte J1** : au moins 5 testeurs ont joué 3 parties ou plus ; une majorité veut relancer une partie sans qu'on le lui demande ; aucune stratégie dominante dans le simulateur. Si la porte échoue : itérer sur les règles (T06 bis), et envisager d'avancer la carte de navigation et les reliques (J5) avant toute partie serveur.

### J2 — Compétition : des scores fiables

| Tâche | Objectif | Critères de fin |
| --- | --- | --- |
| T13 | **Serveur Fastify** (`packages/server`) : squelette, santé, config, service Docker | Démarre via `docker compose`, tests verts |
| T14 | **Schéma applicatif** : joueurs anonymes (jeton), parties, choix, résultats | Migrations Drizzle, aucune donnée personnelle |
| T15 | **Rejeu serveur** (`packages/workers`) : file de parties, rejeu par le moteur, rejet des incohérences | 1 000 parties générées par le simulateur rejouées sans écart ; partie trafiquée rejetée |
| T16 | **Défi du jour** : seed quotidienne, une tentative classée, envoi depuis le front | Même seed pour tous, tentative unique garantie côté serveur |
| T17 | **Classements** : jour, semaine, pagination, version d'équilibrage | Classement reproductible à partir des parties stockées |
| T18 | **Front compétition** : écran de classement, envoi de la partie, statut du rejeu | Bout en bout : partie jouée → classée |

**Porte J2** : aucune partie trafiquée ne passe (tests d'attaque scriptés), rejeu < 50 ms par partie.

### J3 — Méta : une raison de revenir

| Tâche | Objectif | Critères de fin |
| --- | --- | --- |
| T19 | **Comptes** : lien magique, pseudo, rattachement des parties anonymes, export et suppression RGPD | Parcours complet testé, politique de confidentialité |
| T20 | **Collection** : cartes de collection, coffres serveur, fragments, anti-malchance (règles dans `docs/regles-meta.md`) | Coffres tirés côté serveur ; garantie de légendaire testée |
| T21 | **Codex** : fiches de lore depuis `canon`, attribution CC-BY-SA, déblocage | Chaque fiche cite ses sources |
| T22 | **Succès et profil** : vitrine, statistiques, historique avec replay | Succès calculés depuis les parties rejouées |
| T23 | **Front méta** : ouverture de coffre, collection, codex, profil | Bout en bout testé |

**Porte J3** : rétention mesurée sur les testeurs (retour à J+1 et J+7) ; aucun avantage en jeu lié à la collection (test).

### J4 — Spectacle : le jeu devient beau

| Tâche | Objectif | Critères de fin |
| --- | --- | --- |
| T24 | **Direction artistique** : `docs/direction-artistique.md`, planches de référence maison, palette par mer, typographies sous licence, `docs/licences.md` | Validée par l'humain, aucune référence officielle |
| T25 | **Design system** (`packages/ui`) : tokens, thèmes, composants accessibles, motion | Storybook ou équivalent, tests d'accessibilité |
| T26 | **Cartes procédurales** : affiche de prime, textures, cadres par rareté, portraits typographiques par archétype | Rendu identique pour une même carte, captures de référence |
| T27 | **Générateur de Jolly Rogers** maison (`packages/tools`) | Un emblème par faction J1, export SVG |
| T28 | **Renderer PixiJS** (`packages/renderer`) : scène, cartes, déplacements, impacts, piloté par le journal | Rejoue tous les journaux de référence ; 60 i/s mesurés |
| T29 | **Directeur de combat** : temps forts, caméra, ralentis, onomatopées, mode tactique | Tests visuels sur journaux de référence |
| T30 | **Effets de fruits et de haki** (shaders, particules), budget de performance | 60 i/s tenus avec les effets, option « réduire les animations » |
| T31 | **Mer, météo, jour/nuit, parallaxe** | Qualité dégradée automatiquement sur machine modeste |
| T32 | **Audio** (`packages/audio`) : moteur adaptatif, banque de sons maison/CC0, musique originale | Réglages de volume, aucun son sans licence listée |
| T33 | **Motion design de l'interface** : transitions, recrutement, fusion, coffre | Respecte « réduire les animations » |

**Porte J4** : 60 i/s sur la machine de référence, tests visuels stables, `docs/licences.md` complet et relu.

### J5 — Grand Line : profondeur et rejouabilité

| Tâche | Objectif | Critères de fin |
| --- | --- | --- |
| T34 | **Règles étendues** : `docs/regles-v1.md` (carte, nœuds, reliques, navire, haki, statuts, niveaux de prime) | Validé par l'humain |
| T35 | **Moteur : carte de navigation** procédurale et nœuds | Déterministe, couvert par le simulateur |
| T36 | **Moteur : reliques, marchand, berries de partie, navire** | Simulateur : aucune relique dominante |
| T37 | **Moteur : haki, statuts, fruits en combat** | Golden tests mis à jour, versions de journal gérées |
| T38 | **Événements narratifs** (taverne, tempête, Marine…) écrits en données | Éditables sans code |
| T39 | **Niveaux de prime et modes** (Infini, Draft, Défi de la semaine avec mutateurs) | Chaque mode classé séparément |
| T40 | **Rendu de la carte** : carte marine animée, brouillard, navire, biomes par saga | 60 i/s |
| T41 | **Catalogue 60 persos**, assistant de création depuis `canon`, CI d'équilibrage sur les PR de `game-data` | Simulateur vert, chaque slug validé |
| T42 | **Abordage asynchrone** : équipes fantômes enregistrées, combat rejoué, classement dédié | Rejeu serveur identique |

**Porte J5** : simulateur sans stratégie dominante sur tous les modes ; partie moyenne de 15 à 25 minutes en Traversée.

### J6 — Bêta publique

| Tâche | Objectif | Critères de fin |
| --- | --- | --- |
| T43 | **Production** : hébergement, Docker Compose de prod, sauvegardes, domaine, TLS | Restauration de sauvegarde testée |
| T44 | **Observabilité et alertes** | Tableau de bord, alertes sur erreurs et rejeux rejetés |
| T45 | **Modération et administration** (`packages/admin`) | Signalements traités de bout en bout |
| T46 | **Accessibilité et langues** : audit, FR/EN complet | Audit sans bloquant |
| T47 | **PWA et performance** : installation, cache hors ligne, budgets en CI | Budgets respectés |
| T48 | **Page légale, procédure de retrait, mentions** | Relu par l'humain |
| T49 | **Bêta ouverte** : annonce, canal de retours, suivi des métriques | Bêta ouverte, retours triés |

**Porte J6** : une semaine de bêta sans incident bloquant ; retours majoritairement positifs sur le fun.

### J7 — Version 1.0 et vie du jeu

| Tâche | Objectif |
| --- | --- |
| T50 | Catalogue 150+ persos, toutes les sagas en biomes |
| T51 | Saisons par arc : thèmes, défis, cosmétiques |
| T52 | Partage : liens de replay jouables, images de fin de partie générées |
| T53 | Classements entre amis, profils publics |
| T54 | Équilibrage en continu : rapports hebdomadaires du simulateur et des parties réelles |
| T55 | Option B/C : pipeline d'illustrations originales (si le jeu prend) |

---

## 13. Risques propres à l'ambition

| Risque | Parade |
| --- | --- |
| Le spectacle dévore le temps avant que le jeu soit fun | Portes de jalon strictes ; J4 seulement après J1 à J3 |
| Visibilité accrue = risque de retrait accru | Aucun asset officiel, procédure de retrait prête, option B/C documentée |
| Moteur trop complexe pour rester déterministe | Entiers, RNG unique, golden tests, rejeu serveur en CI à chaque PR du moteur |
| Contenu impossible à équilibrer à 150 persos | Simulateur en CI, catalogue en données, ajouts par lots |
| Performance du rendu sur machines modestes | Budgets mesurés en CI, qualité adaptative, mode tactique |
