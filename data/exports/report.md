# Rapport du pipeline de données

Généré par `pipeline report`. Ne pas éditer à la main.

## Sources

| Source | URL | Licence |
| --- | --- | --- |
| api-onepiece | https://api.api-onepiece.com | **inconnue** (aucune licence déclarée) |

## Comptes par table

| Table | Lignes |
| --- | --- |
| raw.responses | 12 |
| staging.api_onepiece | 2670 |
| staging.rejections | 2 |
| canon.characters | 785 |
| canon.character_aliases | 0 |
| canon.character_affiliations | 737 |
| canon.character_fruits | 179 |
| canon.bounties | 140 |
| canon.haki | 0 |
| canon.crews | 149 |
| canon.devil_fruits | 213 |
| canon.locations | 128 |
| canon.sagas | 10 |
| canon.arcs | 50 |
| canon.external_ids | 1335 |
| canon.provenance | 6326 |

## Lignes rejetées par Zod (2)

| Source | Ressource | Langue | Id | Erreurs |
| --- | --- | --- | --- | --- |
| api-onepiece | characters | en | 256 | size: taille non reconnu(e) : "352cl" |
| api-onepiece | characters | fr | 256 | size: taille non reconnu(e) : "352cl" |

## Anomalies de chargement api-onepiece (102)

### Équipages de type `other` (non déductible du nom) (67)

| Entité | Id | Nom | Détail |
| --- | --- | --- | --- |
| crews | 17 | Primate League | type non déductible du nom : `other` |
| crews | 28 | Thriller Bark | type non déductible du nom : `other` |
| crews | 48 | Faux Equipage du Chapeau de Paille | type non déductible du nom : `other` |
| crews | 60 | XXX Gym Martial Arts Alliances | type non déductible du nom : `other` |
| crews | 78 | Baroque Works | type non déductible du nom : `other` |
| crews | 79 | Royaume de Luvneel | type non déductible du nom : `other` |
| crews | 83 | Dragon Célestes | type non déductible du nom : `other` |
| crews | 84 | Bigaro | type non déductible du nom : `other` |
| crews | 86 | Royaume de Tontatta | type non déductible du nom : `other` |
| crews | 87 | Armarda du Chapeau de Paille | type non déductible du nom : `other` |
| crews | 88 | Baggy's Delivery | type non déductible du nom : `other` |
| crews | 89 | Buggy's Delivery | type non déductible du nom : `other` |
| crews | 90 | Cipher Pol | type non déductible du nom : `other` |
| crews | 91 | Enies Lobby | type non déductible du nom : `other` |
| crews | 92 | Impel Down | type non déductible du nom : `other` |
| crews | 93 | Royaume de Goa | type non déductible du nom : `other` |
| crews | 94 | Village de Shimotsuki | type non déductible du nom : `other` |
| crews | 95 | Archipel des Argao | type non déductible du nom : `other` |
| crews | 96 | Île des animaux étranges | type non déductible du nom : `other` |
| crews | 97 | Archipel des Gecko | type non déductible du nom : `other` |
| crews | 98 | Baratie | type non déductible du nom : `other` |
| crews | 99 | Archipel Conomi | type non déductible du nom : `other` |
| crews | 100 | Loguetown | type non déductible du nom : `other` |
| crews | 101 | Royaume de Lvneel | type non déductible du nom : `other` |
| crews | 102 | Baterilla | type non déductible du nom : `other` |
| crews | 103 | Royaume maléfique de Black Drum | type non déductible du nom : `other` |
| crews | 104 | Ohara | type non déductible du nom : `other` |
| crews | 105 | Pays des fleurs | type non déductible du nom : `other` |
| crews | 106 | Reverse Mountain | type non déductible du nom : `other` |
| crews | 107 | Île aux cactus | type non déductible du nom : `other` |
| crews | 108 | Little Garden | type non déductible du nom : `other` |
| crews | 109 | Île de Drum | type non déductible du nom : `other` |
| crews | 110 | Alabasta | type non déductible du nom : `other` |
| crews | 111 | Long Ring Long Land | type non déductible du nom : `other` |
| crews | 112 | Source de l'insouciance | type non déductible du nom : `other` |
| crews | 113 | Water Seven | type non déductible du nom : `other` |
| crews | 114 | Archipel des Sabaody | type non déductible du nom : `other` |
| crews | 115 | Archipel de Boing | type non déductible du nom : `other` |
| crews | 116 | Erbaf | type non déductible du nom : `other` |
| crews | 117 | Pays des Wa | type non déductible du nom : `other` |
| crews | 118 | Punk Hazard | type non déductible du nom : `other` |
| crews | 119 | Dressrosa | type non déductible du nom : `other` |
| crews | 120 | Green Bit | type non déductible du nom : `other` |
| crews | 121 | Zo | type non déductible du nom : `other` |
| crews | 122 | Royaume de Prodence | type non déductible du nom : `other` |
| crews | 123 | Royaume de Mogalo | type non déductible du nom : `other` |
| crews | 124 | Royaume de Germa | type non déductible du nom : `other` |
| crews | 125 | Sphinx | type non déductible du nom : `other` |
| crews | 126 | Skypiea | type non déductible du nom : `other` |
| crews | 127 | Weatheria | type non déductible du nom : `other` |
| crews | 128 | Île des hommes-poissons | type non déductible du nom : `other` |
| crews | 129 | La lune | type non déductible du nom : `other` |
| crews | 130 | Armée Révolutionnaire | type non déductible du nom : `other` |
| crews | 131 | Anciens membres du Baroque Works | type non déductible du nom : `other` |
| crews | 132 | Anciens membres du Cipher Pol | type non déductible du nom : `other` |
| crews | 134 | Esclave | type non déductible du nom : `other` |
| crews | 135 | Frères Voleurs | type non déductible du nom : `other` |
| crews | 136 | IÎle de la couronne | type non déductible du nom : `other` |
| crews | 137 | Île d'Asuka | type non déductible du nom : `other` |
| crews | 141 | Île de Mecha | type non déductible du nom : `other` |
| crews | 143 | Gran Tesero | type non déductible du nom : `other` |
| crews | 144 | Elegia | type non déductible du nom : `other` |
| crews | 145 | World Economic Journal | type non déductible du nom : `other` |
| crews | 146 | Cap des Jumeaux | type non déductible du nom : `other` |
| crews | 147 | Equipage de Bellamy | type non déductible du nom : `other` |
| crews | 148 | Equipage de Pandaman | type non déductible du nom : `other` |
| crews | 149 | Equipage de Bigalo | type non déductible du nom : `other` |

