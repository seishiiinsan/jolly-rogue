# @jolly-rogue/web

Front jouable du prototype J1 : Vite + TypeScript, HTML/CSS et DOM natif (pas de framework, pas de PixiJS).
Aucun back : une partie se joue entièrement dans le navigateur.

Le front **affiche et ne calcule rien** :

- les règles passent par l'API du moteur (`createRun`, `applyChoice`, `teamCombatants`, `teamSynergies`) ;
- le combat est rejoué depuis le journal d'événements (`src/timeline.ts`) ;
- les données viennent de `data/exports/game.json` ; les noms affichés sont résolus au build depuis
  `data/exports/canon.json` (module virtuel `virtual:canon-names`, voir `vite.config.ts`) ;
- son seul aléatoire est la seed d'une nouvelle partie.

## Commandes

Sur l'hôte, serveur de dev sur http://127.0.0.1:5173 :

```bash
pnpm --filter @jolly-rogue/web dev
```

Build statique (`packages/web/dist`, chemins relatifs : se dépose tel quel sur n'importe quel hébergement statique) :

```bash
pnpm --filter @jolly-rogue/web build
```

Dans Docker, build statique servi par nginx sur http://127.0.0.1:8081 (`WEB_PORT` dans `.env` pour changer) :

```bash
docker compose up -d --build web
```

Tests unitaires (adaptation journal → animations) :

```bash
pnpm --filter @jolly-rogue/web test
```

Test de bout en bout (Playwright, Chromium) : une partie complète sur une seed fixe, score comparé au `replay` du moteur. La première fois : `pnpm --filter @jolly-rogue/web exec playwright install chromium`.

```bash
pnpm --filter @jolly-rogue/web e2e
```

## Écrans

| Écran | Contenu |
| --- | --- |
| Accueil | Menu sur décor marin : nouvelle traversée (seed aléatoire), rejouer une seed, collection, à propos ; meilleur score |
| Partie | Prochaine vague, équipage sur deux lignes, synergies ; recrutement (3 cartes + « Aucun », remplacement si l'équipe est pleine) puis placement (clic sur un pirate, puis « changer de ligne » ou clic sur un autre pour échanger) |
| Combat | Rejeu du journal : cartes qui avancent, dégâts, boucliers, morts ; ×1 / ×2 / « Passer » ; journal textuel |
| Collection | Cartes découvertes ou non par rareté, fragments, carte au choix contre fragments |
| Fin | Coffre de fin de partie, vagues gagnées, score, seed, « Copier la partie » (seed + choix en JSON, à joindre aux retours de playtest) |
| À propos | Mention fan game, sources et licences (CC BY-SA pour le One Piece Wiki) |

## Décor et portraits

- Décor (`src/scene.ts`, `src/styles.css`) : ciel, soleil, nuages, îles, mer animée, navire et ponts en bois, entièrement en SVG/CSS maison. L'ambiance change avec la partie : jour, crépuscule après la vague 10, nuit après la vague 20, tempête sur les vagues de boss. `prefers-reduced-motion` coupe les animations.
- Portraits (`src/portrait.ts`) : silhouettes de pirate **génériques et originales**, une par archétype, teintées par la faction, avec le monogramme du nom. Ce ne sont pas des représentations des personnages de l'œuvre : aucun visuel officiel ni approchant (cadrage §7).

## Collection (provisoire)

`src/collection.ts` : collection **locale au navigateur** (`localStorage`), sans aucun effet en partie. Un coffre par traversée d'au moins une vague gagnée, doublons convertis en fragments, carte au choix contre fragments, légendaire garantie au 10ᵉ coffre sans en avoir eu. Les coffres utilisent un aléatoire distinct de celui de la partie.

C'est une avance sur J3 : les valeurs (`COLLECTION_RULES`) sont des propositions à valider dans `docs/regles-meta.md`, et les coffres devront être tirés côté serveur (cadrage §8) dès qu'il y aura des comptes.

## Dépendances

- `vite` : serveur de dev et build ; aucun framework UI, le jeu tient en quelques écrans rendus par gabarits de chaînes.
- `@playwright/test` : test de bout en bout. Version épinglée (1.63.0) pour correspondre au Chromium préinstallé des sessions cloud.

## Assets

Aucune image, police ni icône tierce : polices système, icônes d'archétype en SVG dessinées pour le jeu (`src/content.ts`), couleurs et motifs de faction maison.
