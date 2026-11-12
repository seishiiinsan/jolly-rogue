# Tâche 6 — Règles chiffrées du prototype (J1)

Lis `CLAUDE.md` puis `docs/cadrage.md` (sections 1 à 5, 7, 8, 11 et 14), et `data/exports/canon.json`. Les tâches 1 à 5 sont mergées.

Objectif : écrire `docs/regles-j1.md`, la spécification chiffrée et complète du prototype J1. **Aucun code dans cette tâche.** Les tâches 7 à 11 implémentent ce document tel quel : tout ce qu'il ne tranche pas, l'agent du moteur devrait l'inventer, ce que `CLAUDE.md` interdit.

Déroulé obligatoire :
1. Rédige une **première version complète** de `docs/regles-j1.md`, en proposant une valeur pour chaque point ci-dessous. Marque d'un `**À valider**` chaque choix qui relève du game design plutôt que de la technique.
2. **Arrête-toi et attends ma validation.** Je trancherai les points marqués, tu intégreras mes réponses, puis tu ouvriras la PR.

Contenu attendu :
1. **Équipe et partie** : équipe de départ (1 ou 2 persos communs : lesquels, ou tirés comment), taille max 5, remplacement au 6e, recrutement facultatif (« aucun »), fin de partie.
2. **Persos** : liste des stats (PV, attaque, vitesse ou initiative, autres seulement si elles servent), archétypes (sabre, poing, tir… : quel effet en jeu), portée ou ligne préférée.
3. **Compétences** : un catalogue **fermé** d'effets (ex. dégâts de zone, soin, bouclier, étourdissement) et de déclencheurs (début de combat, toutes les N actions, à la mort…), paramétrables en données. Aucun script libre par perso.
4. **Raretés** : 3 niveaux, budget de stats par rareté, probabilités de tirage par vague (formule ou table).
5. **Fusion** : combien de copies par niveau, niveau max, effet chiffré d'un niveau.
6. **Placement et ciblage** : ligne avant / ligne arrière, règle de ciblage exacte (qui tape qui, égalités), ordre des actions, départage des égalités sans aléatoire caché.
7. **Combat** : déroulé tour par tour ou par « ticks », limite de durée et issue si elle est atteinte, ce qui est rendu au journal d'événements (pour le replay du front).
8. **Synergies** : factions = équipages canon (`crews.slug`), seuils (ex. 2 et 4 persos), bonus chiffrés. Au moins 3 factions jouables.
9. **Catalogue J1** : les 15 persos, avec leur slug **existant dans `canon.json`**, leur faction, leur rareté et leur archétype. Choisis des persos rapprochés des deux sources et bien renseignés ; répartis-les pour que chaque faction ait 3 à 5 membres.
10. **Ennemis et vagues** : composition des vagues, courbe de difficulté (formule), boss toutes les 10 vagues (lequel, quelles différences), vagues infinies.
11. **Score** : ce qui est compté (vague atteinte, autre ?), départage.
12. **Durée** : vérification chiffrée que la partie type dure 10 à 15 minutes (vagues atteintes × durée d'une vague à l'écran + temps de choix).
13. **Déterminisme** : uniquement des entiers (ou des arrondis définis explicitement) pour que le résultat soit identique partout ; ordre de consommation du RNG (une seule source seedée, tirages dans un ordre documenté).
14. **Format des données** : schéma des fichiers YAML de la tâche 7 (persos, compétences, ennemis, vagues, synergies), avec un exemple complet par fichier.
15. **Un exemple déroulé** : une vague complète, action par action, avec les calculs.
16. **Questions encore ouvertes** : ce que tu n'as pas pu trancher.

Hors périmètre : code, méta (coffres, collection), classement, visuels.

Critères de fin :
- `docs/regles-j1.md` couvre les 16 points, sans `**À valider**` restant.
- Chaque slug du catalogue existe dans `data/exports/canon.json` (vérifie-le et indique comment dans la PR).
- La section 14 du cadrage est mise à jour : les questions tranchées par ce document y sont marquées comme telles, avec un lien.

Commence par la première version du document, puis arrête-toi.
