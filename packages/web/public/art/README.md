# Illustrations locales (non commitées)

Ce dossier accueille **tes propres fichiers**. Tout ce qui s'y trouve, sauf ce README, est ignoré par
Git : rien n'est commité ni publié. Le dépôt ne fournit aucune image, et aucune n'est téléchargée
par le projet. Tu es responsable des droits sur ce que tu y déposes ; si le jeu est un jour publié,
ce dossier doit rester vide ou ne contenir que des illustrations originales (cadrage §7).

Formats acceptés : `.webp`, `.png`, `.jpg`, `.jpeg`, `.avif`.

## Portraits : `portraits/<clé>.<ext>`

La clé est le slug du perso (`packages/game-data/game/characters.yaml`) ou l'id de l'ennemi
(`enemies.yaml`). Exemples : `portraits/roronoa-zoro.webp`, `portraits/matelot.png`, `portraits/boss-lucci.jpg`.

- Cadrage conseillé : buste centré, format paysage 4:3 (ex. 480 × 360). L'image est recadrée pour remplir le cadre.
- Sans fichier, la carte garde sa silhouette générique.

## Décors : `backgrounds/home.<ext>` et `backgrounds/combat.<ext>`

- `home` : fond des écrans hors combat (accueil, partie, collection). Conseillé : 1920 × 1080.
- `combat` : fond de la scène de combat. Conseillé : 1280 × 720, sujet sombre, peu de détails au centre.

Après avoir ajouté ou retiré un fichier, relance le serveur de dev (ou refais le build).