### Capitaines ambigus (4)

| Entité | Id | Nom | Détail |
| --- | --- | --- | --- |
| crews | 33 | The Kid crew | plusieurs capitaines : Eustass Kidd (#59), Wire (#62) → aucun retenu |
| crews | 38 | The Fire Tank crew | plusieurs capitaines : Capone Bege (#63), Jewelry Bonney (#68) → aucun retenu |
| crews | 87 | Armarda du Chapeau de Paille | plusieurs capitaines : Cavendish (#12), Bartolomeo (#14), Ideo (#19), Léo (#23), Hajrudin (#26) → aucun retenu |
| crews | 138 | Pirate des flèches rouges | plusieurs capitaines : Omatsuri (#721), Lily Carnation (#722) → aucun retenu |

### Fruits sans nom romanisé (25)

| Entité | Id | Nom | Détail |
| --- | --- | --- | --- |
| devil_fruits | 127 | Sheep SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 128 | Bat SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 129 | SMILE de gazelle | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 130 | Mouse SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 131 | Lion SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 132 | Horse SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 133 | SMILE of snake | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 134 | Rabbit SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 135 | Hippopotamus SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 136 | SMILE from alpaca | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 137 | SMILE of the elephant | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 138 | SMILE of the scorpion | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 139 | Monkey SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 140 | Armadillo SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 141 | Ostrich SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 142 | Flying Squirrel SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 143 | SMILE of the white snake | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 144 | Gorilla SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 145 | SMILE du coq | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 146 | Giraffe SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 147 | Rattlesnake SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 148 | Heterodon SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 149 | Caiman SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 150 | Pug SMILE | pas de nom romanisé : name_romaji = nom EN |
| devil_fruits | 197 | Artificial demon fruit from Vegapunk | pas de nom romanisé : name_romaji = nom EN |

### Fruits à plusieurs porteurs vivants (aucun marqué actuel) (6)

| Entité | Id | Nom | Détail |
| --- | --- | --- | --- |
| devil_fruits | 97 | Horse Fruit | porteurs non décédés : Charlotte Smoothie (#98), Pierre (#625) → aucun marqué actuel |
| devil_fruits | 99 | Fruit of the Pachyderm | porteurs non décédés : Rob Lucci (#392), Funckfreed (#395) → aucun marqué actuel |
| devil_fruits | 133 | SMILE of snake | porteurs non décédés : Snakeman (#214), Sarehebi (#216) → aucun marqué actuel |
| devil_fruits | 138 | SMILE of the scorpion | porteurs non décédés : Trouduc (#200), Nuré-Onna (#222) → aucun marqué actuel |
| devil_fruits | 144 | Gorilla SMILE | porteurs non décédés : Briscola (#206), Mizerka (#209) → aucun marqué actuel |
| devil_fruits | 158 | Chamquipue fruit | porteurs non décédés : Musshul (#729), Musshuru (#751) → aucun marqué actuel |

## Slugs suffixés après collision (10)

Slug souhaité déjà pris par une autre entité : à trancher via `overrides/aliases.yaml` (tâche 4).

| Entité | Id source | Slug souhaité | Slug attribué |
| --- | --- | --- | --- |
| characters | 264 | sanjuan-wolf | sanjuan-wolf-264 |
| characters | 730 | scarlett | scarlett-730 |
| characters | 549 | silvers-rayleigh | silvers-rayleigh-549 |
| crews | 88 | bagizu-deribari | bagizu-deribari-88 |
| crews | 85 | maddo-toreja-kaizokudan | maddo-toreja-kaizokudan-85 |
| crews | 81 | makuro-ichimi | makuro-ichimi-81 |
| devil_fruits | 193 | inu-inu-no-mi-moderu-bake-danuki | inu-inu-no-mi-moderu-bake-danuki-193 |
| devil_fruits | 206 | tori-tori-no-mi | tori-tori-no-mi-206 |
| locations | 106 | goto-jima | goto-jima-106 |
| locations | 58 | surira-baku | surira-baku-58 |

## Complétude (valeurs manquantes)

| Champ | Lignes sans valeur |
| --- | --- |
| characters.name_fr | 0 |
| characters.age | 334 |
| characters.height_cm | 419 |
| characters.status = 'unknown' | 10 |
| characters sans affiliation | 48 |
| crews.name_fr | 0 |
| crews.captain_id | 118 |
| devil_fruits.type | 0 |
| devil_fruits.name_fr | 0 |
| locations.sea | 13 |
| arcs.chapter_start | 50 |
