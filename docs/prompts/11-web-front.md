# Tâche 11 — Front HTML/CSS jouable

Lis `CLAUDE.md`, `docs/cadrage.md` (sections 1, 3, 4, 7, 8 et 11) et `docs/regles-j1.md`. Les tâches 1 à 10 sont mergées.

Objectif : une partie complète jouable dans le navigateur (desktop), sans back, pour faire tester J1 et répondre à la question « est-ce fun ? ».

À faire :
1. Package `packages/web` : Vite + TypeScript, HTML/CSS. Pas de PixiJS en J1. Un framework UI seulement si ton plan démontre qu'il simplifie vraiment ; sinon DOM natif. Justifie chaque dépendance.
2. Le front **affiche** et **ne calcule rien** : tout passe par l'API du moteur (`createRun`, `applyChoice`) et par `data/exports/game.json` et `canon.json` pour les noms. Le combat est rejoué depuis le journal d'événements.
3. Écrans :
   - accueil : nouvelle partie (seed aléatoire, ou saisie pour rejouer), rappel des règles en une phrase ;
   - recrutement : 3 cartes + « aucun », remplacement quand l'équipe est pleine ;
   - placement : ligne avant / ligne arrière, au clic (glisser-déposer facultatif) ;
   - combat : cartes qui se percutent, chiffres de dégâts, morts, effets de compétence ; vitesse x1 / x2 et « passer » ;
   - fin de partie : vague atteinte, score, seed, bouton « copier la partie » (seed + choix en JSON) pour les retours des testeurs.
4. Cartes **typographiques** (cadrage §7) : nom, couleur de faction, icône d'archétype dessinée maison (SVG ou caractère), rareté, niveau de fusion, stats. **Aucune image officielle**, aucune police ou icône sous licence incompatible.
5. Mention permanente, visible sur chaque écran : « Fan game non officiel, non commercial, non affilié aux ayants droit ». Une page « À propos » avec les sources et licences (CC-BY-SA pour les textes issus de Fandom).
6. Le seul aléatoire du front : la génération de la seed d'une nouvelle partie. Tout le reste vient du moteur.
7. Docker : un service `web` (dev ou build statique servi localement), ports liés à `127.0.0.1`, conforme à `CLAUDE.md`. Documente aussi la commande sur l'hôte.
8. Tests :
   - unitaires sur l'adaptation journal → animations ;
   - un test bout en bout (Playwright, Chromium) qui joue une partie complète sur une seed fixe avec des choix scriptés et vérifie l'écran de fin et le score attendu (identique à `replay` du moteur).

Hors périmètre : back, comptes, classement, coffres et collection, mobile, PixiJS, sons.

Critères de fin :
- Une partie complète se joue dans Chromium et Firefox, de l'accueil à l'écran de fin.
- Le score affiché est égal au score de `replay(seed, choix)` (test bout en bout).
- Aucune image ni asset officiel dans le dépôt ; mention fan game présente partout.
- `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test`, `docker compose config` et la CI passent.

Commence par me proposer un plan. Ne code rien avant ma validation.
