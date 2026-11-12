# Rapport du pipeline de données

Généré par `pipeline report`. Ne pas éditer à la main.

## Sources

| Source | URL | Licence |
| --- | --- | --- |
| api-onepiece | https://api.api-onepiece.com | **inconnue** (aucune licence déclarée) |
| fandom | https://onepiece.fandom.com | CC-BY-SA |

## Comptes par table

| Table | Lignes |
| --- | --- |
| raw.responses | 384 |
| staging.api_onepiece | 2670 |
| staging.fandom | 1792 |
| staging.rejections | 2 |
| canon.characters | 1688 |
| canon.character_aliases | 6242 |
| canon.character_affiliations | 1095 |
| canon.character_fruits | 199 |
| canon.bounties | 298 |
| canon.haki | 245 |
| canon.crews | 167 |
| canon.devil_fruits | 227 |
| canon.locations | 128 |
| canon.sagas | 10 |
| canon.arcs | 50 |
| canon.external_ids | 2965 |
| canon.provenance | 11924 |

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

## Rapprochement api-onepiece ↔ Fandom

Ordre : alias (`overrides/aliases.yaml`), id déjà connu (`canon.external_ids`), nom normalisé (titre de page, puis tous les noms). Aucune fusion fuzzy : une page Fandom qui ressemble à une entité api-onepiece non rapprochée reste en attente (non créée). « Déjà connues » : rapprochement enregistré par une exécution précédente.

| Entité | Rapprochées (alias / déjà connues / par nom) | api-onepiece seule | Fandom seule (créées) | Fandom en attente |
| --- | --- | --- | --- | --- |
| devil_fruits | 125 (0 / 125 / 0) | 88 | 14 | 14 |
| crews | 48 (0 / 48 / 0) | 101 | 18 | 19 |
| characters | 522 (1 / 521 / 0) | 263 | 903 | 129 |

## Entités non rapprochées (1549)

Pour rapprocher deux entités (ou en séparer deux confondues) : `overrides/aliases.yaml`, voir le README du package.

### Fruits du démon : en attente, non créées (14)

| Page Fandom | Raison | Candidats api-onepiece (id : nom, score ou indice) |
| --- | --- | --- |
| Ushi Ushi no Mi, Model: Bison | candidats fuzzy | 91 : Fruit du Bovin, Bison version (0.9) ; 101 : Fruit du Bovin, Giraffe version (0.86) ; 192 : Fruit du Bovin, Lama version (0.83) |
| Tori Tori no Mi, Model: Falcon | candidats fuzzy | 93 : Fruit du Volatile, Falcon version (0.9) ; 206 : Phoenix Fruit (0.9) ; 191 : Fruit of the Volatile, Eagle version (0.8) ; 195 : Fruit of the Volatile, Naked version (0.8) |
| Inu Inu no Mi, Model: Wolf | candidats fuzzy | 100 : Fruit of the Canid, Wolf version (0.81) |
| Ushi Ushi no Mi, Model: Giraffe | candidats fuzzy | 91 : Fruit du Bovin, Bison version (0.9) ; 146 : Giraffe SMILE (0.9) ; 101 : Fruit du Bovin, Giraffe version (0.86) ; 192 : Fruit du Bovin, Lama version (0.83) |
| Hebi Hebi no Mi, Model: King Cobra | candidats fuzzy | 103 : Fruit of the Reptile, Cobra Royal version (0.97) ; 133 : SMILE of snake (0.9) |
| Batto Batto no Mi | candidats fuzzy | 194 : Fruit of the Bat, Vampire version (0.9) |
| Nagi Nagi no Mi | candidats fuzzy | 58 : Sourdine fruit (0.93) |
| Kobu Kobu no Mi | candidats fuzzy | 74 : Fruit of Exaltation (0.93) |
| Ryu Ryu no Mi, Model: Pteranodon | candidats fuzzy | 114 : Fruit of the Dinosaur, Pteranodon version (0.9) |
| Inu Inu no Mi, Model: Tanuki | candidats fuzzy | 100 : Fruit of the Canid, Wolf version (0.81) ; 110 : Canid Fruit, Tanuki version (0.81) ; 193 : Fruit du Canidé, Raccoon version (0.81) |
| Uma Uma no Mi, Model: Pegasus | candidats fuzzy | 132 : Horse SMILE (0.9) ; 205 : Horse fruit, Pegasus model (0.9) |
| Nori Nori no Mi | candidats fuzzy | 93 : Fruit du Volatile, Falcon version (0.87) ; 206 : Phoenix Fruit (0.87) |
| Rako Rako no Mi | candidats fuzzy | 176 : Fruit of Luck (0.87) |
| Aro Aro no Mi | candidats fuzzy | 174 : Fruit of Camouflage (0.85) |

### Fruits du démon : api-onepiece sans page Fandom (88)

| Slug | Id api-onepiece | Nom |
| --- | --- | --- |
| nagi-nahi-no-mi | 58 | Sourdine fruit |
| kubu-kobu-no-mi | 74 | Fruit of Exaltation |
| ushi-ushi-no-mi | 91 | Fruit du Bovin, Bison version |
| tori-tori-no-mi | 93 | Fruit du Volatile, Falcon version |
| neko-neko-no-mi-moderu-hyo | 98 | Fruit of the Feline, Leopard version |
| inu-inu-no-mi-moderu-okami | 100 | Fruit of the Canid, Wolf version |
| ushi-ushi-no-mi-moderu-kirin | 101 | Fruit du Bovin, Giraffe version |
| hebi-hebi-no-mi-moderu-kingu-kobura | 103 | Fruit of the Reptile, Cobra Royal version |
| inu-inu-no-mi-moderu-bake-danuki | 110 | Canid Fruit, Tanuki version |
| ryu-ryu-no-mi-kodai-shu-moderu-puteranodon | 114 | Fruit of the Dinosaur, Pteranodon version |
| sheep-smile | 127 | Sheep SMILE |
| bat-smile | 128 | Bat SMILE |
| smile-de-gazelle | 129 | SMILE de gazelle |
| mouse-smile | 130 | Mouse SMILE |
| lion-smile | 131 | Lion SMILE |
| horse-smile | 132 | Horse SMILE |
| smile-of-snake | 133 | SMILE of snake |
| rabbit-smile | 134 | Rabbit SMILE |
| hippopotamus-smile | 135 | Hippopotamus SMILE |
| smile-from-alpaca | 136 | SMILE from alpaca |
| smile-of-the-elephant | 137 | SMILE of the elephant |
| smile-of-the-scorpion | 138 | SMILE of the scorpion |
| monkey-smile | 139 | Monkey SMILE |
| armadillo-smile | 140 | Armadillo SMILE |
| ostrich-smile | 141 | Ostrich SMILE |
| flying-squirrel-smile | 142 | Flying Squirrel SMILE |
| smile-of-the-white-snake | 143 | SMILE of the white snake |
| gorilla-smile | 144 | Gorilla SMILE |
| smile-du-coq | 145 | SMILE du coq |
| giraffe-smile | 146 | Giraffe SMILE |
| rattlesnake-smile | 147 | Rattlesnake SMILE |
| heterodon-smile | 148 | Heterodon SMILE |
| caiman-smile | 149 | Caiman SMILE |
| pug-smile | 150 | Pug SMILE |
| goe-goe-no-mi | 151 | Fruit of the Vocalise |
| hiso-hiso-no-mi | 152 | Fruit of the Whisper |
| kama-kama-no-mi | 153 | Fruit of the Slash-Slash |
| kachi-kachi-no-mi | 154 | Unbreakable Fruit |
| nemu-nemu-no-mi | 155 | Fruit of Sleep |
| mini-mini-no-mi | 156 | Fruit of the Dwarf |
| atsu-atsu-no-mi | 157 | Fruit of Heat |
| noko-noko-no-mi | 158 | Chamquipue fruit |
| ami-ami-no-mi | 159 | Fruit du Filet |
| kopi-kopi-no-mi | 160 | Fruit of the Copy |
| mosa-mosa-no-mi | 161 | Fluffy Fruit |
| modo-modo-no-mi | 162 | Fruit Jeune-Jeune |
| gutsu-gutsu-no-mi | 163 | Fruit du Fourneau |
| peto-peto-no-mi | 164 | Fruit of the Trainer |
| kone-kone-no-mi | 165 | Fruit of the Link |
| moa-moa-no-mi | 166 | Fruit of the Plus-Plus |
| kyubu-kyubu-no-mi | 167 | Fruit of the Cube |
| maji-maji-no-mi | 168 | Fruit of Magic |
| nito-nito-no-mi | 169 | Nitro-Fruit |
| hore-hore-no-mi | 170 | Fruit of love |
| nuku-nuke-no-mi | 171 | Passe-Muraille fruit |
| koro-koro-no-mi | 172 | Tchou-Tchou fruit |
| jara-jara-no-mi | 173 | Fruit of Chains |
| iro-iro-no-mi | 174 | Fruit of Camouflage |
| gol-gol-no-mi | 175 | Fruit of Gold |
| raki-raki-no-mi | 176 | Fruit of Luck |
| nepa-nepa-no-mi | 177 | Fruit of Heat Waves |
| mono-mono-no-mi | 178 | Fruit of Things |
| bijo-bijo-no-mi | 179 | Fruit of Vision |
| ute-ute-no-mi | 180 | Fruit of Shooting |
| pocha-pocha-no-mi | 181 | Fruit du Potelé |
| bana-bana-no-mi | 182 | Fruit of the Burner |
| deri-deri-no-mi | 183 | Fruit of the Deliverer |
| dero-dero-no-mi | 184 | Fruit of Dissolution |
| basu-basu-no-mi | 185 | Fruit of the Bomb |
| gasha-gasha-no-mi | 186 | Fruit de la Ferraille |
| nibi-nibi-no-mi | 187 | Fruit of Necromancy |
| toro-toro-no-mi | 188 | Fruit of Dissolution |
| pasa-pasa-no-mi | 189 | Paper Fruit |
| ame-ame-no-mi | 190 | Candy Fruit |
| tori-tori-no-mi-moderu-washi | 191 | Fruit of the Volatile, Eagle version |
| ushi-ushi-no-mi-moderu-lama | 192 | Fruit du Bovin, Lama version |
| inu-inu-no-mi-moderu-bake-danuki-193 | 193 | Fruit du Canidé, Raccoon version |
| batto-batto-no-mi-moderu-banpaia | 194 | Fruit of the Bat, Vampire version |
| tori-tori-no-mi-moderu-nue | 195 | Fruit of the Volatile, Naked version |
| hito-hito-no-mi-moderu-nika | 196 | Hito Hito no Mi, Nika model |
| artificial-demon-fruit-from-vegapunk | 197 | Artificial demon fruit from Vegapunk |
| uma-uma-no-mi-modele-pegase | 205 | Horse fruit, Pegasus model |
| tori-tori-no-mi-206 | 206 | Phoenix Fruit |
| fruit | 209 | Fruit |
| supa-supa-no-mi-clone | 212 | Clone of the fruit of the slasher |
| sui-sui-no-mi-clone | 213 | Clone of the Barbotage fruit |
| mero-mero-no-mi-clone | 214 | Passion fruit clone |
| nikyu-nikyu-no-mi-clone | 215 | Clone of the Pawpaw Fruit |

### Fruits du démon : Fandom sans équivalent api-onepiece, créées (14)

| Slug | Page Fandom | Raison |
| --- | --- | --- |
| neko-neko-no-mi-model-leopard | Neko Neko no Mi, Model: Leopard | déjà créée (id connu) |
| akuma-no-mi | Akuma no Mi | déjà créée (id connu) |
| artificial-devil-fruit | Artificial Devil Fruit | déjà créée (id connu) |
| smile | SMILE | déjà créée (id connu) |
| muchi-muchi-no-mi | Muchi Muchi no Mi | déjà créée (id connu) |
| gunyo-gunyo-no-mi | Gunyo Gunyo no Mi | déjà créée (id connu) |
| susu-susu-no-mi | Susu Susu no Mi | déjà créée (id connu) |
| tsutsu-tsutsu-no-mi | Tsutsu Tsutsu no Mi | déjà créée (id connu) |
| inu-inu-no-mi-model-hound | Inu Inu no Mi, Model: Hound | déjà créée (id connu) |
| iku-iku-no-mi | Iku Iku no Mi | déjà créée (id connu) |
| iba-iba-no-mi | Iba Iba no Mi | déjà créée (id connu) |
| ryu-ryu-no-mi-model-kirin | Ryu Ryu no Mi, Model: Kirin | déjà créée (id connu) |
| ryu-ryu-no-mi-model-nidhoggr | Ryu Ryu no Mi, Model: Nidhöggr | déjà créée (id connu) |
| risu-risu-no-mi-model-ratatoskr | Risu Risu no Mi, Model: Ratatoskr | déjà créée (id connu) |

### Équipages : en attente, non créées (19)

| Page Fandom | Raison | Candidats api-onepiece (id : nom, score ou indice) |
| --- | --- | --- |
| Red Hair Pirates | candidats fuzzy | 2 : Le Roux crew (0.95) |
| Saruyama Alliance | candidats fuzzy | 17 : Primate League (0.9) |
| Black Cat Pirates | candidats fuzzy | 7 : The Black Cat crew (0.95) |
| Krieg Pirates | candidats fuzzy | 8 : Don Krieg's Pirate Armada (0.9) |
| Macro Pirates | nom ambigu | 30 : The Marquereaux crew (1) ; 81 : L'Équipage des Maquereaux (1) |
| Giant Warrior Pirates | candidats fuzzy | 13 : The Giant Crew (0.95) ; 61 : New Giant Crew (0.9) |
| Rumbar Pirates | candidats fuzzy | 12 : The Rumbar crew (0.94) |
| Roshio Pirates | candidats fuzzy | 20 : The Roshio crew (0.94) |
| Thriller Bark Pirates | candidats fuzzy | 28 : Thriller Bark (0.9) |
| New Fish-Man Pirates | candidats fuzzy | 50 : The New Fishmen crew (0.96) ; 61 : New Giant Crew (0.83) |
| Donquixote Pirates | candidats fuzzy | 21 : Don Quixote's crew (0.95) |
| Yonta Maria Grand Fleet | candidats fuzzy | 57 : Fleet Yonta Maria (0.95) |
| Tontatta Pirates | candidats fuzzy | 86 : Royaume de Tontatta (0.9) |
| A O Pirates | candidats fuzzy | 64 : The Amigo crew (0.81) |
| Nox Pirates | candidats fuzzy | 65 : The Phoenix crew (0.85) |
| New Giant Warrior Pirates | candidats fuzzy | 61 : New Giant Crew (0.96) ; 13 : The Giant Crew (0.9) |
| Peachbeard Pirates | candidats fuzzy | 71 : The Pirates with Moustaches crew (0.8) |
| Germ Pirates | candidats fuzzy | 66 : Bayan's crew (0.82) |
| Gecko Pirates | candidats fuzzy | 97 : Archipel des Gecko (0.9) |

### Équipages : api-onepiece sans page Fandom (101)

| Slug | Id api-onepiece | Nom |
| --- | --- | --- |
| akagami-kaizokudan | 2 | Le Roux crew |
| kuroneko-kaizoku-dan | 7 | The Black Cat crew |
| kuriiku-kaizoku-kantai | 8 | Don Krieg's Pirate Armada |
| runba-kaizoku-dan | 12 | The Rumbar crew |
| kyo-he-kaizoku-dan | 13 | The Giant Crew |
| saruyama-rengo | 17 | Primate League |
| roshio-kaizokudan | 20 | The Roshio crew |
| donkihote-kaizokudan | 21 | Don Quixote's crew |
| surira-baku | 28 | Thriller Bark |
| makuro-ichimi | 30 | The Marquereaux crew |
| the-asl-crew | 47 | The ASL crew |
| shin-gyojin-kaizokudan | 50 | The New Fishmen crew |
| bagizu-deribari | 54 | The Expedition crew |
| yonta-maria-dai-senda | 57 | Fleet Yonta Maria |
| mikadzuki-no-norikumiin | 58 | The crew of the Moon Crescent |
| toripuru-ekkusu-jimu-kakuto-rengo | 60 | XXX Gym Martial Arts Alliances |
| shin-kyo-he-kaizoku-dan | 61 | New Giant Crew |
| gyanzakku-kaizokudan | 63 | the Ganzack crew |
| amigo-kaizokudan | 64 | The Amigo crew |
| fenikkusu-kaizokudan | 65 | The Phoenix crew |
| baian-kaizoku-dan | 66 | Bayan's crew |
| shunaida-kaizokudan | 67 | The Schneider Pirates crew |
| wetton-kaizoku-dan | 68 | The Wetton crew |
| reddo-arozu-kaizokudan | 70 | The Red Arrows crew |
| chobihige-kaizokudan | 71 | The Pirates with Moustaches crew |
| toranpu-kyodai | 72 | The Trump Pirates crew |
| gasupade-kaizokudan | 73 | Gasparde's crew |
| zeni-kaizoku-dan | 74 | Zenny's crew |
| barubaru-dan | 75 | The Pirates du Sables crew |
| ochanoma-kaizokudan | 76 | The Tearoom crew |
| maddo-toreja-kaizokudan | 77 | The Pirates Treasure crew |
| barokku-wakusu | 78 | Baroque Works |
| rubuniru-okoku | 79 | Royaume de Luvneel |
| makuro-ichimi-81 | 81 | L'Équipage des Maquereaux |
| kaigun | 82 | Marine |
| sekai-kizoku | 83 | Dragon Célestes |
| shibarikubi-no-bigaro | 84 | Bigaro |
| maddo-toreja-kaizokudan-85 | 85 | L'Équipage de Mad Treasure |
| tontatta-okoku | 86 | Royaume de Tontatta |
| bagizu-deribari-88 | 88 | Baggy's Delivery |
| buggys-delivery | 89 | Buggy's Delivery |
| cipher-pol | 90 | Cipher Pol |
| enies-lobby | 91 | Enies Lobby |
| impel-down | 92 | Impel Down |
| royaume-de-goa | 93 | Royaume de Goa |
| village-de-shimotsuki | 94 | Village de Shimotsuki |
| archipel-des-argao | 95 | Archipel des Argao |
| ile-des-animaux-etranges | 96 | Île des animaux étranges |
| archipel-des-gecko | 97 | Archipel des Gecko |
| baratie | 98 | Baratie |
| archipel-conomi | 99 | Archipel Conomi |
| loguetown | 100 | Loguetown |
| royaume-de-lvneel | 101 | Royaume de Lvneel |
| baterilla | 102 | Baterilla |
| royaume-malefique-de-black-drum | 103 | Royaume maléfique de Black Drum |
| ohara | 104 | Ohara |
| pays-des-fleurs | 105 | Pays des fleurs |
| reverse-mountain | 106 | Reverse Mountain |
| ile-aux-cactus | 107 | Île aux cactus |
| little-garden | 108 | Little Garden |
| ile-de-drum | 109 | Île de Drum |
| alabasta | 110 | Alabasta |
| long-ring-long-land | 111 | Long Ring Long Land |
| source-de-linsouciance | 112 | Source de l'insouciance |
| water-seven | 113 | Water Seven |
| archipel-des-sabaody | 114 | Archipel des Sabaody |
| archipel-de-boing | 115 | Archipel de Boing |
| erbaf | 116 | Erbaf |
| pays-des-wa | 117 | Pays des Wa |
| punk-hazard | 118 | Punk Hazard |
| dressrosa | 119 | Dressrosa |
| green-bit | 120 | Green Bit |
| zo | 121 | Zo |
| royaume-de-prodence | 122 | Royaume de Prodence |
| royaume-de-mogalo | 123 | Royaume de Mogalo |
| royaume-de-germa | 124 | Royaume de Germa |
| sphinx | 125 | Sphinx |
| skypiea | 126 | Skypiea |
| weatheria | 127 | Weatheria |
| ile-des-hommes-poissons | 128 | Île des hommes-poissons |
| la-lune | 129 | La lune |
| armee-revolutionnaire | 130 | Armée Révolutionnaire |
| anciens-membres-du-baroque-works | 131 | Anciens membres du Baroque Works |
| anciens-membres-du-cipher-pol | 132 | Anciens membres du Cipher Pol |
| anciens-membres-de-la-marine | 133 | Anciens membres de la Marine |
| esclave | 134 | Esclave |
| freres-voleurs | 135 | Frères Voleurs |
| iile-de-la-couronne | 136 | IÎle de la couronne |
| ile-dasuka | 137 | Île d'Asuka |
| pirate-des-fleches-rouges | 138 | Pirate des flèches rouges |
| pirate-au-foyer | 139 | Pirate au foyer |
| pirate-moustachus | 140 | Pirate Moustachus |
| ile-de-mecha | 141 | Île de Mecha |
| neo-marine | 142 | Néo Marine |
| gran-tesero | 143 | Gran Tesero |
| elegia | 144 | Elegia |
| world-economic-journal | 145 | World Economic Journal |
| cap-des-jumeaux | 146 | Cap des Jumeaux |
| equipage-de-bellamy | 147 | Equipage de Bellamy |
| equipage-de-pandaman | 148 | Equipage de Pandaman |
| equipage-de-bigalo | 149 | Equipage de Bigalo |

### Équipages : Fandom sans équivalent api-onepiece, créées (18)

| Slug | Page Fandom | Raison |
| --- | --- | --- |
| eraser-pirates | Eraser Pirates | déjà créée (id connu) |
| maelstrom-spider-pirates | Maelstrom Spider Pirates | déjà créée (id connu) |
| masira-pirates | Masira Pirates | déjà créée (id connu) |
| buggy-and-alvida-alliance | Buggy and Alvida Alliance | déjà créée (id connu) |
| shoujou-pirates | Shoujou Pirates | déjà créée (id connu) |
| gally-pirates | Gally Pirates | déjà créée (id connu) |
| ideo-pirates | Ideo Pirates | déjà créée (id connu) |
| niho-navy | Niho Navy | déjà créée (id connu) |
| little-pirates | Little Pirates | déjà créée (id connu) |
| takotopus-pirates | Takotopus Pirates | déjà créée (id connu) |
| sasaki-pirates | Sasaki Pirates | déjà créée (id connu) |
| whos-who-pirates | Who's-Who Pirates | déjà créée (id connu) |
| bourgeois-pirates | Bourgeois Pirates | déjà créée (id connu) |
| social-club | Social Club | déjà créée (id connu) |
| puddle-pirates | Puddle Pirates | déjà créée (id connu) |
| night-butterfly-pirates | Night Butterfly Pirates | déjà créée (id connu) |
| endurance-curry-pirates | Endurance Curry Pirates | déjà créée (id connu) |
| polo-pirates | Polo Pirates | déjà créée (id connu) |

### Personnages : en attente, non créées (129)

| Page Fandom | Raison | Candidats api-onepiece (id : nom, score ou indice) |
| --- | --- | --- |
| Lucky Roux | candidats fuzzy | 87 : Lucky Roo (0.8) |
| Benn Beckman | candidats fuzzy | 86 : Ben Beckmann (0.83) |
| Comil | candidats fuzzy | 421 : Comir (0.8) |
| Jaguar D. Saul | candidats fuzzy | 504 : Haguar D. Sauro (0.82) |
| Brannew | candidats fuzzy | 436 : Brandnew (0.88) |
| Koby | candidats fuzzy | 441 : Kobby (0.8) |
| Marshall D. Teach | candidats fuzzy | 247 : Marchall D. Teach / Barbe Noire (0.94) |
| Shimotsuki Kuina | candidats fuzzy | 475 : Kuina (0.9) |
| Gaimon | candidats fuzzy | 478 : Gaimone (0.86) |
| Donquixote Doflamingo | candidats fuzzy | 365 : Don Quijote Doflamingo (0.95) |
| Enel | candidats fuzzy | 660 : Ener (0.8) |
| Van Augur | candidats fuzzy | 250 : Van Auger (0.89) |
| Brogy | candidats fuzzy | 512 : Broggy (0.83) |
| Karoo | candidats fuzzy | 524 : Kaloo (0.8) |
| Kashii | candidats fuzzy | 558 : Kaashii (0.86) |
| Gonbe | candidats fuzzy | 547 : Gonbei (0.83) |
| Lily | candidats fuzzy | 722 : Lily Carnation (0.9) |
| Mont Blanc Cricket | candidats fuzzy | 43 : Montblanc Cricket (0.94) |
| Iceburg | candidats fuzzy | 537 : Icebarg (0.86) |
| Gem | candidats fuzzy | 678 : Gemme (même fruit) |
| Johnny | candidats fuzzy | 494 : Johny (0.83) |
| Jozu | candidats fuzzy | 291 : Diamond Joz (même fruit) |
| Yokozuna | candidats fuzzy | 548 : Yokozuma (0.88) |
| Carne | candidats fuzzy | 488 : Canne (0.8) |
| Clou D. Clover | candidats fuzzy | 502 : Clover (0.9) |
| Gan Fall | candidats fuzzy | 624 : Gan Forr (0.88) |
| Hotori and Kotori | candidats fuzzy | 642 : Hotori (0.9) ; 643 : Kotori (0.9) |
| Peepley Lulu | candidats fuzzy | 539 : Peeply Lulu (0.92) |
| Dalton | candidats fuzzy | 513 : Dolton (0.83) |
| Mont Blanc Noland | candidats fuzzy | 497 : Montblanc Norland (0.88) |
| Lassoo | candidats fuzzy | 676 : Lassou (0.83) |
| Wyper | candidats fuzzy | 630 : Wiper (0.8) |
| Kalgara | candidats fuzzy | 637 : Calgara (0.86) |
| Hattori | candidats fuzzy | 393 : Hittori (0.86) |
| Funkfreed | candidats fuzzy | 395 : Funckfreed (0.9) |
| Shimotsuki Koushirou | candidats fuzzy | 474 : Koshiro (0.9) |
| Mozu and Kiwi | candidats fuzzy | 542 : Mozu (0.9) ; 543 : Kiwi (0.9) |
| Shimotsuki Ryuma | candidats fuzzy | 576 : Ryuma Shimotsuki (0.9) |
| Very Good | candidats fuzzy | 437 : Verygood (0.89) |
| Charlotte Lola | candidats fuzzy | 176 : Charlotte Dolce (0.8) |
| John | candidats fuzzy | 59 : Eustass Kidd (même fruit) ; 494 : Johny (0.8) |
| Bourbon Jr. | candidats fuzzy | 529 : Bourdon Jr. (0.9) |
| Kentauros | candidats fuzzy | 530 : Kentarôs (0.89) |
| Rosward Rosward | candidats fuzzy | 386 : Roswald (0.9) |
| Eustass Kid | candidats fuzzy | 59 : Eustass Kidd (0.92) |
| Silvers Rayleigh | nom ambigu | 259 : Silvers Rayleigh (1) ; 549 : Silvers Rayleigh (1) |
| Fisher Tiger | candidats fuzzy | 78 : Ficher Tiger (0.92) |
| Minotaurus | candidats fuzzy | 409 : Minotaure (0.89) |
| Minozebra | candidats fuzzy | 412 : Minozèbre (0.89) |
| Shiryu | candidats fuzzy | 249 : Shiliew (même fruit) |
| Sanjuan Wolf | nom ambigu | 254 : Sanjuan Wolf (1) ; 264 : Sanjuan Wolf (1) |
| Jorge | candidats fuzzy | 35 : Morge (0.8) |
| McGuy | candidats fuzzy | 309 : Mc Guy (0.83) |
| Squard | candidats fuzzy | 306 : Squardo (0.86) |
| Lonz | candidats fuzzy | 454 : Ronz (0.8) |
| Kong | candidats fuzzy | 717 : Boo Kong (0.9) |
| Hocha | candidats fuzzy | 231 : Hacha (0.8) |
| Speed Jiru | candidats fuzzy | 301 : Speed Jill (0.9) |
| Demalo Black | candidats fuzzy | 350 : Demaro Black (0.92) |
| Arthur | candidats fuzzy | 324 : Arhur (0.83) |
| Great Michael | candidats fuzzy | 337 : Great Micheal (0.85) |
| Dalmatian | candidats fuzzy | 427 : Dalmatien (0.89) |
| Donquixote Mjosgard | candidats fuzzy | 389 : Don Quijote Myosgard (0.95) |
| Tamago | candidats fuzzy | 180 : Delœuf (même fruit) |
| Adele | candidats fuzzy | 713 : Adelle Bascùd (0.9) |
| Sora | candidats fuzzy | 618 : Sora Vinsmoke (0.9) |
| Minochihuahua | candidats fuzzy | 413 : Minochihuabua (0.92) |
| Caesar Clown | candidats fuzzy | 691 : César Clown (0.92) ; 32 : Baggy / Le Clown (0.9) |
| Buffalo | candidats fuzzy | 377 : Buffallo (0.88) |
| Kurozumi Kanjuro | candidats fuzzy | 573 : Kanjuro Kurozumi (0.9) |
| Riku Doldo III | candidats fuzzy | 594 : Riku Dold III (0.93) |
| Gancho | candidats fuzzy | 601 : Guncho (0.83) |
| Mansherry | candidats fuzzy | 602 : Manshelly (même fruit) |
| Bian | candidats fuzzy | 25 : Bee Anne (même fruit) |
| Scarlett | nom ambigu | 595 : Scarlett (1) ; 730 : Scarlett (1) |
| Donquixote Rosinante | candidats fuzzy | 443 : Don Quijote Rosinante (0.9) |
| Donquixote Homing | candidats fuzzy | 498 : Don Quijote Homing (0.94) |
| Sheepshead | candidats fuzzy | 196 : Sheep’s Head (0.91) |
| Zunesha | candidats fuzzy | 603 : Zunesh (0.86) |
| Kouzuki Oden | candidats fuzzy | 560 : Oden Kozuki (0.9) |
| Sarie Nantokanette | candidats fuzzy | 464 : Sally Entoilette (0.82) |
| Sora (fictional) | candidats fuzzy | 618 : Sora Vinsmoke (0.9) |
| Vinsmoke Reiju | candidats fuzzy | 619 : Reiju Vinsmoke (0.9) |
| Vinsmoke Yonji | candidats fuzzy | 622 : Yonji Vinsmoke (0.9) |
| Vinsmoke Judge | candidats fuzzy | 617 : Judge Vinsmoke (0.9) |
| Charlotte Perospero | candidats fuzzy | 100 : Charlotte Slurp (même fruit) |
| Vinsmoke Ichiji | candidats fuzzy | 620 : Ichiji Vinsmoke (0.9) |
| Vinsmoke Niji | candidats fuzzy | 621 : Niji Vinsmoke (0.9) |
| Prometheus | candidats fuzzy | 183 : Prométhée (0.8) |
| Charlotte Katakuri | candidats fuzzy | 97 : Charlotte Dent-de-chien (même fruit) |
| Charlotte Dolce and Dragée | candidats fuzzy | 176 : Charlotte Dolce (0.9) ; 177 : Charlotte Dragée (0.9) |
| Vinsmoke Sora | candidats fuzzy | 618 : Sora Vinsmoke (0.9) |
| Concelot | candidats fuzzy | 608 : Cancelot (0.88) |
| Jorul | candidats fuzzy | 555 : Jorl (0.8) |
| Jarul | candidats fuzzy | 556 : Jarl (0.8) |
| Charlotte Flampe | candidats fuzzy | 110 : Charlotte Flampée (0.94) |
| Karasu | candidats fuzzy | 773 : Karazu (0.83) |
| Tacos | candidats fuzzy | 720 : Lacos (0.8) |
| Charlotte Zuccotto | candidats fuzzy | 121 : Charlotte Zuccoto (0.94) |
| Charlotte Broyé | candidats fuzzy | 122 : Charlotte Broyée (0.94) ; 120 : Charlotte Crème (0.8) |
| Kurozumi Orochi | candidats fuzzy | 572 : Orochi Kurozumi (0.9) |
| Kouzuki Sukiyaki | candidats fuzzy | 559 : Sukiyaki Kozuki (0.9) |
| Kouzuki Toki | candidats fuzzy | 561 : Toki Kozuki (0.9) |
| Charlotte Mondée | candidats fuzzy | 112 : Charlotte Mondé (0.94) |
| Charlotte Cornstarch | candidats fuzzy | 129 : Charlotte Corn Starch (0.95) |
| Charlotte Melise | candidats fuzzy | 140 : Charlotte Mélisée (0.94) |
| Charlotte Maple | candidats fuzzy | 152 : Charlotte Mapple (0.94) ; 112 : Charlotte Mondé (0.8) ; 151 : Charlotte Mucre (0.8) |
| Kouzuki Hiyori | candidats fuzzy | 563 : Hiyori Kozuki (0.9) |
| Alpacaman | candidats fuzzy | 217 : Alpagaman (0.89) |
| Keith | candidats fuzzy | 704 : Akisu (0.8) |
| Shimotsuki Kouzaburou | candidats fuzzy | 473 : Kozaburo Shimotsuki (0.9) |
| Rabbitman | candidats fuzzy | 215 : Rabitman (0.89) |
| Sarahebi | candidats fuzzy | 216 : Sarehebi (0.88) |
| Buggy | candidats fuzzy | 32 : Baggy / Le Clown (0.8) |
| Kurozumi Semimaru | candidats fuzzy | 574 : Semimaru Kurozumi (0.9) |
| Kurozumi Higurashi | candidats fuzzy | 575 : Higurashi Kurozumi (0.9) |
| Doringo | candidats fuzzy | 263 : Dringo (0.86) |
| CB Gallant | candidats fuzzy | 267 : CB Galant (0.9) |
| Hatcha | candidats fuzzy | 231 : Hacha (0.83) |
| Mugren | candidats fuzzy | 273 : Colonel Mugren (0.9) |
| Jacksonbanner | candidats fuzzy | 280 : Jacsonbaner (0.85) |
| Bankuro | candidats fuzzy | 276 : Bankro (0.86) |
| Wanyudo | candidats fuzzy | 223 : Wa-Nyudo (0.88) |
| King (Giant Squid) | candidats fuzzy | 698 : Bear King (0.9) |
| Papas | candidats fuzzy | 723 : Papa (0.8) |
| Ryuma (Zombie) | candidats fuzzy | 576 : Ryuma Shimotsuki (0.9) |
| Piper | candidats fuzzy | 630 : Wiper (0.8) ; 723 : Papa (0.8) |
| Wolf (Elbaph) | candidats fuzzy | 254 : Sanjuan Wolf (0.9) ; 264 : Sanjuan Wolf (0.9) |
| Ganzui | candidats fuzzy | 678 : Gemme (même fruit) |

### Personnages : api-onepiece sans page Fandom (263)

| Slug | Id api-onepiece | Nom |
| --- | --- | --- |
| bee-anne | 25 | Bee Anne |
| baggy-le-clown | 32 | Baggy / Le Clown |
| morge | 35 | Morge |
| gyn | 41 | Gyn |
| montblanc-cricket | 43 | Montblanc Cricket |
| laura | 53 | Laura |
| pingouin | 58 | Pingouin |
| eustass-kidd | 59 | Eustass Kidd |
| charlotte-pets | 67 | Charlotte Pets |
| margaret | 73 | Margaret |
| ficher-tiger | 78 | Ficher Tiger |
| das-bones | 83 | Das Bones |
| edward-weeble | 84 | Edward Weeble |
| ben-beckmann | 86 | Ben Beckmann |
| lucky-roo | 87 | Lucky Roo |
| yassop | 88 | Yassop |
| howling-dab | 94 | Howling Dab |
| charlotte-dent-de-chien | 97 | Charlotte Dent-de-chien |
| charlotte-slurp | 100 | Charlotte Slurp |
| charlotte-flampee | 110 | Charlotte Flampée |
| charlotte-monde | 112 | Charlotte Mondé |
| charlotte-creme | 120 | Charlotte Crème |
| charlotte-zuccoto | 121 | Charlotte Zuccoto |
| charlotte-broyee | 122 | Charlotte Broyée |
| charlotte-corn-starch | 129 | Charlotte Corn Starch |
| charlotte-cannelle | 137 | Charlotte Cannelle |
| charlotte-melisee | 140 | Charlotte Mélisée |
| charlotte-mucre | 151 | Charlotte Mucre |
| charlotte-mapple | 152 | Charlotte Mapple |
| charlotte-yu-yuan | 159 | Charlotte Yu Yuan |
| charlotte-newichi | 160 | Charlotte Newichi |
| charlotte-newji | 161 | Charlotte Newji |
| charlotte-newsan | 162 | Charlotte Newsan |
| charlotte-newgo | 164 | Charlotte Newgo |
| charlotte-muscade | 165 | Charlotte Muscade |
| charlotte-muscadia | 166 | Charlotte Muscadia |
| charlotte-muscadelle | 167 | Charlotte Muscadelle |
| charlotte-muscadine | 168 | Charlotte Muscadine |
| charlotte-muscadette | 169 | Charlotte Muscadette |
| charlotte-dolce | 176 | Charlotte Dolce |
| charlotte-dragee | 177 | Charlotte Dragée |
| del-uf | 180 | Delœuf |
| boddin | 181 | Boddin |
| promethee | 183 | Prométhée |
| sheeps-head | 196 | Sheep’s Head |
| trouduc | 200 | Trouduc |
| pouilleux | 201 | Pouilleux |
| plouf | 205 | Plouf |
| rabitman | 215 | Rabitman |
| sarehebi | 216 | Sarehebi |
| alpagaman | 217 | Alpagaman |
| tatouman | 218 | Tatouman |
| wa-nyudo | 223 | Wa-Nyudo |
| hacha | 231 | Hacha |
| tohome | 243 | Tohomé |
| marchall-d-teach-barbe-noire | 247 | Marchall D. Teach / Barbe Noire |
| shiliew | 249 | Shiliew |
| van-auger | 250 | Van Auger |
| sanjuan-wolf | 254 | Sanjuan Wolf |
| barbe-rose | 257 | Barbe Rose |
| silvers-rayleigh | 259 | Silvers Rayleigh |
| dringo | 263 | Dringo |
| sanjuan-wolf-264 | 264 | Sanjuan Wolf |
| cb-galant | 267 | CB Galant |
| colonel-mugren | 273 | Colonel Mugren |
| max-marks | 274 | Max Marks |
| bankro | 276 | Bankro |
| jacsonbaner | 280 | Jacsonbaner |
| smack | 284 | Smack |
| madaisky-mizuta | 286 | Madaisky Mizuta |
| mawaritovsky-mizuta | 287 | Mawaritovsky Mizuta |
| diamond-joz | 291 | Diamond Joz |
| speed-jill | 301 | Speed Jill |
| freres-decalvan | 305 | Frères DeCalvan |
| squardo | 306 | Squardo |
| little-oz-junior | 308 | Little Oz Junior |
| mc-guy | 309 | Mc Guy |
| arhur | 324 | Arhur |
| wakkem | 333 | Wakkem |
| great-micheal | 337 | Great Micheal |
| barbos-bruneriguez-barbe-brune | 347 | Barbos Bruneriguez / Barbe Brune |
| demaro-black | 350 | Demaro Black |
| don-quijote-doflamingo | 365 | Don Quijote Doflamingo |
| buffallo | 377 | Buffallo |
| im-sama | 380 | Im Sama |
| 1er-doyen | 381 | 1er Doyen |
| 2e-doyen | 382 | 2e Doyen |
| 3e-doyen | 383 | 3e Doyen |
| 4e-doyen | 384 | 4e Doyen |
| 5e-doyen | 385 | 5e Doyen |
| roswald | 386 | Roswald |
| charloss | 387 | Charloss |
| sharlia | 388 | Sharlia |
| don-quijote-myosgard | 389 | Don Quijote Myosgard |
| hittori | 393 | Hittori |
| funckfreed | 395 | Funckfreed |
| bas | 401 | Bas |
| and | 402 | And |
| kerville | 403 | Kerville |
| minotaure | 409 | Minotaure |
| minozebre | 412 | Minozèbre |
| minochihuabua | 413 | Minochihuabua |
| comir | 421 | Comir |
| dalmatien | 427 | Dalmatien |
| pudding | 434 | Pudding |
| jenfetro | 435 | Jenfétro |
| brandnew | 436 | Brandnew |
| verygood | 437 | Verygood |
| kobby | 441 | Kobby |
| don-quijote-rosinante | 443 | Don Quijote Rosinante |
| hermep | 444 | Hermep |
| kaiser-moustache | 450 | Kaiser Moustache |
| ronz | 454 | Ronz |
| dohn-deynon | 455 | Dohn Deynon |
| sally-entoilette | 464 | Sally Entoilette |
| kozaburo-shimotsuki | 473 | Kozaburo Shimotsuki |
| koshiro | 474 | Koshiro |
| kuina | 475 | Kuina |
| gaimone | 478 | Gaimone |
| oignon | 482 | Oignon |
| piment | 483 | Piment |
| carotte | 484 | Carotte |
| canne | 488 | Canne |
| belmer | 489 | Belmer |
| johny | 494 | Johny |
| montblanc-norland | 497 | Montblanc Norland |
| don-quijote-homing | 498 | Don Quijote Homing |
| clover | 502 | Clover |
| haguar-d-sauro | 504 | Haguar D. Sauro |
| broggy | 512 | Broggy |
| dolton | 513 | Dolton |
| hiluluk | 515 | Hiluluk |
| kaloo | 524 | Kaloo |
| longs-cils | 525 | Longs-Cils |
| bourdon-jr | 529 | Bourdon Jr. |
| kentaros | 530 | Kentarôs |
| icebarg | 537 | Icebarg |
| pauly | 538 | Pauly |
| peeply-lulu | 539 | Peeply Lulu |
| mozu | 542 | Mozu |
| kiwi | 543 | Kiwi |
| gonbei | 547 | Gonbei |
| yokozuma | 548 | Yokozuma |
| silvers-rayleigh-549 | 549 | Silvers Rayleigh |
| jorl | 555 | Jorl |
| jarl | 556 | Jarl |
| kaashii | 558 | Kaashii |
| sukiyaki-kozuki | 559 | Sukiyaki Kozuki |
| oden-kozuki | 560 | Oden Kozuki |
| toki-kozuki | 561 | Toki Kozuki |
| mononosuke-kozuki | 562 | Mononosuké Kozuki |
| hiyori-kozuki | 563 | Hiyori Kozuki |
| izo | 566 | Izo |
| orochi-kurozumi | 572 | Orochi Kurozumi |
| kanjuro-kurozumi | 573 | Kanjuro Kurozumi |
| semimaru-kurozumi | 574 | Semimaru Kurozumi |
| higurashi-kurozumi | 575 | Higurashi Kurozumi |
| ryuma-shimotsuki | 576 | Ryuma Shimotsuki |
| yasui-shimotsuki | 577 | Yasui Shimotsuki |
| baboumaru | 588 | Baboumaru |
| rock | 591 | Rock |
| riku-dold-iii | 594 | Riku Dold III |
| scarlett | 595 | Scarlett |
| guncho | 601 | Guncho |
| manshelly | 602 | Manshelly |
| zunesh | 603 | Zunesh |
| begis-khan | 604 | Bêgis Khan |
| caborage | 605 | Caborage |
| chavipere | 606 | Chavipère |
| sicilion | 607 | Sicilion |
| cancelot | 608 | Cancelot |
| judge-vinsmoke | 617 | Judge Vinsmoke |
| sora-vinsmoke | 618 | Sora Vinsmoke |
| reiju-vinsmoke | 619 | Reiju Vinsmoke |
| ichiji-vinsmoke | 620 | Ichiji Vinsmoke |
| niji-vinsmoke | 621 | Niji Vinsmoke |
| yonji-vinsmoke | 622 | Yonji Vinsmoke |
| gan-forr | 624 | Gan Forr |
| chef-shandia | 629 | Chef Shandia |
| wiper | 630 | Wiper |
| laki | 634 | Laki |
| calgara | 637 | Calgara |
| om | 638 | Om |
| hotori | 642 | Hotori |
| kotori | 643 | Kotori |
| ministre-senestre | 653 | Ministre Sénestre |
| ministre-dextre | 654 | Ministre Dextre |
| octy | 658 | Octy |
| ener | 660 | Ener |
| corbeau | 664 | Corbeau |
| canard | 669 | Canard |
| lassou | 676 | Lassou |
| gemme | 678 | Gemme |
| cesar-clown | 691 | César Clown |
| el-gorago | 693 | El Gorago |
| golass | 694 | Golass |
| tobio | 695 | Tobio |
| ganzo | 696 | Ganzo |
| woonan | 697 | Woonan |
| bear-king | 698 | Bear King |
| honey-queen | 699 | Honey Queen |
| pin-joker | 700 | Pin Joker |
| boo-jack | 701 | Boo Jack |
| skunk-one | 702 | Skunk One |
| borodo | 703 | Borodo |
| akisu | 704 | Akisu |
| bulter | 705 | Bulter |
| hotdog | 706 | Hotdog |
| mobambi | 707 | Mobambi |
| heaby | 708 | Heaby |
| general-gasparde | 709 | Général Gasparde |
| needless | 710 | Needless |
| biera | 711 | Biera |
| shuraiya-bascud | 712 | Shuraiya Bascùd |
| adelle-bascud | 713 | Adelle Bascùd |
| saga | 714 | Saga |
| toma | 715 | Toma |
| bismarck | 716 | Bismarck |
| boo-kong | 717 | Boo Kong |
| maya | 718 | Maya |
| izaya | 719 | Izaya |
| lacos | 720 | Lacos |
| omatsuri | 721 | Omatsuri |
| lily-carnation | 722 | Lily Carnation |
| papa | 723 | Papa |
| brief | 724 | Brief |
| ratchet | 725 | Ratchet |
| honki | 726 | Honki |
| maji | 727 | Maji |
| roba | 728 | Roba |
| musshul | 729 | Musshul |
| scarlett-730 | 730 | Scarlett |
| xiao | 732 | Xiao |
| schneider | 733 | Schneider |
| buzz | 734 | Buzz |
| zephyr | 735 | Zéphyr |
| douglas-bullet | 743 | Douglas Bullet |
| buena-festa | 744 | Buena Festa |
| ann | 745 | Ann |
| donald-moderate | 746 | Donald Moderate |
| gordon | 748 | Gordon |
| tenguyama-hitetsu | 749 | Tenguyama Hitetsu |
| musshuru | 751 | Musshuru |
| apis | 752 | Apis |
| bokuden | 753 | Bokuden |
| orlombus | 754 | Orlombus |
| zenny | 758 | Zenny |
| wetton | 759 | Wetton |
| bigalo | 760 | Bigalo |
| punk-01-shaka | 763 | Punk 01 - Shaka |
| punk-02-lilith | 764 | Punk 02 - Lilith |
| punk-03-edison | 765 | Punk 03 - Edison |
| punk-04-pythagoras | 766 | Punk 04 - Pythagoras |
| punk-05-atlas | 767 | Punk 05 - Atlas |
| punk-06-york | 768 | Punk 06 - York |
| karazu | 773 | Karazu |
| imu-neronna | 779 | Imu Neronna |
| vegapunk-shaka | 781 | Vegapunk “Shaka” |
| vegapunk-lilith | 782 | Vegapunk “Lilith” |
| vegapunk-edison | 783 | Vegapunk “Edison” |
| vegapunk-pythagoras | 784 | Vegapunk “Pythagoras” |
| vegapunk-atlas | 785 | Vegapunk “Atlas” |
| vegapunk-york | 786 | Vegapunk “York” |

### Personnages : Fandom sans équivalent api-onepiece, créées (903)

| Slug | Page Fandom | Raison |
| --- | --- | --- |
| yasopp | Yasopp | déjà créée (id connu) |
| helmeppo | Helmeppo | déjà créée (id connu) |
| bell-mere | Bell-mère | déjà créée (id connu) |
| hiriluk | Hiriluk | déjà créée (id connu) |
| nugire-yainu | Nugire Yainu | déjà créée (id connu) |
| chew | Chew | déjà créée (id connu) |
| hatchan | Hatchan | déjà créée (id connu) |
| rika | Rika | déjà créée (id connu) |
| mohji | Mohji | déjà créée (id connu) |
| daz-bonez | Daz Bonez | déjà créée (id connu) |
| terracotta | Terracotta | déjà créée (id connu) |
| miss-friday | Miss Friday | déjà créée (id connu) |
| sam | Sam | déjà créée (id connu) |
| momoo | Momoo | déjà créée (id connu) |
| thalassa-lucas | Thalassa Lucas | déjà créée (id connu) |
| doc-q | Doc Q | déjà créée (id connu) |
| baskerville | Baskerville | déjà créée (id connu) |
| corgi | Corgi | déjà créée (id connu) |
| richie | Richie | déjà créée (id connu) |
| gin | Gin | déjà créée (id connu) |
| chessmarimo | Chessmarimo | déjà créée (id connu) |
| big-pan | Big Pan | déjà créée (id connu) |
| itomimizu | Itomimizu | déjà créée (id connu) |
| monda | Monda | déjà créée (id connu) |
| pickles | Pickles | déjà créée (id connu) |
| roshio | Roshio | déjà créée (id connu) |
| roji | Roji | déjà créée (id connu) |
| mikazuki | Mikazuki | déjà créée (id connu) |
| ripper | Ripper | déjà créée (id connu) |
| paulie | Paulie | déjà créée (id connu) |
| attach | Attach | déjà créée (id connu) |
| banchi | Banchi | déjà créée (id connu) |
| kappa | Kappa | déjà créée (id connu) |
| mr-11 | Mr. 11 | déjà créée (id connu) |
| kurotsuru | Kurotsuru | déjà créée (id connu) |
| matsuge | Matsuge | déjà créée (id connu) |
| hasami | Hasami | déjà créée (id connu) |
| goro | Goro | déjà créée (id connu) |
| su | Su | déjà créée (id connu) |
| tamanegi | Tamanegi | déjà créée (id connu) |
| raki | Raki | déjà créée (id connu) |
| ohm | Ohm | déjà créée (id connu) |
| ririka | Ririka | déjà créée (id connu) |
| holy | Holy | déjà créée (id connu) |
| mckinley | McKinley | déjà créée (id connu) |
| moda | Moda | déjà créée (id connu) |
| lord-of-the-coast-long-ring-long-land | Lord of the Coast (Long Ring Long Land) | déjà créée (id connu) |
| lord-of-the-coast | Lord of the Coast | déjà créée (id connu) |
| gomorrah | Gomorrah | déjà créée (id connu) |
| mr-6 | Mr. 6 | déjà créée (id connu) |
| mr-7 | Mr. 7 | déjà créée (id connu) |
| miss-fathers-day | Miss Father's Day | déjà créée (id connu) |
| yu | Yu | déjà créée (id connu) |
| sapi | Sapi | déjà créée (id connu) |
| negikuma-maria | Negikuma Maria | déjà créée (id connu) |
| camel | Camel | déjà créée (id connu) |
| aswa | Aswa | déjà créée (id connu) |
| agotogi | Agotogi | déjà créée (id connu) |
| octopako | Octopako | déjà créée (id connu) |
| goldfish-princess | Goldfish Princess | déjà créée (id connu) |
| erik | Erik | déjà créée (id connu) |
| pisaro | Pisaro | déjà créée (id connu) |
| mr-13 | Mr. 13 | déjà créée (id connu) |
| miss-thursday | Miss Thursday | déjà créée (id connu) |
| miss-saturday | Miss Saturday | déjà créée (id connu) |
| miss-tuesday | Miss Tuesday | déjà créée (id connu) |
| miss-mothers-day | Miss Mother's Day | déjà créée (id connu) |
| mr-10 | Mr. 10 | déjà créée (id connu) |
| mr-12 | Mr. 12 | déjà créée (id connu) |
| rokkaku | Rokkaku | déjà créée (id connu) |
| island-eater | Island Eater | déjà créée (id connu) |
| ninjin | Ninjin | déjà créée (id connu) |
| capote | Capote | déjà créée (id connu) |
| ideaman | Ideaman | déjà créée (id connu) |
| hustle | Hustle | déjà créée (id connu) |
| kagikko | Kagikko | déjà créée (id connu) |
| ross | Ross | déjà créée (id connu) |
| eddy | Eddy | déjà créée (id connu) |
| hewitt | Hewitt | déjà créée (id connu) |
| rivers | Rivers | déjà créée (id connu) |
| mani | Mani | déjà créée (id connu) |
| muret | Muret | déjà créée (id connu) |
| sodom | Sodom | déjà créée (id connu) |
| kumadori-yamanbako | Kumadori Yamanbako | déjà créée (id connu) |
| teru | Teru | déjà créée (id connu) |
| take | Take | déjà créée (id connu) |
| kaneshiro | Kaneshiro | déjà créée (id connu) |
| shioyaki | Shioyaki | déjà créée (id connu) |
| tyrannosaurus | Tyrannosaurus | déjà créée (id connu) |
| tomato-gang | Tomato Gang | déjà créée (id connu) |
| fuza | Fuza | déjà créée (id connu) |
| piiman | Piiman | déjà créée (id connu) |
| cerberus | Cerberus | déjà créée (id connu) |
| hildon | Hildon | déjà créée (id connu) |
| victoria-cindry | Victoria Cindry | déjà créée (id connu) |
| gally | Gally | déjà créée (id connu) |
| kumashi | Kumashi | déjà créée (id connu) |
| oars | Oars | déjà créée (id connu) |
| utan-divers | Utan Divers | déjà créée (id connu) |
| yuki | Yuki | déjà créée (id connu) |
| tightrope-walking-funan-bros | Tightrope Walking Funan Bros | déjà créée (id connu) |
| mr-mellow | Mr. Mellow | déjà créée (id connu) |
| michael-and-hoichael | Michael and Hoichael | déjà créée (id connu) |
| marine-headquarters-court | Marine Headquarters Court | déjà créée (id connu) |
| jigoro | Jigoro | déjà créée (id connu) |
| tsukimi | Tsukimi | déjà créée (id connu) |
| tararan | Tararan | déjà créée (id connu) |
| robson | Robson | déjà créée (id connu) |
| terry | Terry | déjà créée (id connu) |
| miss-catherina | Miss Catherina | déjà créée (id connu) |
| tsumegeri-guards | Tsumegeri Guards | déjà créée (id connu) |
| ho | Ho | déjà créée (id connu) |
| bogard | Bogard | déjà créée (id connu) |
| ultraking | Ultraking | déjà créée (id connu) |
| inuppe | Inuppe | déjà créée (id connu) |
| margarita | Margarita | déjà créée (id connu) |
| spoil | Spoil | déjà créée (id connu) |
| buhichuck | Buhichuck | déjà créée (id connu) |
| heppoko | Heppoko | déjà créée (id connu) |
| seto | Seto | déjà créée (id connu) |
| soro | Soro | déjà créée (id connu) |
| lines | Lines | déjà créée (id connu) |
| mashikaku | Mashikaku | déjà créée (id connu) |
| shine | Shine | déjà créée (id connu) |
| makko | Makko | déjà créée (id connu) |
| puppu | Puppu | déjà créée (id connu) |
| yurikah | Yurikah | déjà créée (id connu) |
| mikio-itoo | Mikio Itoo | déjà créée (id connu) |
| mousse | Mousse | déjà créée (id connu) |
| gyaro | Gyaro | déjà créée (id connu) |
| tansui | Tansui | déjà créée (id connu) |
| tamachibi | Tamachibi | déjà créée (id connu) |
| koze-and-packy | Koze and Packy | déjà créée (id connu) |
| anjo | Anjo | déjà créée (id connu) |
| gyoru | Gyoru | déjà créée (id connu) |
| chicken | Chicken | déjà créée (id connu) |
| pinky | Pinky | déjà créée (id connu) |
| hocker | Hocker | déjà créée (id connu) |
| poro | Poro | déjà créée (id connu) |
| mornin | Mornin | déjà créée (id connu) |
| mr-beans | Mr. Beans | déjà créée (id connu) |
| mr-shimizu | Mr. Shimizu | déjà créée (id connu) |
| akumai | Akumai | déjà créée (id connu) |
| motzel | Motzel | déjà créée (id connu) |
| moodie | Moodie | déjà créée (id connu) |
| batchee | Batchee | déjà créée (id connu) |
| cocox | Cocox | déjà créée (id connu) |
| mummy-mee | Mummy Mee | déjà créée (id connu) |
| koala-mercenaries | Koala Mercenaries | déjà créée (id connu) |
| okame | Okame | déjà créée (id connu) |
| kebi | Kebi | déjà créée (id connu) |
| natto | Natto | déjà créée (id connu) |
| hanger | Hanger | déjà créée (id connu) |
| samurai-batts | Samurai Batts | déjà créée (id connu) |
| yoshimoto | Yoshimoto | déjà créée (id connu) |
| farafra | Farafra | déjà créée (id connu) |
| maidy | Maidy | déjà créée (id connu) |
| potsun | Potsun | déjà créée (id connu) |
| mr-love | Mr. Love | déjà créée (id connu) |
| spector | Spector | déjà créée (id connu) |
| okome | Okome | déjà créée (id connu) |
| shandia-chief | Shandia Chief | déjà créée (id connu) |
| mansions-guards | Mansion's Guards | déjà créée (id connu) |
| spacey | Spacey | déjà créée (id connu) |
| devil-dias | Devil Dias | déjà créée (id connu) |
| rosward-shalria | Rosward Shalria | déjà créée (id connu) |
| kashigami | Kashigami | déjà créée (id connu) |
| marilyn | Marilyn | déjà créée (id connu) |
| tamagon | Tamagon | déjà créée (id connu) |
| happa-yamao | Happa Yamao | déjà créée (id connu) |
| gatherine | Gatherine | déjà créée (id connu) |
| saru | Saru | déjà créée (id connu) |
| antonio | Antonio | déjà créée (id connu) |
| bimine | Bimine | déjà créée (id connu) |
| marumieta | Marumieta | déjà créée (id connu) |
| yamenahare | Yamenahare | déjà créée (id connu) |
| motobaro | Motobaro | déjà créée (id connu) |
| rosward-charlos | Rosward Charlos | déjà créée (id connu) |
| peterman | Peterman | déjà créée (id connu) |
| marie | Marie | déjà créée (id connu) |
| byron | Byron | déjà créée (id connu) |
| pascia | Pascia | déjà créée (id connu) |
| lacuba | Lacuba | déjà créée (id connu) |
| ukkari | Ukkari | déjà créée (id connu) |
| unforgivable-mask | Unforgivable Mask | déjà créée (id connu) |
| marguerite | Marguerite | déjà créée (id connu) |
| aphelandra | Aphelandra | déjà créée (id connu) |
| sweet-pea | Sweet Pea | déjà créée (id connu) |
| belladonna | Belladonna | déjà créée (id connu) |
| gloriosa | Gloriosa | déjà créée (id connu) |
| kikyo | Kikyo | déjà créée (id connu) |
| kiku-kuja | Kiku (Kuja) | déjà créée (id connu) |
| shion | Shion | déjà créée (id connu) |
| poppy | Poppy | déjà créée (id connu) |
| daisy | Daisy | déjà créée (id connu) |
| ran | Ran | déjà créée (id connu) |
| enishida | Enishida | déjà créée (id connu) |
| risky-brothers | Risky Brothers | déjà créée (id connu) |
| bacura | Bacura | déjà créée (id connu) |
| kakukaku | Kakukaku | déjà créée (id connu) |
| schollzo | Schollzo | déjà créée (id connu) |
| kiev | Kiev | déjà créée (id connu) |
| taroimo | Taroimo | déjà créée (id connu) |
| pandawomanmi | Pandawomanmi | déjà créée (id connu) |
| chuchun | Chuchun | déjà créée (id connu) |
| kop | Kop | déjà créée (id connu) |
| mizuta-madaisuki | Mizuta Madaisuki | déjà créée (id connu) |
| sphinx | Sphinx | déjà créée (id connu) |
| basilisk | Basilisk | déjà créée (id connu) |
| sonieh | Sonieh | déjà créée (id connu) |
| donovan | Donovan | déjà créée (id connu) |
| gina | Gina | déjà créée (id connu) |
| kibagaeru | Kibagaeru | déjà créée (id connu) |
| dirt-boss | Dirt Boss | déjà créée (id connu) |
| forest-boss | Forest Boss | déjà créée (id connu) |
| blue-fan | Blue Fan | déjà créée (id connu) |
| nerine | Nerine | déjà créée (id connu) |
| rindo | Rindo | déjà créée (id connu) |
| cosmos | Cosmos | déjà créée (id connu) |
| flare | Flare | déjà créée (id connu) |
| decalvan-brothers | Decalvan Brothers | déjà créée (id connu) |
| gill-bastar | Gill Bastar | déjà créée (id connu) |
| little-oars-jr | Little Oars Jr. | déjà créée (id connu) |
| tibany | Tibany | déjà créée (id connu) |
| stalker | Stalker | déjà créée (id connu) |
| kitton | Kitton | déjà créée (id connu) |
| lola-zombie | Lola (Zombie) | déjà créée (id connu) |
| risky-brothers-zombies | Risky Brothers (Zombies) | déjà créée (id connu) |
| gyoro-nin-and-bao | Gyoro, Nin, and Bao | déjà créée (id connu) |
| salome | Salome | déjà créée (id connu) |
| chadros-higelyges | Chadros Higelyges | déjà créée (id connu) |
| hack-archaeologist | Hack (Archaeologist) | déjà créée (id connu) |
| busshiri | Busshiri | déjà créée (id connu) |
| roche | Roche | déjà créée (id connu) |
| zadie | Zadie | déjà créée (id connu) |
| rint | Rint | déjà créée (id connu) |
| gram | Gram | déjà créée (id connu) |
| namur | Namur | déjà créée (id connu) |
| caroline | Caroline | déjà créée (id connu) |
| stefan | Stefan | déjà créée (id connu) |
| pekkori | Pekkori | déjà créée (id connu) |
| domo-kun-and-nnke-kun | Domo-kun and Nnke-kun | déjà créée (id connu) |
| daddy-dee | Daddy Dee | déjà créée (id connu) |
| glove | Glove | déjà créée (id connu) |
| sea-boar | Sea Boar | déjà créée (id connu) |
| mash | Mash | déjà créée (id connu) |
| albion | Albion | déjà créée (id connu) |
| lip-doughty | Lip Doughty | déjà créée (id connu) |
| wallem | Wallem | déjà créée (id connu) |
| surume | Surume | déjà créée (id connu) |
| kibin | Kibin | déjà créée (id connu) |
| wadatsumi | Wadatsumi | déjà créée (id connu) |
| vander-decken | Vander Decken | déjà créée (id connu) |
| ankoro | Ankoro | déjà créée (id connu) |
| hammond | Hammond | déjà créée (id connu) |
| stainless | Stainless | déjà créée (id connu) |
| medaka-mermaid-quintuplets | Medaka Mermaid Quintuplets | déjà créée (id connu) |
| nika | Nika | déjà créée (id connu) |
| splash-and-splatter | Splash and Splatter | déjà créée (id connu) |
| ishilly | Ishilly | déjà créée (id connu) |
| marin | Marin | déjà créée (id connu) |
| gyro | Gyro | déjà créée (id connu) |
| minister-of-the-right | Minister of the Right | déjà créée (id connu) |
| minister-of-the-left | Minister of the Left | déjà créée (id connu) |
| laskey | Laskey | déjà créée (id connu) |
| penguin | Penguin | déjà créée (id connu) |
| rainbow-moray-eel-brothers | Rainbow Moray Eel Brothers | déjà créée (id connu) |
| joy-boy | Joy Boy | déjà créée (id connu) |
| daidalos | Daidalos | déjà créée (id connu) |
| jean-noueilles | Jean Noueilles | déjà créée (id connu) |
| maria-napole | Maria Napole | déjà créée (id connu) |
| kasagoba | Kasagoba | déjà créée (id connu) |
| bobbin | Bobbin | déjà créée (id connu) |
| mero | Mero | déjà créée (id connu) |
| seira | Seira | déjà créée (id connu) |
| hiramera | Hiramera | déjà créée (id connu) |
| kairen | Kairen | déjà créée (id connu) |
| asahija | Asahija | déjà créée (id connu) |
| fishbonen | Fishbonen | déjà créée (id connu) |
| terry-gilteo | Terry Gilteo | déjà créée (id connu) |
| koda | Koda | déjà créée (id connu) |
| kouzuki-momonosuke | Kouzuki Momonosuke | déjà créée (id connu) |
| fillonce | Fillonce | déjà créée (id connu) |
| lulis | Lulis | déjà créée (id connu) |
| bunny-joe | Bunny Joe | déjà créée (id connu) |
| isa | Isa | déjà créée (id connu) |
| bellett | Bellett | déjà créée (id connu) |
| kasa | Kasa | déjà créée (id connu) |
| galaxy | Galaxy | déjà créée (id connu) |
| seamars | Seamars | déjà créée (id connu) |
| hakowan | Hakowan | déjà créée (id connu) |
| mocdonald | MocDonald | déjà créée (id connu) |
| unigaro | Unigaro | déjà créée (id connu) |
| macro-automaton | Macro (Automaton) | déjà créée (id connu) |
| cosmo | Cosmo | déjà créée (id connu) |
| papaneel | Papaneel | déjà créée (id connu) |
| sancrin | Sancrin | déjà créée (id connu) |
| kiba | Kiba | déjà créée (id connu) |
| herb | Herb | déjà créée (id connu) |
| judy | Judy | déjà créée (id connu) |
| kyukyu | Kyukyu | déjà créée (id connu) |
| egana | Egana | déjà créée (id connu) |
| goo | Goo | déjà créée (id connu) |
| junan | Junan | déjà créée (id connu) |
| chesskippa | Chesskippa | déjà créée (id connu) |
| humphrey | Humphrey | déjà créée (id connu) |
| kanezenny | Kanezenny | déjà créée (id connu) |
| nigeratta | Nigeratta | déjà créée (id connu) |
| shanba | Shanba | déjà créée (id connu) |
| kairiken | Kairiken | déjà créée (id connu) |
| minoruba | Minoruba | déjà créée (id connu) |
| jobo | Jobo | déjà créée (id connu) |
| ahho-desunen-ix | Ahho Desunen IX | déjà créée (id connu) |
| ahho-zurako | Ahho Zurako | déjà créée (id connu) |
| warashi | Warashi | déjà créée (id connu) |
| gode | Gode | déjà créée (id connu) |
| mayushika | Mayushika | déjà créée (id connu) |
| yotsubane | Yotsubane | déjà créée (id connu) |
| moyle | Moyle | déjà créée (id connu) |
| mochi | Mochi | déjà créée (id connu) |
| stevie | Stevie | déjà créée (id connu) |
| ishigo-shitemanna | Ishigo Shitemanna | déjà créée (id connu) |
| oran | Oran | déjà créée (id connu) |
| mizuira | Mizuira | déjà créée (id connu) |
| kyuji | Kyuji | déjà créée (id connu) |
| haritsu-kendiyo | Haritsu Kendiyo | déjà créée (id connu) |
| royder | Royder | déjà créée (id connu) |
| z | Z | déjà créée (id connu) |
| yeti-cool-brothers | Yeti Cool Brothers | déjà créée (id connu) |
| doran | Doran | déjà créée (id connu) |
| sind | Sind | déjà créée (id connu) |
| ally | Ally | déjà créée (id connu) |
| mocha | Mocha | déjà créée (id connu) |
| kumae | Kumae | déjà créée (id connu) |
| togare | Togare | déjà créée (id connu) |
| smooge | Smooge | déjà créée (id connu) |
| fen-bock | Fen Bock | déjà créée (id connu) |
| chappe | Chappe | déjà créée (id connu) |
| pansy | Pansy | déjà créée (id connu) |
| yarisugi | Yarisugi | déjà créée (id connu) |
| run | Run | déjà créée (id connu) |
| konbu | Konbu | déjà créée (id connu) |
| uzu | Uzu | déjà créée (id connu) |
| biyo | Biyo | déjà créée (id connu) |
| roxanne | Roxanne | déjà créée (id connu) |
| mario | Mario | déjà créée (id connu) |
| gaburu | Gaburu | déjà créée (id connu) |
| spartan | Spartan | déjà créée (id connu) |
| hera-gladiator | Hera (Gladiator) | déjà créée (id connu) |
| meadows | Meadows | déjà créée (id connu) |
| mummy | Mummy | déjà créée (id connu) |
| damask | Damask | déjà créée (id connu) |
| jean-ango | Jean Ango | déjà créée (id connu) |
| agyo | Agyo | déjà créée (id connu) |
| ucy | Ucy | déjà créée (id connu) |
| rolling-logan | Rolling Logan | déjà créée (id connu) |
| acilia | Acilia | déjà créée (id connu) |
| bushon | Bushon | déjà créée (id connu) |
| candre | Candre | déjà créée (id connu) |
| wicca | Wicca | déjà créée (id connu) |
| flapper | Flapper | déjà créée (id connu) |
| esta | Esta | déjà créée (id connu) |
| milo | Milo | déjà créée (id connu) |
| farul | Farul | déjà créée (id connu) |
| mizuta-mawaritosuki | Mizuta Mawaritosuki | déjà créée (id connu) |
| ginko | Ginko | déjà créée (id connu) |
| george-mach | George Mach | déjà créée (id connu) |
| mountain-ricky | Mountain Ricky | déjà créée (id connu) |
| rampo | Rampo | déjà créée (id connu) |
| ibusu | Ibusu | déjà créée (id connu) |
| bomba | Bomba | déjà créée (id connu) |
| grabar | Grabar | déjà créée (id connu) |
| bobomba | Bobomba | déjà créée (id connu) |
| aremo-ganmi | Aremo Ganmi | déjà créée (id connu) |
| maujii | Maujii | déjà créée (id connu) |
| nubon | Nubon | déjà créée (id connu) |
| baxcon | Baxcon | déjà créée (id connu) |
| cotton | Cotton | déjà créée (id connu) |
| inhel | Inhel | déjà créée (id connu) |
| daikon | Daikon | déjà créée (id connu) |
| pellini | Pellini | déjà créée (id connu) |
| bakezo | Bakezo | déjà créée (id connu) |
| pike | Pike | déjà créée (id connu) |
| jero | Jero | déjà créée (id connu) |
| gal | Gal | déjà créée (id connu) |
| chao | Chao | déjà créée (id connu) |
| kyuin | Kyuin | déjà créée (id connu) |
| poppoko | Poppoko | déjà créée (id connu) |
| peppoko | Peppoko | déjà créée (id connu) |
| mukkashimi-tower | Mukkashimi Tower | déjà créée (id connu) |
| trafalgar-lami | Trafalgar Lami | déjà créée (id connu) |
| wellington | Wellington | déjà créée (id connu) |
| diez-barrels | Diez Barrels | déjà créée (id connu) |
| uholisia | Uholisia | déjà créée (id connu) |
| russian | Russian | déjà créée (id connu) |
| gimlet | Gimlet | déjà créée (id connu) |
| mr-7-previous | Mr. 7 (Previous) | déjà créée (id connu) |
| columbus | Columbus | déjà créée (id connu) |
| edward-weevil | Edward Weevil | déjà créée (id connu) |
| buckingham-stussy | Buckingham Stussy | déjà créée (id connu) |
| bariete | Bariete | déjà créée (id connu) |
| roddy | Roddy | déjà créée (id connu) |
| blackback | Blackback | déjà créée (id connu) |
| wany | Wany | déjà créée (id connu) |
| nekomamushi | Nekomamushi | déjà créée (id connu) |
| inuarashi | Inuarashi | déjà créée (id connu) |
| miyagi | Miyagi | déjà créée (id connu) |
| tristan | Tristan | déjà créée (id connu) |
| shishilian | Shishilian | déjà créée (id connu) |
| monjii | Monjii | déjà créée (id connu) |
| ryunosuke | Ryunosuke | déjà créée (id connu) |
| raise-max | Raise Max | déjà créée (id connu) |
| hippo-gentleman | Hippo Gentleman | déjà créée (id connu) |
| uhho | Uhho | déjà créée (id connu) |
| shin-jaiya | Shin Jaiya | déjà créée (id connu) |
| shin-detamaruka | Shin Detamaruka | déjà créée (id connu) |
| tegata-ringana | Tegata Ringana | déjà créée (id connu) |
| yomo | Yomo | déjà créée (id connu) |
| nitro | Nitro | déjà créée (id connu) |
| rabiyan | Rabiyan | déjà créée (id connu) |
| milky | Milky | déjà créée (id connu) |
| randolph | Randolph | déjà créée (id connu) |
| capone-pez | Capone Pez | déjà créée (id connu) |
| pound | Pound | déjà créée (id connu) |
| cosette | Cosette | déjà créée (id connu) |
| eponi | Époni | déjà créée (id connu) |
| ikkaku | Ikkaku | déjà créée (id connu) |
| uni | Uni | déjà créée (id connu) |
| clione | Clione | déjà créée (id connu) |
| diesel | Diesel | déjà créée (id connu) |
| noble-croc | Noble Croc | déjà créée (id connu) |
| zepo | Zepo | déjà créée (id connu) |
| all-hunt-grount | All-Hunt Grount | déjà créée (id connu) |
| ant-de-bonham | Ant De Bonham | déjà créée (id connu) |
| shimoi-zappa | Shimoi Zappa | déjà créée (id connu) |
| carmel | Carmel | déjà créée (id connu) |
| lu-feld | Lu Feld | déjà créée (id connu) |
| drug-peclo | Drug Peclo | déjà créée (id connu) |
| jigra | Jigra | déjà créée (id connu) |
| giberson | Giberson | déjà créée (id connu) |
| umit | Umit | déjà créée (id connu) |
| puggy | Puggy | déjà créée (id connu) |
| eiri | Eiri | déjà créée (id connu) |
| raideen | Raideen | déjà créée (id connu) |
| pandora | Pandora | déjà créée (id connu) |
| masked-deuce | Masked Deuce | déjà créée (id connu) |
| lady-tree | Lady Tree | déjà créée (id connu) |
| faust | Faust | déjà créée (id connu) |
| saber | Saber | déjà créée (id connu) |
| aggie-68 | Aggie 68 | déjà créée (id connu) |
| isuka | Isuka | déjà créée (id connu) |
| finamore | Finamore | déjà créée (id connu) |
| ducky-bree | Ducky Bree | déjà créée (id connu) |
| leonero | Leonero | déjà créée (id connu) |
| barry | Barry | déjà créée (id connu) |
| ossamondo | Ossamondo | déjà créée (id connu) |
| wallace | Wallace | déjà créée (id connu) |
| kukai | Kukai | déjà créée (id connu) |
| dogya | Dogya | déjà créée (id connu) |
| hublot | Hublot | déjà créée (id connu) |
| kimel | Kimel | déjà créée (id connu) |
| banshee | Banshee | déjà créée (id connu) |
| cornelia | Cornelia | déjà créée (id connu) |
| mihar | Mihar | déjà créée (id connu) |
| kotatsu | Kotatsu | déjà créée (id connu) |
| skull | Skull | déjà créée (id connu) |
| chichilisia | Chichilisia | déjà créée (id connu) |
| buche | Buche | déjà créée (id connu) |
| charlotte-custard | Charlotte Custard | déjà créée (id connu) |
| charlotte-myukuru | Charlotte Myukuru | déjà créée (id connu) |
| usagihebi | Usagihebi | déjà créée (id connu) |
| lionbuta | Lionbuta | déjà créée (id connu) |
| nyasha | Nyasha | déjà créée (id connu) |
| charlotte-cinnamon | Charlotte Cinnamon | déjà créée (id connu) |
| charlotte-yuen | Charlotte Yuen | déjà créée (id connu) |
| charlotte-decuplets | Charlotte Decuplets | déjà créée (id connu) |
| eggplant-soldier | Eggplant Soldier | déjà créée (id connu) |
| komane | Komane | déjà créée (id connu) |
| peachbeard | Peachbeard | déjà créée (id connu) |
| beer-vi | Beer VI | déjà créée (id connu) |
| matryo-princesses | Matryo Princesses | déjà créée (id connu) |
| ham-burger | Ham Burger | déjà créée (id connu) |
| mororon | Mororon | déjà créée (id connu) |
| nerona-imu | Nerona Imu | déjà créée (id connu) |
| raccoon | Raccoon | déjà créée (id connu) |
| tama-sphinx | Tama (Sphinx) | alias `api-onepiece: null` |
| hihimaru | Hihimaru | déjà créée (id connu) |
| oliva | Oliva | déjà créée (id connu) |
| kotetsu | Kotetsu | déjà créée (id connu) |
| savarin | Savarin | déjà créée (id connu) |
| urashima | Urashima | déjà créée (id connu) |
| choco-police | Choco Police | déjà créée (id connu) |
| kamijiro | Kamijiro | déjà créée (id connu) |
| jibuemon | Jibuemon | déjà créée (id connu) |
| charlotte-nutmeg | Charlotte Nutmeg | déjà créée (id connu) |
| charlotte-akimeg | Charlotte Akimeg | déjà créée (id connu) |
| charlotte-allmeg | Charlotte Allmeg | déjà créée (id connu) |
| charlotte-harumeg | Charlotte Harumeg | déjà créée (id connu) |
| charlotte-fuyumeg | Charlotte Fuyumeg | déjà créée (id connu) |
| gorobe | Gorobe | déjà créée (id connu) |
| louis-arnote | Louis Arnote | déjà créée (id connu) |
| dobon | Dobon | déjà créée (id connu) |
| suke | Suke | déjà créée (id connu) |
| kuni | Kuni | déjà créée (id connu) |
| kaku-wano | Kaku (Wano) | déjà créée (id connu) |
| bingo | Bingo | déjà créée (id connu) |
| bomba-marine | Bomba (Marine) | déjà créée (id connu) |
| kumagoro | Kumagoro | déjà créée (id connu) |
| kobe | Kobe | déjà créée (id connu) |
| kisegawa | Kisegawa | déjà créée (id connu) |
| tokijiro | Tokijiro | déjà créée (id connu) |
| rakuda | Rakuda | déjà créée (id connu) |
| ipponume | Ipponume | déjà créée (id connu) |
| candy | Candy | déjà créée (id connu) |
| stealth-black | Stealth Black | déjà créée (id connu) |
| minatomo-wano | Minatomo (Wano) | déjà créée (id connu) |
| minatomo-east-blue | Minatomo (East Blue) | déjà créée (id connu) |
| babanuki | Babanuki | déjà créée (id connu) |
| daifugo | Daifugo | déjà créée (id connu) |
| dragon-number-thirteen | Dragon Number Thirteen | déjà créée (id connu) |
| pankuta-dakeyan | Pankuta Dakeyan | déjà créée (id connu) |
| an-zengaiina | An Zengaiina | déjà créée (id connu) |
| jean-goen | Jean Goen | déjà créée (id connu) |
| madilloman | Madilloman | déjà créée (id connu) |
| bungo | Bungo | déjà créée (id connu) |
| bongo | Bongo | déjà créée (id connu) |
| saki | Saki | déjà créée (id connu) |
| han | Han | déjà créée (id connu) |
| dobby-ibadonbo | Dobby Ibadonbo | déjà créée (id connu) |
| kairo-kureyo | Kairo Kureyo | déjà créée (id connu) |
| zotto | Zotto | déjà créée (id connu) |
| kinoko | Kinoko | déjà créée (id connu) |
| francois | Francois | déjà créée (id connu) |
| tsunokkov | Tsunokkov | déjà créée (id connu) |
| usakkov | Usakkov | déjà créée (id connu) |
| muchana | Muchana | déjà créée (id connu) |
| victoria-shiruton-doruyanaika | Victoria Shiruton Doruyanaika | déjà créée (id connu) |
| shimotsuki-yasuie | Shimotsuki Yasuie | déjà créée (id connu) |
| doha-ittanka-ii | Doha Ittanka II | déjà créée (id connu) |
| sukoshiba-kanishitoru | Sukoshiba Kanishitoru | déjà créée (id connu) |
| zabo | Zabo | déjà créée (id connu) |
| ban-dedessinee | Ban Dedessinée | déjà créée (id connu) |
| tea-iv | Tea IV | déjà créée (id connu) |
| lemoncheese | Lemoncheese | déjà créée (id connu) |
| seki | Seki | déjà créée (id connu) |
| jeep | Jeep | déjà créée (id connu) |
| potaufeu | Potaufeu | déjà créée (id connu) |
| samosa | Samosa | déjà créée (id connu) |
| ahiru | Ahiru | déjà créée (id connu) |
| davy-d-jones | Davy D. Jones | déjà créée (id connu) |
| eikon | Eikon | déjà créée (id connu) |
| chicory | Chicory | déjà créée (id connu) |
| shimotsuki-ushimaru | Shimotsuki Ushimaru | déjà créée (id connu) |
| ochoku | Ochoku | déjà créée (id connu) |
| nazu-ketagari | Nazu Ketagari | déjà créée (id connu) |
| katsuzo | Katsuzo | déjà créée (id connu) |
| kurokoma | Kurokoma | déjà créée (id connu) |
| mountain-god | Mountain God | déjà créée (id connu) |
| hitsugisukan | Hitsugisukan | déjà créée (id connu) |
| gama-pyonnosuke | Gama Pyonnosuke | déjà créée (id connu) |
| chome | Chome | déjà créée (id connu) |
| petermoo | Petermoo | déjà créée (id connu) |
| sunbell | Sunbell | déjà créée (id connu) |
| ganryu-roger-pirates | Ganryu (Roger Pirates) | déjà créée (id connu) |
| koyama | Koyama | déjà créée (id connu) |
| max-marx | MAX Marx | déjà créée (id connu) |
| tsugaru-umi | Tsugaru Umi | déjà créée (id connu) |
| brontosaurus | Brontosaurus | déjà créée (id connu) |
| hareji | Hareji | déjà créée (id connu) |
| zangirimaru | Zangirimaru | déjà créée (id connu) |
| hanji-prisoner | Hanji (Prisoner) | déjà créée (id connu) |
| toyama-tsujigiro | Toyama Tsujigiro | déjà créée (id connu) |
| gorishiro | Gorishiro | déjà créée (id connu) |
| ruibe | Ruibe | déjà créée (id connu) |
| banzaburo | Banzaburo | déjà créée (id connu) |
| hyoutauros | Hyoutauros | déjà créée (id connu) |
| kirintauros | Kirintauros | déjà créée (id connu) |
| kirinkodanuki | Kirinkodanuki | déjà créée (id connu) |
| master | Master | déjà créée (id connu) |
| tate | Tate | déjà créée (id connu) |
| oide | Oide | déjà créée (id connu) |
| massui | Massui | déjà créée (id connu) |
| giro-chintaro | Giro Chintaro | déjà créée (id connu) |
| hana | Hana | déjà créée (id connu) |
| tarara | Tarara | déjà créée (id connu) |
| aruyutayan-v | Aruyutayan V | déjà créée (id connu) |
| ubau | Ubau | déjà créée (id connu) |
| saikoro | Saikoro | déjà créée (id connu) |
| chiya | Chiya | déjà créée (id connu) |
| honner | Honner | déjà créée (id connu) |
| kagero | Kagero | déjà créée (id connu) |
| kikipatsu | Kikipatsu | déjà créée (id connu) |
| coburn | Coburn | déjà créée (id connu) |
| iwatobi | Iwatobi | déjà créée (id connu) |
| maki | Maki | déjà créée (id connu) |
| tori | Tori | déjà créée (id connu) |
| moqueca | Moqueca | déjà créée (id connu) |
| hiroshi | Hiroshi | déjà créée (id connu) |
| wakasa | Wakasa | déjà créée (id connu) |
| chap | Chap | déjà créée (id connu) |
| serizawa | Serizawa | déjà créée (id connu) |
| sauce | Sauce | déjà créée (id connu) |
| neggy | Neggy | déjà créée (id connu) |
| wheel | Wheel | déjà créée (id connu) |
| furrari | Furrari | déjà créée (id connu) |
| pudos | Pudos | déjà créée (id connu) |
| ikkaku-wano | Ikkaku (Wano) | déjà créée (id connu) |
| tritobu | Tritobu | déjà créée (id connu) |
| chocho | Chocho | déjà créée (id connu) |
| inoichibannosuke | Inoichibannosuke | déjà créée (id connu) |
| tabuhachiro | Tabuhachiro | déjà créée (id connu) |
| cezar | Cezar | déjà créée (id connu) |
| couran | Couran | déjà créée (id connu) |
| nashi | Nashi | déjà créée (id connu) |
| mari | Mari | déjà créée (id connu) |
| stroganoff | Stroganoff | déjà créée (id connu) |
| kurosawa | Kurosawa | déjà créée (id connu) |
| kamekichi | Kamekichi | déjà créée (id connu) |
| ukon | Ukon | déjà créée (id connu) |
| hidayu | Hidayu | déjà créée (id connu) |
| ginnosuke | Ginnosuke | déjà créée (id connu) |
| chihaya | Chihaya | déjà créée (id connu) |
| yokan | Yokan | déjà créée (id connu) |
| hara | Hara | déjà créée (id connu) |
| atagoyama | Atagoyama | déjà créée (id connu) |
| kinbo | Kinbo | déjà créée (id connu) |
| yame | Yame | déjà créée (id connu) |
| monjiro | Monjiro | déjà créée (id connu) |
| jujiro | Jujiro | déjà créée (id connu) |
| shinosuke | Shinosuke | déjà créée (id connu) |
| takao | Takao | déjà créée (id connu) |
| waruno-furishiro | Waruno Furishiro | déjà créée (id connu) |
| akudai-kanzaburo | Akudai Kanzaburo | déjà créée (id connu) |
| home | Home | déjà créée (id connu) |
| sugamichi-and-warazane | Sugamichi and Warazane | déjà créée (id connu) |
| ibiributsu | Ibiributsu | déjà créée (id connu) |
| donannoyo | Donannoyo | déjà créée (id connu) |
| nokotti | Nokotti | déjà créée (id connu) |
| uwattsura | Uwattsura | déjà créée (id connu) |
| kakunoshin | Kakunoshin | déjà créée (id connu) |
| kojuro | Kojuro | déjà créée (id connu) |
| azuki | Azuki | déjà créée (id connu) |
| genrin | Genrin | déjà créée (id connu) |
| noriko | Noriko | déjà créée (id connu) |
| inukai | Inukai | déjà créée (id connu) |
| tsurue-monnosuke | Tsurue Monnosuke | déjà créée (id connu) |
| dotaku | Dotaku | déjà créée (id connu) |
| sandayu | Sandayu | déjà créée (id connu) |
| hanji | Hanji | déjà créée (id connu) |
| asashichi | Asashichi | déjà créée (id connu) |
| koito | Koito | déjà créée (id connu) |
| fugetsu-omusubi | Fugetsu Omusubi | déjà créée (id connu) |
| uzuki-tempura | Uzuki Tempura | déjà créée (id connu) |
| gab | Gab | déjà créée (id connu) |
| some | Some | déjà créée (id connu) |
| chuji | Chuji | déjà créée (id connu) |
| haraguroyas-owner | Haraguroya's Owner | déjà créée (id connu) |
| kazenbo | Kazenbo | déjà créée (id connu) |
| misery | Misery | déjà créée (id connu) |
| adio-suerte | Adio Suerte | déjà créée (id connu) |
| gig | Gig | déjà créée (id connu) |
| dive | Dive | déjà créée (id connu) |
| uk | UK | déjà créée (id connu) |
| pomp | Pomp | déjà créée (id connu) |
| bubblegum | Bubblegum | déjà créée (id connu) |
| mosh | Mosh | déjà créée (id connu) |
| quincy | Quincy | déjà créée (id connu) |
| house | House | déjà créée (id connu) |
| reck | Reck | déjà créée (id connu) |
| boogie | Boogie | déjà créée (id connu) |
| hip | Hip | déjà créée (id connu) |
| hop | Hop | déjà créée (id connu) |
| emma | Emma | déjà créée (id connu) |
| disc-j | Disc J | déjà créée (id connu) |
| compo | Compo | déjà créée (id connu) |
| moai | Moai | déjà créée (id connu) |
| jaguar | Jaguar | déjà créée (id connu) |
| lim | Lim | déjà créée (id connu) |
| trip | Trip | déjà créée (id connu) |
| himuro | Himuro | déjà créée (id connu) |
| joseph | Joseph | déjà créée (id connu) |
| tensei | Tensei | déjà créée (id connu) |
| jodie-and-eliza | Jodie and Eliza | déjà créée (id connu) |
| fukumi | Fukumi | déjà créée (id connu) |
| monday-non-canon | Monday (Non-Canon) | déjà créée (id connu) |
| doll | Doll | déjà créée (id connu) |
| prince-grus | Prince Grus | déjà créée (id connu) |
| mecha-shark | Mecha-Shark | déjà créée (id connu) |
| hibari | Hibari | déjà créée (id connu) |
| super-white-bear | Super White Bear | déjà créée (id connu) |
| recycle-wan | Recycle-Wan | déjà créée (id connu) |
| hakugan | Hakugan | déjà créée (id connu) |
| gismonda | Gismonda | déjà créée (id connu) |
| sennorikyuru | Sennorikyuru | déjà créée (id connu) |
| emet | Emet | déjà créée (id connu) |
| ratel | Ratel | déjà créée (id connu) |
| shimotsuki-furiko | Shimotsuki Furiko | déjà créée (id connu) |
| roronoa-pinzoro | Roronoa Pinzoro | déjà créée (id connu) |
| roronoa-arashi | Roronoa Arashi | déjà créée (id connu) |
| tera | Tera | déjà créée (id connu) |
| ayese-mar | Ayesé Mar | déjà créée (id connu) |
| pururu | Pururu | déjà créée (id connu) |
| fugar | Fugar | déjà créée (id connu) |
| gerotini | Gerotini | déjà créée (id connu) |
| oli | Oli | déjà créée (id connu) |
| nekozaemon | Nekozaemon | déjà créée (id connu) |
| torasaburo | Torasaburo | déjà créée (id connu) |
| kujaku | Kujaku | déjà créée (id connu) |
| hinokizu | Hinokizu | déjà créée (id connu) |
| ushiano | Ushiano | déjà créée (id connu) |
| gambo | Gambo | déjà créée (id connu) |
| jiron | Jiron | déjà créée (id connu) |
| pluming | Pluming | déjà créée (id connu) |
| nefertari-d-lili | Nefertari D. Lili | déjà créée (id connu) |
| figarland-garling | Figarland Garling | déjà créée (id connu) |
| joshu | Joshu | déjà créée (id connu) |
| bluegrass | Bluegrass | déjà créée (id connu) |
| clapp | Clapp | déjà créée (id connu) |
| ginny | Ginny | déjà créée (id connu) |
| iyaneno-chinode | Iyan'eno Chinode | déjà créée (id connu) |
| gyogyo | Gyogyo | déjà créée (id connu) |
| bekori | Bekori | déjà créée (id connu) |
| bulldog | Bulldog | déjà créée (id connu) |
| conney | Conney | déjà créée (id connu) |
| alpha | Alpha | déjà créée (id connu) |
| potato | Potato | déjà créée (id connu) |
| totts | Totts | déjà créée (id connu) |
| red-king | Red King | déjà créée (id connu) |
| hound | Hound | déjà créée (id connu) |
| guillotine | Guillotine | déjà créée (id connu) |
| tosa | Tosa | déjà créée (id connu) |
| pomsky | Pomsky | déjà créée (id connu) |
| urban | Urban | déjà créée (id connu) |
| linaria | Linaria | déjà créée (id connu) |
| hototogisu | Hototogisu | déjà créée (id connu) |
| komakkov | Komakkov | déjà créée (id connu) |
| alice | Alice | déjà créée (id connu) |
| kyo | Kyo | déjà créée (id connu) |
| sig | Sig | déjà créée (id connu) |
| hanafuda | Hanafuda | déjà créée (id connu) |
| tritoma | Tritoma | déjà créée (id connu) |
| fugetsu-kisaburo | Fugetsu Kisaburo | déjà créée (id connu) |
| part | Part | déjà créée (id connu) |
| garudan | Garudan | déjà créée (id connu) |
| gangaru | Gangaru | déjà créée (id connu) |
| hatsume | Hatsume | déjà créée (id connu) |
| mishoin-cashible | Mishoin Cashible | déjà créée (id connu) |
| beak-remark | Beak Remark | déjà créée (id connu) |
| uzuki-namida | Uzuki Namida | déjà créée (id connu) |
| jigokukamabuta-megatenpanchiro | Jigokukamabuta Megatenpanchiro | déjà créée (id connu) |
| hoisassa | Hoisassa | déjà créée (id connu) |
| nodoi-wakan | Nodoi Wakan | déjà créée (id connu) |
| hippan-natte | Hippan Natte | déjà créée (id connu) |
| neoki | Neoki | déjà créée (id connu) |
| pirate-penguin | Pirate Penguin | déjà créée (id connu) |
| pirate-bear | Pirate Bear | déjà créée (id connu) |
| hippie | Hippie | déjà créée (id connu) |
| scimitarta | Scimitarta | déjà créée (id connu) |
| hiro-gomon | Hiro Gomon | déjà créée (id connu) |
| jumper | Jumper | déjà créée (id connu) |
| beegirl | Beegirl | déjà créée (id connu) |
| hawkman | Hawkman | déjà créée (id connu) |
| ageha-woman | Ageha Woman | déjà créée (id connu) |
| koshi-falcon | Koshi Falcon | déjà créée (id connu) |
| battaman | Battaman | déjà créée (id connu) |
| dashiteyaro | Dashiteyaro | déjà créée (id connu) |
| hikkomitsukumai | Hikkomitsukumai | déjà créée (id connu) |
| tamikebao | Tamikebao | déjà créée (id connu) |
| gattenshochinosukeo | Gattenshochinosukeo | déjà créée (id connu) |
| scorpionlady | Scorpionlady | déjà créée (id connu) |
| horseman | Horseman | déjà créée (id connu) |
| saitank | Saitank | déjà créée (id connu) |
| usunoro | Usunoro | déjà créée (id connu) |
| bisley | Bisley | déjà créée (id connu) |
| kamakirigirl | Kamakirigirl | déjà créée (id connu) |
| doubt-brothers | Doubt Brothers | déjà créée (id connu) |
| beetleman | Beetleman | déjà créée (id connu) |
| dago | Dago | déjà créée (id connu) |
| ottoland | Ottoland | déjà créée (id connu) |
| footbianco | Footbianco | déjà créée (id connu) |
| caucasusman | Caucasusman | déjà créée (id connu) |
| nokokuwa-police | Nokokuwa Police | déjà créée (id connu) |
| redwolf | Redwolf | déjà créée (id connu) |
| chochinman | Chochinman | déjà créée (id connu) |
| nightcrab-girl | Nightcrab Girl | déjà créée (id connu) |
| bishonure-onna | Bishonure-Onna | déjà créée (id connu) |
| yamanba | Yamanba | déjà créée (id connu) |
| jugemu-jugemuko | Jugemu Jugemuko | déjà créée (id connu) |
| chokyumei-no-chosuke | Chokyumei-no Chosuke | déjà créée (id connu) |
| makinos-child | Makino's Child | déjà créée (id connu) |
| glutbunny | Glutbunny | déjà créée (id connu) |
| hilmungardr | Hilmungardr | déjà créée (id connu) |
| iscat | Iscat | déjà créée (id connu) |
| muginn | Muginn | déjà créée (id connu) |
| needle-god | Needle God | déjà créée (id connu) |
| harald | Harald | déjà créée (id connu) |
| headband-catfish-village-elder | Headband Catfish Village Elder | déjà créée (id connu) |
| nyornyo-nyarmani | Nyornyo Nyarmani | déjà créée (id connu) |
| suzume | Suzume | déjà créée (id connu) |
| norinosuke | Norinosuke | déjà créée (id connu) |
| tsumonsieur-kamaya | Tsumonsieur Kamaya | déjà créée (id connu) |
| muti | Muti | déjà créée (id connu) |
| nanday | Nanday | déjà créée (id connu) |
| tonjil | Tonjil | déjà créée (id connu) |
| tonsfer | Tonsfer | déjà créée (id connu) |
| donquixote-shivercalero | Donquixote Shivercalero | déjà créée (id connu) |
| baburu | Baburu | déjà créée (id connu) |
| tomatito | Tomatito | déjà créée (id connu) |
| jabari | Jabari | déjà créée (id connu) |
| renona-topakka | Renona Topakka | déjà créée (id connu) |
| vincent | Vincent | déjà créée (id connu) |
| uraya-mashikatta | Uraya Mashikatta | déjà créée (id connu) |
| dragon-number-twenty-one | Dragon Number Twenty-One | déjà créée (id connu) |
| demoni-aiyo | Demoni Aiyo | déjà créée (id connu) |
| urbain | Urbain | déjà créée (id connu) |
| sukare-tainen | Sukare Tainen | déjà créée (id connu) |
| shikon-kettai | Shikon Kettai | déjà créée (id connu) |
| mouthto-mouthyan | Mouthto Mouthyan | déjà créée (id connu) |
| mezasuzowan-pisuo | Mezasuzowan Pisuo | déjà créée (id connu) |
| rakushitemo-terusubehainaika | Rakushitemo Terusubehainaika | déjà créée (id connu) |
| ettara-chaunkai | Ettara Chaunkai | déjà créée (id connu) |
| sukare-karehosui | Sukare Karehosui | déjà créée (id connu) |
| nakaiwa | Nakaiwa | déjà créée (id connu) |
| koiwa | Koiwa | déjà créée (id connu) |
| oiwa | Oiwa | déjà créée (id connu) |
| sarai | Sarai | déjà créée (id connu) |
| furika | Furika | déjà créée (id connu) |
| taka | Taka | déjà créée (id connu) |
| anba | Anba | déjà créée (id connu) |
| tsurube | Tsurube | déjà créée (id connu) |
| blakey | Blakey | déjà créée (id connu) |
| miles | Miles | déjà créée (id connu) |
| deigoro | Deigoro | déjà créée (id connu) |
| gurutaro | Gurutaro | déjà créée (id connu) |
| tomozo | Tomozo | déjà créée (id connu) |
| zururin | Zururin | déjà créée (id connu) |
| colon | Colon | déjà créée (id connu) |
| ripley | Ripley | déjà créée (id connu) |
| mosa | Mosa | déjà créée (id connu) |
| ange | Ange | déjà créée (id connu) |
| biblo | Biblo | déjà créée (id connu) |
| mato | Mato | déjà créée (id connu) |
| manmayer-gunko | Manmayer Gunko | déjà créée (id connu) |
| cerberus-sword | Cerberus (Sword) | déjà créée (id connu) |
| mottled | Mottled | déjà créée (id connu) |
| birdy | Birdy | déjà créée (id connu) |
| googly-eyed | Googly-Eyed | déjà créée (id connu) |
| underbite | Underbite | déjà créée (id connu) |
| topknot | Topknot | déjà créée (id connu) |
| scales | Scales | déjà créée (id connu) |
| rimoshifu-killingham | Rimoshifu Killingham | déjà créée (id connu) |
| shepherd-sommers | Shepherd Sommers | déjà créée (id connu) |
| ragnir | Ragnir | déjà créée (id connu) |
| ylva | Ylva | déjà créée (id connu) |
| blade | Blade | déjà créée (id connu) |
| aegir | Aegir | déjà créée (id connu) |
| ronja | Ronja | déjà créée (id connu) |
| mag | Mag | déjà créée (id connu) |
| skaldi | Skaldi | déjà créée (id connu) |
| bjorn | Bjorn | déjà créée (id connu) |
| olav | Olav | déjà créée (id connu) |
| nash | Nash | déjà créée (id connu) |
| karin | Karin | déjà créée (id connu) |
| bent | Bent | déjà créée (id connu) |
| johanna | Johanna | déjà créée (id connu) |
| sukune | Sukune | déjà créée (id connu) |
| thormann | Thormann | déjà créée (id connu) |
| ida | Ida | déjà créée (id connu) |
| estrid | Estrid | déjà créée (id connu) |
| asla | Asla | déjà créée (id connu) |
| vegapants | Vegapants | déjà créée (id connu) |
| elbow | Elbow | déjà créée (id connu) |
| marlon | Marlon | déjà créée (id connu) |
| barbel | Barbel | déjà créée (id connu) |
| eris | Eris | déjà créée (id connu) |
| satchels-maffey | Satchels Maffey | déjà créée (id connu) |
| polo-gram | Polo Gram | déjà créée (id connu) |
| kashigamis-child | Kashigami's Child | déjà créée (id connu) |
| bjorn-pirate | Bjorn (Pirate) | déjà créée (id connu) |
| warrior-god | Warrior God | déjà créée (id connu) |
| ratatoskr | Ratatoskr | déjà créée (id connu) |
| magnolia | Magnolia | déjà créée (id connu) |
| billy-the-yabuki | Billy the Yabuki | déjà créée (id connu) |
| love | Love | déjà créée (id connu) |
| misty | Misty | déjà créée (id connu) |
| gantonio | Gantonio | déjà créée (id connu) |
| zaza | Zaza | déjà créée (id connu) |
| reuven | Reuven | déjà créée (id connu) |
| candelle | Candelle | déjà créée (id connu) |
| moulon | Moulon | déjà créée (id connu) |
| douzan | Douzan | déjà créée (id connu) |
| axel | Axel | déjà créée (id connu) |
| gustav | Gustav | déjà créée (id connu) |
| emil | Emil | déjà créée (id connu) |
| chief-tequila-wolf | Chief (Tequila Wolf) | déjà créée (id connu) |
| manmayer-gurou | Manmayer Gurou | déjà créée (id connu) |
| erik-giant | Erik (Giant) | déjà créée (id connu) |
| alvar | Alvar | déjà créée (id connu) |
| jericho | Jericho | déjà créée (id connu) |
| hogan | Hogan | déjà créée (id connu) |
| killkhan | Killkhan | déjà créée (id connu) |
| achao | Achao | déjà créée (id connu) |
| clara | Clara | déjà créée (id connu) |

## Candidats fuzzy (184)

Paires approchantes (nom à score ≥ 0,8, ou même fruit du démon) entre une entité api-onepiece et une page Fandom, toutes deux non rapprochées. À valider à la main : un alias les rapproche, un alias `api-onepiece: null` crée la page seule.

| Entité | Id api-onepiece | Nom api-onepiece | Page Fandom | Score |
| --- | --- | --- | --- | --- |
| devil_fruits | 58 | Sourdine fruit | Nagi Nagi no Mi | 0.93 |
| devil_fruits | 74 | Fruit of Exaltation | Kobu Kobu no Mi | 0.93 |
| devil_fruits | 91 | Fruit du Bovin, Bison version | Ushi Ushi no Mi, Model: Bison | 0.9 |
| devil_fruits | 91 | Fruit du Bovin, Bison version | Ushi Ushi no Mi, Model: Giraffe | 0.9 |
| devil_fruits | 93 | Fruit du Volatile, Falcon version | Tori Tori no Mi, Model: Falcon | 0.9 |
| devil_fruits | 93 | Fruit du Volatile, Falcon version | Nori Nori no Mi | 0.87 |
| devil_fruits | 100 | Fruit of the Canid, Wolf version | Inu Inu no Mi, Model: Wolf | 0.81 |
| devil_fruits | 100 | Fruit of the Canid, Wolf version | Inu Inu no Mi, Model: Tanuki | 0.81 |
| devil_fruits | 101 | Fruit du Bovin, Giraffe version | Ushi Ushi no Mi, Model: Bison | 0.86 |
| devil_fruits | 101 | Fruit du Bovin, Giraffe version | Ushi Ushi no Mi, Model: Giraffe | 0.86 |
| devil_fruits | 103 | Fruit of the Reptile, Cobra Royal version | Hebi Hebi no Mi, Model: King Cobra | 0.97 |
| devil_fruits | 110 | Canid Fruit, Tanuki version | Inu Inu no Mi, Model: Tanuki | 0.81 |
| devil_fruits | 114 | Fruit of the Dinosaur, Pteranodon version | Ryu Ryu no Mi, Model: Pteranodon | 0.9 |
| devil_fruits | 132 | Horse SMILE | Uma Uma no Mi, Model: Pegasus | 0.9 |
| devil_fruits | 133 | SMILE of snake | Hebi Hebi no Mi, Model: King Cobra | 0.9 |
| devil_fruits | 146 | Giraffe SMILE | Ushi Ushi no Mi, Model: Giraffe | 0.9 |
| devil_fruits | 174 | Fruit of Camouflage | Aro Aro no Mi | 0.85 |
| devil_fruits | 176 | Fruit of Luck | Rako Rako no Mi | 0.87 |
| devil_fruits | 191 | Fruit of the Volatile, Eagle version | Tori Tori no Mi, Model: Falcon | 0.8 |
| devil_fruits | 192 | Fruit du Bovin, Lama version | Ushi Ushi no Mi, Model: Bison | 0.83 |
| devil_fruits | 192 | Fruit du Bovin, Lama version | Ushi Ushi no Mi, Model: Giraffe | 0.83 |
| devil_fruits | 193 | Fruit du Canidé, Raccoon version | Inu Inu no Mi, Model: Tanuki | 0.81 |
| devil_fruits | 194 | Fruit of the Bat, Vampire version | Batto Batto no Mi | 0.9 |
| devil_fruits | 195 | Fruit of the Volatile, Naked version | Tori Tori no Mi, Model: Falcon | 0.8 |
| devil_fruits | 205 | Horse fruit, Pegasus model | Uma Uma no Mi, Model: Pegasus | 0.9 |
| devil_fruits | 206 | Phoenix Fruit | Tori Tori no Mi, Model: Falcon | 0.9 |
| devil_fruits | 206 | Phoenix Fruit | Nori Nori no Mi | 0.87 |
| crews | 2 | Le Roux crew | Red Hair Pirates | 0.95 |
| crews | 7 | The Black Cat crew | Black Cat Pirates | 0.95 |
| crews | 8 | Don Krieg's Pirate Armada | Krieg Pirates | 0.9 |
| crews | 12 | The Rumbar crew | Rumbar Pirates | 0.94 |
| crews | 13 | The Giant Crew | Giant Warrior Pirates | 0.95 |
| crews | 13 | The Giant Crew | New Giant Warrior Pirates | 0.9 |
| crews | 17 | Primate League | Saruyama Alliance | 0.9 |
| crews | 20 | The Roshio crew | Roshio Pirates | 0.94 |
| crews | 21 | Don Quixote's crew | Donquixote Pirates | 0.95 |
| crews | 28 | Thriller Bark | Thriller Bark Pirates | 0.9 |
| crews | 50 | The New Fishmen crew | New Fish-Man Pirates | 0.96 |
| crews | 57 | Fleet Yonta Maria | Yonta Maria Grand Fleet | 0.95 |
| crews | 61 | New Giant Crew | New Giant Warrior Pirates | 0.96 |
| crews | 61 | New Giant Crew | Giant Warrior Pirates | 0.9 |
| crews | 61 | New Giant Crew | New Fish-Man Pirates | 0.83 |
| crews | 64 | The Amigo crew | A O Pirates | 0.81 |
| crews | 65 | The Phoenix crew | Nox Pirates | 0.85 |
| crews | 66 | Bayan's crew | Germ Pirates | 0.82 |
| crews | 71 | The Pirates with Moustaches crew | Peachbeard Pirates | 0.8 |
| crews | 86 | Royaume de Tontatta | Tontatta Pirates | 0.9 |
| crews | 97 | Archipel des Gecko | Gecko Pirates | 0.9 |
| characters | 25 | Bee Anne | Bian | 0.85 (même fruit) |
| characters | 32 | Baggy / Le Clown | Caesar Clown | 0.9 |
| characters | 32 | Baggy / Le Clown | Buggy | 0.8 |
| characters | 35 | Morge | Jorge | 0.8 |
| characters | 43 | Montblanc Cricket | Mont Blanc Cricket | 0.94 |
| characters | 59 | Eustass Kidd | Eustass Kid | 0.92 |
| characters | 59 | Eustass Kidd | John | 0.85 (même fruit) |
| characters | 78 | Ficher Tiger | Fisher Tiger | 0.92 |
| characters | 86 | Ben Beckmann | Benn Beckman | 0.83 |
| characters | 87 | Lucky Roo | Lucky Roux | 0.8 |
| characters | 97 | Charlotte Dent-de-chien | Charlotte Katakuri | 0.85 (même fruit) |
| characters | 100 | Charlotte Slurp | Charlotte Perospero | 0.85 (même fruit) |
| characters | 110 | Charlotte Flampée | Charlotte Flampe | 0.94 |
| characters | 112 | Charlotte Mondé | Charlotte Mondée | 0.94 |
| characters | 112 | Charlotte Mondé | Charlotte Maple | 0.8 |
| characters | 120 | Charlotte Crème | Charlotte Broyé | 0.8 |
| characters | 121 | Charlotte Zuccoto | Charlotte Zuccotto | 0.94 |
| characters | 122 | Charlotte Broyée | Charlotte Broyé | 0.94 |
| characters | 129 | Charlotte Corn Starch | Charlotte Cornstarch | 0.95 |
| characters | 140 | Charlotte Mélisée | Charlotte Melise | 0.94 |
| characters | 151 | Charlotte Mucre | Charlotte Maple | 0.8 |
| characters | 152 | Charlotte Mapple | Charlotte Maple | 0.94 |
| characters | 176 | Charlotte Dolce | Charlotte Dolce and Dragée | 0.9 |
| characters | 176 | Charlotte Dolce | Charlotte Lola | 0.8 |
| characters | 177 | Charlotte Dragée | Charlotte Dolce and Dragée | 0.9 |
| characters | 180 | Delœuf | Tamago | 0.85 (même fruit) |
| characters | 183 | Prométhée | Prometheus | 0.8 |
| characters | 196 | Sheep’s Head | Sheepshead | 0.91 |
| characters | 215 | Rabitman | Rabbitman | 0.89 |
| characters | 216 | Sarehebi | Sarahebi | 0.88 |
| characters | 217 | Alpagaman | Alpacaman | 0.89 |
| characters | 223 | Wa-Nyudo | Wanyudo | 0.88 |
| characters | 231 | Hacha | Hatcha | 0.83 |
| characters | 231 | Hacha | Hocha | 0.8 |
| characters | 247 | Marchall D. Teach / Barbe Noire | Marshall D. Teach | 0.94 |
| characters | 249 | Shiliew | Shiryu | 0.85 (même fruit) |
| characters | 250 | Van Auger | Van Augur | 0.89 |
| characters | 254 | Sanjuan Wolf | Wolf (Elbaph) | 0.9 |
| characters | 263 | Dringo | Doringo | 0.86 |
| characters | 264 | Sanjuan Wolf | Wolf (Elbaph) | 0.9 |
| characters | 267 | CB Galant | CB Gallant | 0.9 |
| characters | 273 | Colonel Mugren | Mugren | 0.9 |
| characters | 276 | Bankro | Bankuro | 0.86 |
| characters | 280 | Jacsonbaner | Jacksonbanner | 0.85 |
| characters | 291 | Diamond Joz | Jozu | 0.85 (même fruit) |
| characters | 301 | Speed Jill | Speed Jiru | 0.9 |
| characters | 306 | Squardo | Squard | 0.86 |
| characters | 309 | Mc Guy | McGuy | 0.83 |
| characters | 324 | Arhur | Arthur | 0.83 |
| characters | 337 | Great Micheal | Great Michael | 0.85 |
| characters | 350 | Demaro Black | Demalo Black | 0.92 |
| characters | 365 | Don Quijote Doflamingo | Donquixote Doflamingo | 0.95 |
| characters | 377 | Buffallo | Buffalo | 0.88 |
| characters | 386 | Roswald | Rosward Rosward | 0.9 |
| characters | 389 | Don Quijote Myosgard | Donquixote Mjosgard | 0.95 |
| characters | 393 | Hittori | Hattori | 0.86 |
| characters | 395 | Funckfreed | Funkfreed | 0.9 |
| characters | 409 | Minotaure | Minotaurus | 0.89 |
| characters | 412 | Minozèbre | Minozebra | 0.89 |
| characters | 413 | Minochihuabua | Minochihuahua | 0.92 |
| characters | 421 | Comir | Comil | 0.8 |
| characters | 427 | Dalmatien | Dalmatian | 0.89 |
| characters | 436 | Brandnew | Brannew | 0.88 |
| characters | 437 | Verygood | Very Good | 0.89 |
| characters | 441 | Kobby | Koby | 0.8 |
| characters | 443 | Don Quijote Rosinante | Donquixote Rosinante | 0.9 |
| characters | 454 | Ronz | Lonz | 0.8 |
| characters | 464 | Sally Entoilette | Sarie Nantokanette | 0.82 |
| characters | 473 | Kozaburo Shimotsuki | Shimotsuki Kouzaburou | 0.9 |
| characters | 474 | Koshiro | Shimotsuki Koushirou | 0.9 |
| characters | 475 | Kuina | Shimotsuki Kuina | 0.9 |
| characters | 478 | Gaimone | Gaimon | 0.86 |
| characters | 488 | Canne | Carne | 0.8 |
| characters | 494 | Johny | Johnny | 0.83 |
| characters | 494 | Johny | John | 0.8 |
| characters | 497 | Montblanc Norland | Mont Blanc Noland | 0.88 |
| characters | 498 | Don Quijote Homing | Donquixote Homing | 0.94 |
| characters | 502 | Clover | Clou D. Clover | 0.9 |
| characters | 504 | Haguar D. Sauro | Jaguar D. Saul | 0.82 |
| characters | 512 | Broggy | Brogy | 0.83 |
| characters | 513 | Dolton | Dalton | 0.83 |
| characters | 524 | Kaloo | Karoo | 0.8 |
| characters | 529 | Bourdon Jr. | Bourbon Jr. | 0.9 |
| characters | 530 | Kentarôs | Kentauros | 0.89 |
| characters | 537 | Icebarg | Iceburg | 0.86 |
| characters | 539 | Peeply Lulu | Peepley Lulu | 0.92 |
| characters | 542 | Mozu | Mozu and Kiwi | 0.9 |
| characters | 543 | Kiwi | Mozu and Kiwi | 0.9 |
| characters | 547 | Gonbei | Gonbe | 0.83 |
| characters | 548 | Yokozuma | Yokozuna | 0.88 |
| characters | 555 | Jorl | Jorul | 0.8 |
| characters | 556 | Jarl | Jarul | 0.8 |
| characters | 558 | Kaashii | Kashii | 0.86 |
| characters | 559 | Sukiyaki Kozuki | Kouzuki Sukiyaki | 0.9 |
| characters | 560 | Oden Kozuki | Kouzuki Oden | 0.9 |
| characters | 561 | Toki Kozuki | Kouzuki Toki | 0.9 |
| characters | 563 | Hiyori Kozuki | Kouzuki Hiyori | 0.9 |
| characters | 572 | Orochi Kurozumi | Kurozumi Orochi | 0.9 |
| characters | 573 | Kanjuro Kurozumi | Kurozumi Kanjuro | 0.9 |
| characters | 574 | Semimaru Kurozumi | Kurozumi Semimaru | 0.9 |
| characters | 575 | Higurashi Kurozumi | Kurozumi Higurashi | 0.9 |
| characters | 576 | Ryuma Shimotsuki | Shimotsuki Ryuma | 0.9 |
| characters | 576 | Ryuma Shimotsuki | Ryuma (Zombie) | 0.9 |
| characters | 594 | Riku Dold III | Riku Doldo III | 0.93 |
| characters | 601 | Guncho | Gancho | 0.83 |
| characters | 602 | Manshelly | Mansherry | 0.85 (même fruit) |
| characters | 603 | Zunesh | Zunesha | 0.86 |
| characters | 608 | Cancelot | Concelot | 0.88 |
| characters | 617 | Judge Vinsmoke | Vinsmoke Judge | 0.9 |
| characters | 618 | Sora Vinsmoke | Sora | 0.9 |
| characters | 618 | Sora Vinsmoke | Sora (fictional) | 0.9 |
| characters | 618 | Sora Vinsmoke | Vinsmoke Sora | 0.9 |
| characters | 619 | Reiju Vinsmoke | Vinsmoke Reiju | 0.9 |
| characters | 620 | Ichiji Vinsmoke | Vinsmoke Ichiji | 0.9 |
| characters | 621 | Niji Vinsmoke | Vinsmoke Niji | 0.9 |
| characters | 622 | Yonji Vinsmoke | Vinsmoke Yonji | 0.9 |
| characters | 624 | Gan Forr | Gan Fall | 0.88 |
| characters | 630 | Wiper | Wyper | 0.8 |
| characters | 630 | Wiper | Piper | 0.8 |
| characters | 637 | Calgara | Kalgara | 0.86 |
| characters | 642 | Hotori | Hotori and Kotori | 0.9 |
| characters | 643 | Kotori | Hotori and Kotori | 0.9 |
| characters | 660 | Ener | Enel | 0.8 |
| characters | 676 | Lassou | Lassoo | 0.83 |
| characters | 678 | Gemme | Gem | 0.85 (même fruit) |
| characters | 678 | Gemme | Ganzui | 0.85 (même fruit) |
| characters | 691 | César Clown | Caesar Clown | 0.92 |
| characters | 698 | Bear King | King (Giant Squid) | 0.9 |
| characters | 704 | Akisu | Keith | 0.8 |
| characters | 713 | Adelle Bascùd | Adele | 0.9 |
| characters | 717 | Boo Kong | Kong | 0.9 |
| characters | 720 | Lacos | Tacos | 0.8 |
| characters | 722 | Lily Carnation | Lily | 0.9 |
| characters | 723 | Papa | Papas | 0.8 |
| characters | 723 | Papa | Piper | 0.8 |
| characters | 773 | Karazu | Karasu | 0.83 |

## Conflits entre sources (352)

Valeur retenue selon `config/field-priority.yaml` ; une correction dans `overrides/corrections.yaml` clôt le conflit.

### characters.affiliations (49)

| Slug | Retenu | Autres sources |
| --- | --- | --- |
| alvida | bagi-kaizokudan, buggy-and-alvida-alliance (fandom) | bagizu-deribari-88 (api-onepiece) |
| babe | (aucune actuelle) (fandom) | anciens-membres-du-baroque-works (api-onepiece) |
| bellamy | (aucune actuelle) (fandom) | donkihote-kaizokudan (api-onepiece) |
| bentham | impel-down (fandom) | anciens-membres-du-baroque-works (api-onepiece) |
| billy | iesu-kaizokudan (fandom) | kinjishi-kaizokudan (api-onepiece) |
| cabaji | buggys-delivery, buggy-and-alvida-alliance (fandom) | bagizu-deribari-88 (api-onepiece) |
| chess | (aucune actuelle) (fandom) | ile-de-drum (api-onepiece) |
| chinjao | mugiwara-dai-sendan (fandom) | pays-des-fleurs (api-onepiece) |
| crocus | roja-kaizoku-dan (fandom) | cap-des-jumeaux (api-onepiece) |
| drophy | (aucune actuelle) (fandom) | anciens-membres-du-baroque-works (api-onepiece) |
| emporio-ivankov | (aucune actuelle) (fandom) | armee-revolutionnaire (api-onepiece) |
| fukurokuju | (aucune actuelle) (fandom) | hyakuju-kaizokudan (api-onepiece) |
| galdino | bagi-kaizokudan, buggy-and-alvida-alliance (fandom) | bagizu-deribari-88 (api-onepiece) |
| ganryu | supedo-kaizokudan (fandom) | roja-kaizoku-dan (api-onepiece) |
| hody-jones | (aucune actuelle) (fandom) | shin-gyojin-kaizokudan (api-onepiece) |
| igaram | (aucune actuelle) (fandom) | alabasta (api-onepiece) |
| inazuma | (aucune actuelle) (fandom) | armee-revolutionnaire (api-onepiece) |
| izou | (aucune actuelle) (fandom) | shirohige-kaizokudan (api-onepiece) |
| jewelry-bonney | boni-kaizokudan (fandom) | faia-tanku-kaizokudan (api-onepiece) |
| koala | (aucune actuelle) (fandom) | armee-revolutionnaire (api-onepiece) |
| kuromarimo | (aucune actuelle) (fandom) | ile-de-drum (api-onepiece) |
| kuzan-aokiji | kurohige-kaizokudan (fandom) | anciens-membres-de-la-marine (api-onepiece) |
| macro | (aucune actuelle) (fandom) | makuro-ichimi-81 (api-onepiece) |
| marco | (aucune actuelle) (fandom) | sphinx (api-onepiece) |
| marianne | (aucune actuelle) (fandom) | anciens-membres-du-baroque-works (api-onepiece) |
| mikita | (aucune actuelle) (fandom) | anciens-membres-du-baroque-works (api-onepiece) |
| miss-monday | (aucune actuelle) (fandom) | ile-aux-cactus (api-onepiece) |
| mr-9 | (aucune actuelle) (fandom) | ile-aux-cactus (api-onepiece) |
| nefertari-vivi | barokku-wakusu (fandom) | alabasta (api-onepiece) |
| page-one | (aucune actuelle) (fandom) | hyakuju-kaizokudan (api-onepiece) |
| ramen | happo-suigun (fandom) | pays-des-fleurs (api-onepiece) |
| road | (aucune actuelle) (fandom) | mugiwara-dai-sendan (api-onepiece) |
| sarquiss | berami-kaizokudan (fandom) | equipage-de-bellamy (api-onepiece) |
| scopper-gaban | (aucune actuelle) (fandom) | roja-kaizoku-dan (api-onepiece) |
| scotch | hyakuju-kaizokudan (fandom) | punk-hazard (api-onepiece) |
| scratchmen-apoo | on-ea-kaizokudan (fandom) | hyakuju-kaizokudan (api-onepiece) |
| seagull-guns-nozdon | (aucune actuelle) (fandom) | roja-kaizoku-dan (api-onepiece) |
| shakuyaku | (aucune actuelle) (fandom) | archipel-des-sabaody (api-onepiece) |
| shanks | (aucune actuelle) (fandom) | akagami-kaizokudan (api-onepiece) |
| shelly | fokushi-kaizokudan (fandom) | long-ring-long-land (api-onepiece) |
| smoker | (aucune actuelle) (fandom) | kaigun (api-onepiece) |
| speed | (aucune actuelle) (fandom) | hyakuju-kaizokudan (api-onepiece) |
| tashigi | (aucune actuelle) (fandom) | kaigun (api-onepiece) |
| ulti | (aucune actuelle) (fandom) | hyakuju-kaizokudan (api-onepiece) |
| vista | (aucune actuelle) (fandom) | shirohige-kaizokudan (api-onepiece) |
| wapol | (aucune actuelle) (fandom) | royaume-malefique-de-black-drum (api-onepiece) |
| x-drake | doreku-kaizokudan (fandom) | kaigun (api-onepiece) |
| yamato | (aucune actuelle) (fandom) | pays-des-wa (api-onepiece) |
| zala | (aucune actuelle) (fandom) | anciens-membres-du-baroque-works (api-onepiece) |

### characters.age (4)

| Slug | Retenu | Autres sources |
| --- | --- | --- |
| charlotte-basans | 34 (fandom) | 33 (api-onepiece) |
| jewelry-bonney | 22 (fandom) | 24 (api-onepiece) |
| nora | 419 (fandom) | 400 (api-onepiece) |
| toko | 6 (fandom) | 8 (api-onepiece) |

### characters.bounties (24)

| Slug | Retenu | Autres sources |
| --- | --- | --- |
| arlong | (aucune actuelle) (fandom) | 20000000 (api-onepiece) |
| bentham | (aucune actuelle) (fandom) | 32000000 (api-onepiece) |
| bepo | 1500 (fandom) | 500 (api-onepiece) |
| boa-hancock | 1659000000 (fandom) | 80000000 (api-onepiece) |
| crocodile | 1965000000 (fandom) | 81000000 (api-onepiece) |
| dellinger | (aucune actuelle) (fandom) | 150000000 (api-onepiece) |
| diamante | (aucune actuelle) (fandom) | 99000000 (api-onepiece) |
| edward-newgate-barbe-blanche | (aucune actuelle) (fandom) | 5046000000 (api-onepiece) |
| gambia | 67000000 (fandom) | 670000000 (api-onepiece) |
| gladius | (aucune actuelle) (fandom) | 31000000 (api-onepiece) |
| gol-d-roger | (aucune actuelle) (fandom) | 5564800000 (api-onepiece) |
| jewelry-bonney | 320000000 (fandom) | 140000000 (api-onepiece) |
| kuroobi | (aucune actuelle) (fandom) | 9000000 (api-onepiece) |
| lao-g | (aucune actuelle) (fandom) | 61000000 (api-onepiece) |
| machvise | (aucune actuelle) (fandom) | 11000000 (api-onepiece) |
| pica | (aucune actuelle) (fandom) | 99000000 (api-onepiece) |
| porchemy | (aucune actuelle) (fandom) | 3400000 (api-onepiece) |
| portgas-d-ace | (aucune actuelle) (fandom) | 550000000 (api-onepiece) |
| roronoa-zoro | 1111000000 (fandom) | 1101000000 (api-onepiece) |
| sabo | (aucune actuelle) (fandom) | 602000000 (api-onepiece) |
| senor-pink | (aucune actuelle) (fandom) | 58000000 (api-onepiece) |
| suleiman | 67000000 (fandom) | 670000000 (api-onepiece) |
| trafalgar-d-water-law | 3000000000 (fandom) | 500000000 (api-onepiece) |
| trebol | (aucune actuelle) (fandom) | 99000000 (api-onepiece) |

### characters.devil_fruits (5)

| Slug | Retenu | Autres sources |
| --- | --- | --- |
| charlotte-smoothie | shibo-shibo-no-mi (fandom) | uma-uma-no-mi (api-onepiece) |
| marco | tori-tori-no-mi-moderu-fenikkusu (fandom) | tori-tori-no-mi-206 (api-onepiece) |
| monkey-d-luffy | gomu-gomu-no-mi (fandom) | hito-hito-no-mi-moderu-nika (api-onepiece) |
| rob-lucci | neko-neko-no-mi-model-leopard (fandom) | zo-zo-no-mi (api-onepiece) |
| whos-who | neko-neko-no-mi-moderu-saberutaiga (fandom) | tori-tori-no-mi-moderu-fenikkusu (api-onepiece) |

### characters.height_cm (7)

| Slug | Retenu | Autres sources |
| --- | --- | --- |
| hannyabal | 309 (fandom) | 355 (api-onepiece) |
| jack | 830 (fandom) | 730 (api-onepiece) |
| keimi | 197 (fandom) | 167 (api-onepiece) |
| kyros | 298 (fandom) | 268 (api-onepiece) |
| magellan | 491 (fandom) | 425 (api-onepiece) |
| raizo | 311 (fandom) | 331 (api-onepiece) |
| tonjit | 118 (fandom) | 110 (api-onepiece) |

### characters.name_en (87)

| Slug | Retenu | Autres sources |
| --- | --- | --- |
| agsilly | Agushily (fandom) | Agsilly (api-onepiece) |
| akehende | Uweshall Notpass (fandom) | Akehende (api-onepiece) |
| aramaki-ryokugyu | Aramaki (fandom) | Aramaki / Ryokugyu (api-onepiece) |
| baggaley | Baggaly (fandom) | Baggaley (api-onepiece) |
| banchina | Bankina (fandom) | Banchina (api-onepiece) |
| batman | Bat-Man (fandom) | Batman (api-onepiece) |
| billy | Billy (Pirate) (fandom) | Billy (api-onepiece) |
| blumarine | Bluemarine (fandom) | Blumarine (api-onepiece) |
| borsalino-kizaru | Borsalino (fandom) | Borsalino / Kizaru (api-onepiece) |
| buchi | Butchie (fandom) | Buchi (api-onepiece) |
| caimanlady | Caiman Lady (fandom) | Caimanlady (api-onepiece) |
| cands | Cans (fandom) | Cands (api-onepiece) |
| charlotte-anglais | Charlotte Anglaise (fandom) | Charlotte Anglais (api-onepiece) |
| charlotte-basskarte | Charlotte Bassquarte (fandom) | Charlotte Basskarte (api-onepiece) |
| charlotte-effilee | Charlotte Effiler (fandom) | Charlotte Effilée (api-onepiece) |
| charlotte-kato | Kato (fandom) | Charlotte Kato (api-onepiece) |
| charlotte-linlin-big-mom | Charlotte Linlin (fandom) | Charlotte Linlin / Big Mom (api-onepiece) |
| charlotte-mont-dor | Charlotte Montd'Or (Viz) Charlotte Mont-d'Or (fandom) | Charlotte Mont d’Or (api-onepiece) |
| charlotte-saint-marc | Charlotte Saintmarc (fandom) | Charlotte Saint-Marc (api-onepiece) |
| charlotte-wiro | Charlotte Uiro (fandom) | Charlotte Wiro (api-onepiece) |
| chinjao | Qing Jiao (fandom) | Chinjao (api-onepiece) |
| cho | Ocho (fandom) | Cho (api-onepiece) |
| dogra | Dogura (fandom) | Dogra (api-onepiece) |
| donquino | Donkino (fandom) | Donquino (api-onepiece) |
| draw | Dorrow (fandom) | Draw (api-onepiece) |
| drip | Gack (fandom) | Drip (api-onepiece) |
| edward-newgate-barbe-blanche | Edward Newgate (fandom) | Edward Newgate / Barbe Blanche (api-onepiece) |
| elizabello-ii | Elizabero II (fandom) | Elizabello II (api-onepiece) |
| ethanbaron-v-nusjuro | St. Ethanbaron V. Nusjuro (fandom) | Ethanbaron V. Nusjuro (api-onepiece) |
| figarland-shamrock | Saint Figarland Shamrock (fandom) | Figarland Shamrock (api-onepiece) |
| gatz | Gyats (fandom) | Gatz (api-onepiece) |
| gazelleman | Gazelle-Man (fandom) | Gazelleman (api-onepiece) |
| genbo | Genbou (fandom) | Genbo (api-onepiece) |
| hody-jones | Hordy Jones (fandom) | Hody Jones (api-onepiece) |
| hyozo | Hyouzou (fandom) | Hyozo (api-onepiece) |
| ipponmatsu | Matsu (fandom) | Ipponmatsu (api-onepiece) |
| issho-fujitora | Issho (fandom) | Issho / Fujitora (api-onepiece) |
| izou | Izo (fandom) | Izou (api-onepiece) |
| jabura | Jabra (fandom) | Jabura (api-onepiece) |
| jalmack | Saint Jalmac (fandom) | Jalmack (api-onepiece) |
| jango | Django (fandom) | Jango (api-onepiece) |
| jaygarcia-saturn | St. Jaygarcia Saturn (fandom) | Jaygarcia Saturn (api-onepiece) |
| jeet | Jet (fandom) | Jeet (api-onepiece) |
| jora | Giolla (fandom) | Jora (api-onepiece) |
| kabu | Cub (fandom) | Kabu (api-onepiece) |
| keimi | Camie (fandom) | Keimi (api-onepiece) |
| krieg-don-krieg | Krieg (fandom) | Krieg / Don Krieg (api-onepiece) |
| kuzan-aokiji | Kuzan (fandom) | Kuzan / Aokiji (api-onepiece) |
| limejuice | Lime Juice (fandom) | Limejuice (api-onepiece) |
| magra | Magura (fandom) | Magra (api-onepiece) |
| marcus-mars | St. Marcus Mars (fandom) | Marcus Mars (api-onepiece) |
| millet-pine | Mille Pine (fandom) | Millet Pine (api-onepiece) |
| miss-monday | Ms. Monday (fandom) | Miss Monday (api-onepiece) |
| mounblutain | Mounbleten (fandom) | Mounblutain (api-onepiece) |
| mouseman | Mouse-Man (fandom) | Mouseman (api-onepiece) |
| nefertari-cobra | Nefeltari Cobra (fandom) | Nefertari Cobra (api-onepiece) |
| nefertari-titi | Nefeltari Titi (fandom) | Nefertari Titi (api-onepiece) |
| nefertari-vivi | Nefeltari Vivi (fandom) | Nefertari Vivi (api-onepiece) |
| nora | Nola (fandom) | Nora (api-onepiece) |
| nora-gitsune | Stray Fox (fandom) | Nora Gitsune (api-onepiece) |
| omasa | Ohmasa (fandom) | Omasa (api-onepiece) |
| orlumbus | Olombus (fandom) | Orlumbus (api-onepiece) |
| pandaman | Panda Man (fandom) | Pandaman (api-onepiece) |
| pappag | Pappagu (fandom) | Pappag (api-onepiece) |
| portgas-d-rouge | Portgaz D. Rouge (fandom) | Portgas D. Rouge (api-onepiece) |
| pudding-pudding | Purinpurin (fandom) | Pudding Pudding (api-onepiece) |
| rangram | Langram (fandom) | Rangram (api-onepiece) |
| road | Rodo (fandom) | Road (api-onepiece) |
| rowing | Lowwing (fandom) | Rowing (api-onepiece) |
| sadi | Sadie (fandom) | Sadi (api-onepiece) |
| sakazuki-akainu | Sakazuki (fandom) | Sakazuki / Akainu (api-onepiece) |
| seagull-guns-nozdon | Seagull Ganz Nozudon (fandom) | Seagull Guns Nozdon (api-onepiece) |
| sham | Siam (fandom) | Sham (api-onepiece) |
| sharinguru | Sharingle (fandom) | Sharinguru (api-onepiece) |
| shelly | Sherry (fandom) | Shelly (api-onepiece) |
| shepherd-ju-peter | St. Shepherd Ju Peter (fandom) | Shepherd Ju Peter (api-onepiece) |
| shojo | Shojoe (fandom) | Shojo (api-onepiece) |
| shyarly | Sharley (fandom) | Shyarly (api-onepiece) |
| tama | Kurozumi Tama (fandom) | Tama (api-onepiece) |
| tank-lepanto | Tank Lepant (fandom) | Tank Lepanto (api-onepiece) |
| topman-warcury | St. Topman Warcury (fandom) | Topman Warcury (api-onepiece) |
| tsurujo | Tsuru (fandom) | Tsurujo (api-onepiece) |
| turco | Turk (fandom) | Turco (api-onepiece) |
| vegapunk | Dr. Vegapunk (fandom) | Végapunk (api-onepiece) |
| yui | Yuey (fandom) | Yui (api-onepiece) |
| zanbai | Zambai (fandom) | Zanbai (api-onepiece) |
| zucca | Zukka (fandom) | Zucca (api-onepiece) |

### characters.status (3)

| Slug | Retenu | Autres sources |
| --- | --- | --- |
| nefertari-cobra | deceased (fandom) | alive (api-onepiece) |
| t-bone | deceased (fandom) | alive (api-onepiece) |
| toko | alive (fandom) | deceased (api-onepiece) |

### crews.captain_id (2)

| Slug | Retenu | Autres sources |
| --- | --- | --- |
| chahige-kaizokudan | chadros-higelyges (fandom) | barbos-bruneriguez-barbe-brune (api-onepiece) |
| taiyo-no-kaizokudan | jinbe (fandom) | ficher-tiger (api-onepiece) |

### crews.name_en (47)

| Slug | Retenu | Autres sources |
| --- | --- | --- |
| akumeito-kaizokudan | Akumate Pirates (fandom) | The Acumates crew (api-onepiece) |
| aron-ichimi | Arlong's Pirates (fandom) | The Arlong crew (api-onepiece) |
| arubida-kaizokudan | Alvida Pirates (fandom) | The Alvida crew (api-onepiece) |
| bagi-kaizokudan | Buggy's Band of Pirates (fandom) | The Clown Crew (api-onepiece) |
| bareruzu-kaizokudan | Barrels Pirates (fandom) | The Diez Barrels crew (api-onepiece) |
| baruto-kurabu | Barto Club (fandom) | Bartolomeo's crew (api-onepiece) |
| berami-kaizokudan | Bellamy Pirates (fandom) | the New Age crew (api-onepiece) |
| biggu-mamu-kaizokudan | Big Mom Pirates (fandom) | Big Mom's crew (api-onepiece) |
| boni-kaizokudan | Bonney Pirates (fandom) | Bonney's crew (api-onepiece) |
| burikingu-kaizokudan | Tin Tyrant Pirates (fandom) | The Bliking crew (api-onepiece) |
| burujamu-kaizoku-dan | Bluejam Pirates (fandom) | The Bluejam crew (api-onepiece) |
| chahige-kaizokudan | Brownbeard Pirates (fandom) | The crew of Barbe Brune (api-onepiece) |
| churippu-kaizokudan | Tulip Pirates (fandom) | The Tulip crew (api-onepiece) |
| doreku-kaizokudan | Drake Pirates (fandom) | Drake's crew (api-onepiece) |
| faia-tanku-kaizokudan | Firetank Pirates (fandom) | The Fire Tank crew (api-onepiece) |
| fokushi-kaizokudan | Foxy Pirates (fandom) | The Foxy crew (api-onepiece) |
| furaingu-kaizokudan | Flying Pirates (fandom) | The Flying Pirates crew (api-onepiece) |
| hakaiso-kaizokudan | Fallen Monk Pirates (fandom) | The crew of Les Moines Dépravés (api-onepiece) |
| happo-suigun | Happosui Army (fandom) | La Flotte de Happou (api-onepiece) |
| hato-no-kaizokudan | Heart Pirates (fandom) | The Hearth crew (api-onepiece) |
| hokahoka-kaizokudan | Hoka-Hoka Pirates (fandom) | The Hakahoka crew (api-onepiece) |
| hokinsu-kaizokudan | Hawkins Pirates (fandom) | The Hawkins crew (api-onepiece) |
| hyakuju-kaizokudan | Animal Kingdom Pirates (fandom) | The Hundred Beasts crew (api-onepiece) |
| iesu-kaizokudan | Yes Pirates (fandom) | The Pirates Yes crew (api-onepiece) |
| jairo-kaizokudan | Gyro Pirates (fandom) | Gyro's crew (api-onepiece) |
| karibu-kaizokudan | Caribou Pirates (fandom) | The Caribou crew (api-onepiece) |
| kiba-gaeru-kaizokudan | Fang Frog Pirates (fandom) | The Fanged Toad crew (api-onepiece) |
| kiddo-kaizokudan | Kid Pirates (fandom) | The Kid crew (api-onepiece) |
| kinjishi-kaizokudan | Golden Lion Pirates (fandom) | The crew of the Lion d'Or (api-onepiece) |
| kuja-kaizokudan | Kuja Pirates (fandom) | The Kuja Pirates crew (api-onepiece) |
| kukku-kaizokudan | Cook Pirates (fandom) | Les Cuisiniers crew (api-onepiece) |
| kurohige-kaizokudan | Black Beard Pirates (fandom) | Blackbeard's crew (api-onepiece) |
| kyandi-kaizokudan | Candy Pirates (fandom) | The Candys crew (api-onepiece) |
| mugiwara-dai-sendan | Straw Hat Grand Fleet (fandom) | Armarda du Chapeau de Paille (api-onepiece) |
| mugiwara-no-ichimi | Straw Hat Pirates (fandom) | The Chapeau de Paille crew (api-onepiece) |
| nise-mugiwara-no-ichimi | Fake Straw Hats (fandom) | Faux Equipage du Chapeau de Paille (api-onepiece) |
| o-kabuto-kaizokudan | Big Helmet Pirate Gang (fandom) | The Gros Casques crew (api-onepiece) |
| on-ea-kaizokudan | On-Air Pirates (fandom) | The On-Air crew (api-onepiece) |
| roja-kaizoku-dan | Roger Pirates (fandom) | The Pirates Roger crew (api-onepiece) |
| rokkusu-kaizokudan | Rocks Pirates (fandom) | The Rocks crew (api-onepiece) |
| roringu-kaizokudan | Rolling Pirates (fandom) | The crew of the Rolling (api-onepiece) |
| shirohige-kaizokudan | Whitebeard Pirates (fandom) | Whitebeard's crew (api-onepiece) |
| supedo-kaizokudan | Spade Pirates (fandom) | The Spade crew (api-onepiece) |
| taiyo-no-kaizokudan | Sun Pirates (fandom) | The Sun Pirates crew (api-onepiece) |
| uchu-kaizoku | Space Pirates (fandom) | Space Pirate (api-onepiece) |
| usoppu-kaizokudan | Usopp Pirates (fandom) | Captain Usopp's crew (api-onepiece) |
| utsukushiki-kaizoku-dan | Beautiful Pirates (fandom) | The Magnificent Pirates crew (api-onepiece) |

### devil_fruits.name_en (123)

| Slug | Retenu | Autres sources |
| --- | --- | --- |
| ato-ato-no-mi | Art-Art Fruit (fandom) | Fruit of Art (api-onepiece) |
| awa-awa-no-mi | Bubble-Bubble Fruit (fandom) | Fruit des Bulles (api-onepiece) |
| baku-baku-no-mi | Munch-Munch Fruit (fandom) | Fruit of the Glutton (api-onepiece) |
| bane-bane-no-mi | Spring-Spring Fruit (fandom) | Fruit of the Spring (api-onepiece) |
| bara-bara-no-mi | Chop-Chop Fruit (fandom) | Fruit of Fragmentation (api-onepiece) |
| bari-bari-no-mi | Barrier-Barrier Fruit (fandom) | Fruit of the Barrier (api-onepiece) |
| bata-bata-no-mi | Butter-Butter Fruit (fandom) | Butter Fruit (api-onepiece) |
| beri-beri-no-mi | Berry-Berry Fruit (fandom) | Berry Fruit (api-onepiece) |
| beta-beta-no-mi | Stick-Stick Fruit (VIZ, Funimation (fandom) | Poisse-Poisse fruit (api-onepiece) |
| bisu-bisu-no-mi | Bis-Bis Fruit (fandom) | Cookie Fruit (api-onepiece) |
| bomu-bomu-no-mi | Bomb-Bomb Fruit (fandom) | Fruit Boum-Boum (api-onepiece) |
| buki-buki-no-mi | Arms-Arms Fruit (fandom) | Armo-Fruit (api-onepiece) |
| buku-buku-no-mi | Book-Book Fruit (fandom) | Fruit of the Book (api-onepiece) |
| chiyu-chiyu-no-mi | Heal-Heal Fruit (fandom) | Fruit of Healing (api-onepiece) |
| choki-choki-no-mi | Snip-Snip Fruit (fandom) | Fruit of the Scissors (api-onepiece) |
| deka-deka-no-mi | Huge-Huge Fruit (fandom) | The fruit of gigantism (api-onepiece) |
| doa-doa-no-mi | Door-Door Fruit (fandom) | Fruit of the Porter (api-onepiece) |
| doku-doku-no-mi | Venom-Venom Fruit (fandom) | Poison Fruit (api-onepiece) |
| doru-doru-no-mi | Wax-Wax Fruit (fandom) | Ciro-Fruit (api-onepiece) |
| fude-fude-no-mi | Brush-Brush Fruit (fandom) | Fruit of the Brush (api-onepiece) |
| fuku-fuku-no-mi | Garb-Garb Jutsu (fandom) | Fruit of the Garment (api-onepiece) |
| fuwa-fuwa-no-mi | Float-Float Fruit (fandom) | Floating Fruit (api-onepiece) |
| gabu-gabu-no-mi | Glug-Glug Fruit (fandom) | Fruit of the Gobbledygook (api-onepiece) |
| gasu-gasu-no-mi | Gas-Gas Fruit (fandom) | Fruit of the Gas (api-onepiece) |
| giro-giro-no-mi | Glare-Glare Fruit (fandom) | Fruit of the Eye (api-onepiece) |
| gocha-gocha-no-mi | Pile-Pile Fruit (fandom) | Fruit of the Mix (api-onepiece) |
| goro-goro-no-mi | Rumble-Rumble Fruit (fandom) | Fulguro-Fruit (api-onepiece) |
| gura-gura-no-mi | Tremor-Tremor Fruit or Quake-Quake Fruit (fandom) | Fruit of Trembling (api-onepiece) |
| guru-guru-no-mi | Spin-Spin Fruit (fandom) | Fruit of the whirlwind (api-onepiece) |
| hana-hana-no-mi | Hana-Hana Fruit (fandom) | Fruit Des Éclosions (api-onepiece) |
| hebi-hebi-no-mi-moderu-anakonda | Snake-Snake Fruit Anaconda Model (fandom) | Fruit of the Reptile, Anaconda version (api-onepiece) |
| hebi-hebi-no-mi-moderu-yamata-no-orochi | Snake-Snake Fruit, Model: Yamata-no-Orochi (fandom) | Fruit of the Reptile, eight-headed dragon version (api-onepiece) |
| hie-hie-no-mi | Ice-Ice Fruit (fandom) | Frost Fruit (api-onepiece) |
| hira-hira-no-mi | Ripple-Ripple Fruit (fandom) | Fruit of the Wind Thief (api-onepiece) |
| hito-hito-no-mi | Human-Human Fruit (fandom) | Fruit of the Human (api-onepiece) |
| hito-hito-no-mi-moderu-daibutsu | Human-Human Fruit, Model: Buddha (fandom) | Fruit of the Human, Buddha version (api-onepiece) |
| hito-hito-no-mi-moderu-onyudo | Human-Human Fruit Model Onyudo (fandom) | Fruit of the Human, Onyudo version (api-onepiece) |
| hobi-hobi-no-mi | Hobby-Hobby Fruit (fandom) | Fruit du Joujou (api-onepiece) |
| horo-horo-no-mi | Hollow-Hollow Fruit (fandom) | Fruit of Ectoplasm (api-onepiece) |
| horu-horu-no-mi | Horm-Horm Fruit (fandom) | Fruit of Hormones (api-onepiece) |
| hoya-hoya-no-mi | Puff-Puff Fruit (fandom) | Fruit of the Lamp (api-onepiece) |
| inu-inu-no-mi-moderu-dakkusufunto | Mutt-Mutt Fruit, Dachshund Type (fandom) | Fruit of the Canid, Basset version (api-onepiece) |
| inu-inu-no-mi-moderu-jakkaru | Dog-Dog Fruit, Model: Jackal (fandom) | Fruit of the Canidae, Jackal version (api-onepiece) |
| inu-inu-no-mi-moderu-kyubi-no-kitsune | Dog-Dog Fruit, Model: Nine Tailed Fox (fandom) | Fruit of the Canidae, Nine-tailed Fox version (api-onepiece) |
| inu-inu-no-mi-moderu-okuchi-no-makami | Dog-Dog Fruit, Model: Okuchi-no-Makami (fandom) | Fruit of the Canid, Divine Wolf version (api-onepiece) |
| ishi-ishi-no-mi | Stone-Stone Fruit (fandom) | Fruit de la Caillasse (api-onepiece) |
| ito-ito-no-mi | String-String Fruit (fandom) | Fruit du Fil (api-onepiece) |
| jake-jake-no-mi | Jacket-Jacket Fruit (fandom) | Fruit de la Pelisse (api-onepiece) |
| jiki-jiki-no-mi | Magnet-Magnet Fruit (fandom) | Magnéto-Fruit (api-onepiece) |
| juku-juku-no-mi | Ripe-Ripe Enticement Jutsu (fandom) | Fruit of Maturation (api-onepiece) |
| kage-kage-no-mi | Shadow-Shadow Fruit (fandom) | Fruit of the Shadow (api-onepiece) |
| kame-kame-no-mi | Turtle-Turtle Fruit (fandom) | Turtle Fruit (api-onepiece) |
| kibi-kibi-no-mi | Millet-Millet Fruit (fandom) | Millet fruit (api-onepiece) |
| kira-kira-no-mi | Twinkle-Twinkle Fruit (fandom) | Sparkling Fruit (api-onepiece) |
| kuku-kuku-no-mi | Cook-Cook Fruit (fandom) | Fruit of the Cook (api-onepiece) |
| kumo-kumo-no-mi-moderu-rosamigare-guraubogeri | Spider-Spider Fruit, Rosamygale Grauvogeli Model (fandom) | Spider fruit, Rosamygale grauvogeli version (api-onepiece) |
| kuri-kuri-no-mi | Cream-Cream Fruit (fandom) | Fruit de la Crème (api-onepiece) |
| magu-magu-no-mi | Mag-Mag Fruit (fandom) | Magma Fruit (api-onepiece) |
| maki-maki-no-mi | Scrolling Jutsu (fandom) | Fruit of the Parchment (api-onepiece) |
| mane-mane-no-mi | Clone-Clone Fruit (fandom) | Travesti-Fruit (api-onepiece) |
| mato-mato-no-mi | Mark-Mark Fruit (fandom) | Fruit of the Dans-le-mille (api-onepiece) |
| memo-memo-no-mi | Memo-Memo Fruit (fandom) | Fruit of Memories (api-onepiece) |
| mera-mera-no-mi | Flame-Flame Fruit (fandom) | Pyro-Fruit (api-onepiece) |
| mero-mero-no-mi | Love-Love Fruit (fandom) | Passion fruit (api-onepiece) |
| mira-mira-no-mi | Mirror-Mirror Fruit (fandom) | Fruit of the Mirror (api-onepiece) |
| mochi-mochi-no-mi | Mochi-Mochi Fruit (fandom) | Glutinous Rice Fruit (api-onepiece) |
| mogu-mogu-no-mi | Mole-Mole Fruit (fandom) | Digging Fruit (api-onepiece) |
| moku-moku-no-mi | Smoke-Smoke Fruit (fandom) | Fruit Smoke (api-onepiece) |
| mori-mori-no-mi | Woods-Woods Fruit (fandom) | Bat-fruit / vampire (fruit-bat model) (api-onepiece) |
| mushi-mushi-no-mi-moderu-kabutomushi | Bug-Bug Fruit, Model: Rhinoceros beetle (fandom) | Fruit of the Insect, Scarab-Rhinoceros version (api-onepiece) |
| mushi-mushi-no-mi-moderu-suzumebachi | Bug-Bug Fruit, Model: Hornet (fandom) | Fruit of the Insect, Wasp version (api-onepiece) |
| neko-neko-no-mi-moderu-saberutaiga | Cat-Cat Fruit, Saber-Toothed Tiger Model (fandom) | Fruit du Félin, saber-toothed tiger version (api-onepiece) |
| netsu-netsu-no-mi | Heat-Heat Fruit (fandom) | Fruit of Heat (api-onepiece) |
| nikyu-nikyu-no-mi | Paw-Paw Fruit (fandom) | Fruit of the Pads (api-onepiece) |
| nomi-nomi-no-mi | Brain-Brain Fruit (fandom) | Fruit du Ciboulot (api-onepiece) |
| noro-noro-no-mi | Slow-Slow Fruit (fandom) | Ramollo fruit (api-onepiece) |
| nui-nui-no-mi | Stitch-Stitch Power (fandom) | Fruit de la Couture (api-onepiece) |
| numa-numa-no-mi | Swamp-Swamp Fruit (fandom) | Fruit du Marais (api-onepiece) |
| ope-ope-no-mi | Op-Op Fruit (fandom) | Fruit of the Scalpel (api-onepiece) |
| ori-ori-no-mi | Bind-Bind Fruit (fandom) | Fruit du Séquestre (api-onepiece) |
| oshi-oshi-no-mi | Push-Push Fruit (fandom) | Fruit of the Pousse-Pousse (api-onepiece) |
| oto-oto-no-mi | Tone-Tone Fruit (fandom) | Fruit of the Sound (api-onepiece) |
| pamu-pamu-no-mi | Pop-Pop Fruit (fandom) | Fruit of the Paf-Paf (api-onepiece) |
| pero-pero-no-mi | Lick-Lick Fruit (fandom) | Fruit de la Léchouille (api-onepiece) |
| pika-pika-no-mi | Glint-Glint Fruit (fandom) | Luminescent Fruit (api-onepiece) |
| poke-poke-no-mi | Pocket-Pocket Fruit (fandom) | Fruit de la Poche (api-onepiece) |
| riki-riki-no-mi | Strong-Strong Fruit (fandom) | Fruit of strength (api-onepiece) |
| ryu-ryu-no-mi-moderu-arosaurusu | Dragon-Dragon Fruit, Allosaurus Model (fandom) | Fruit of the Dinosaur, Allosaurus version (api-onepiece) |
| ryu-ryu-no-mi-moderu-burakiosaurusu | Dragon-Dragon Fruit, Model: Brachiosaurus (fandom) | Fruit of the Dinosaur, Brachiosaurus version (api-onepiece) |
| ryu-ryu-no-mi-moderu-pakikefarosaurusu | Dragon-Dragon Fruit, Pachycephalosaurus Model (fandom) | Fruit of the Dinosaur, Pachycephalosaurus version (api-onepiece) |
| ryu-ryu-no-mi-moderu-supinosaurusu | Dragon-Dragon Fruit, Model: Spinosaurus (fandom) | Fruit of the Dinosaur, Spinosaurus version (api-onepiece) |
| ryu-ryu-no-mi-moderu-torikeratopusu | Dragon-Dragon Fruit, Triceratops Model (fandom) | Fruit of the Dinosaur, Triceratops version (api-onepiece) |
| sabi-sabi-no-mi | Rust-Rust Fruit (fandom) | Rust fruit (api-onepiece) |
| sara-sara-no-mi-moderu-ahorotoru | Sala-Sala Fruit, Model: Axolotl (fandom) | Fruit of the Salamander, Axolotl version (api-onepiece) |
| shari-shari-no-mi | Wheel-Wheel Fruit (fandom) | Fruit of the Wheels (api-onepiece) |
| shibo-shibo-no-mi | Wring-Wring Fruit (fandom) | Fruit of the Presse-Presse (api-onepiece) |
| shiku-shiku-no-mi | Sick-Sick Fruit (fandom) | Fruit of the disease (api-onepiece) |
| shima-shima-no-mi | Isle-Isle Fruit (fandom) | Island fruit (api-onepiece) |
| shiro-shiro-no-mi | Castle-Castle Fruit (fandom) | Fruit du Château (api-onepiece) |
| soru-soru-no-mi | Soul-Soul Fruit (fandom) | Fruit of Souls (api-onepiece) |
| sube-sube-no-mi | Slip-Slip Fruit (fandom) | Fruit Glisse-Glisse (api-onepiece) |
| sui-sui-no-mi | Swim-Swim Fruit (fandom) | Fruit of the Barbotage (api-onepiece) |
| suke-suke-no-mi | Clear-Clear Fruit (fandom) | Fruit of Invisibility (api-onepiece) |
| suna-suna-no-mi | Sand-Sand Fruit (fandom) | Fruit des Sables (api-onepiece) |
| supa-supa-no-mi | Dice-Dice Fruit (fandom) | Slashing Fruit (api-onepiece) |
| tama-tama-no-mi | Egg-Egg Fruit (fandom) | Fruit of the Egg (api-onepiece) |
| toge-toge-no-mi | Spike-Spike Fruit (fandom) | Sea Urchin Fruit (api-onepiece) |
| toki-toki-no-mi | Time-Time Ability (fandom) | Fruit of Time (api-onepiece) |
| ton-ton-no-mi | Ton-Ton Fruit (fandom) | Fruit of the Tonne-Tonne (api-onepiece) |
| tori-tori-no-mi-moderu-arubatorosu | Bird-Bird Fruit, Model: Albatross (fandom) | Fruit du Volatile, Albatross version (api-onepiece) |
| tori-tori-no-mi-moderu-fenikkusu | Tweet-Tweet Fruit, Phoenix Model (fandom) | Fruit du Félin, saber-toothed tiger version (api-onepiece) |
| toshi-toshi-no-mi | Age-Age Fruit (fandom) | Fruit of age (api-onepiece) |
| uma-uma-no-mi | Horse-Horse Fruit (fandom) | Horse Fruit (api-onepiece) |
| uo-uo-no-mi-moderu-seiryu | Fish-Fish Fruit, Model: Azure Dragon (fandom) | Fruit of the Fish, Azure Dragon version (api-onepiece) |
| wapu-wapu-no-mi | Warp-Warp Fruit (fandom) | Fruit of teleportation (api-onepiece) |
| wara-wara-no-mi | Straw-Straw Fruit (fandom) | Fruit de la Paille (api-onepiece) |
| woshu-woshu-no-mi | Wash-Wash Fruit (fandom) | Fruit of the Laundry (api-onepiece) |
| yami-yami-no-mi | Dark-Dark Fruit (fandom) | Fruit of Darkness (api-onepiece) |
| yomi-yomi-no-mi | Revive-Revive Fruit (fandom) | Fruit of the Resurrection (api-onepiece) |
| yuki-yuki-no-mi | Snow-Snow Fruit (fandom) | Fruit du Flocon (api-onepiece) |
| zo-zo-no-mi | Eleph-Eleph Fruit (fandom) | Fruit of the Pachyderm (api-onepiece) |
| zo-zo-no-mi-moderu-manmosu | Eleph-Eleph Fruit Ancient Zoan Model Mammoth (fandom) | Fruit of the Pachyderm, Mammoth version (api-onepiece) |
| zushi-zushi-no-mi | Press-Press Fruit (fandom) | Fruit of Gravity (api-onepiece) |

### devil_fruits.name_romaji (1)

| Slug | Retenu | Autres sources |
| --- | --- | --- |
| kilo-kilo-no-mi | Kiro Kiro no Mi (fandom) | Kilo Kilo no Mi (api-onepiece) |

## Références Fandom non résolues (329 cibles, 1622 occurrences)

Lien d'infobox vers une page qui n'est ni un équipage, ni un fruit, ni un personnage, ni un lieu connu (organisations sans Crew Box, mers, pages en attente) : la relation est ignorée.

| Champ | Cible | Occurrences |
| --- | --- | --- |
| characters.affiliations | Marines | 94 |
| characters.affiliations | Ninja-Pirate-Mink-Samurai Alliance | 87 |
| characters.affiliations | Charlotte Family | 74 |
| characters.origin_location_id | Grand Line | 70 |
| characters.origin_location_id | East Blue | 63 |
| characters.origin_location_id | Ryugu Kingdom | 56 |
| characters.origin_location_id | North Blue | 39 |
| characters.origin_location_id | Wano Country | 32 |
| characters.affiliations | Kouzuki Family | 29 |
| characters.origin_location_id | West Blue | 27 |
| characters.origin_location_id | South Blue | 21 |
| characters.affiliations | Levely | 20 |
| characters.affiliations | Revolutionary Army | 20 |
| characters.affiliations | Thriller Bark Pirates | 19 |
| characters.affiliations | Tontatta Kingdom | 19 |
| characters.affiliations | Walrus School | 19 |
| characters.affiliations | Donquixote Pirates | 18 |
| characters.affiliations | World Government | 18 |
| characters.affiliations | Kurozumi Family | 17 |
| characters.affiliations | Kurozumi Tama | 17 |
| characters.affiliations | Shandia | 17 |
| characters.affiliations | Mokomo Dukedom | 16 |
| characters.affiliations | Red Hair Pirates | 15 |
| characters.affiliations | CP0 | 13 |
| characters.affiliations | CP9 | 13 |
| characters.affiliations | Ryugu Kingdom | 13 |
| characters.affiliations | World Noble | 13 |
| characters.affiliations | Giant Warrior Pirates | 12 |
| characters.origin_location_id | Arabasta Kingdom | 12 |
| characters.affiliations | Caesar Clown | 11 |
| characters.affiliations | Franky Family | 11 |
| characters.affiliations | Kuja | 11 |
| characters.affiliations | New Fish-Man Pirates | 11 |
| characters.affiliations | Orochi Oniwabanshu | 11 |
| characters.affiliations | Will of D. | 11 |
| characters.affiliations | Corrida Colosseum | 10 |
| characters.affiliations | G-5 | 10 |
| characters.affiliations | Knights of God | 10 |
| characters.affiliations | Tontatta Pirates | 10 |
| characters.origin_location_id | Elbaph | 10 |
| characters.affiliations | Arabasta Kingdom | 9 |
| characters.affiliations | Galley-La Company | 9 |
| characters.affiliations | Seven Warlords of the Sea | 9 |
| characters.affiliations | Underworld | 9 |
| characters.origin_location_id | Conomi Islands | 9 |
| characters.affiliations | Archaeologist | 8 |
| characters.affiliations | Coral Hill | 8 |
| characters.affiliations | Cross Guild | 8 |
| characters.affiliations | Nine Red Scabbards | 8 |
| characters.origin_location_id | Goa Kingdom | 8 |
| characters.origin_location_id | Mokomo Dukedom | 8 |
| characters.origin_location_id | Totto Land | 8 |
| characters.affiliations | God's Army | 7 |
| characters.affiliations | Centaur Patrol Unit | 6 |
| characters.affiliations | Dadan Family | 6 |
| characters.affiliations | Easter Egg | 6 |
| characters.affiliations | Five Elders | 6 |
| characters.affiliations | Krieg Pirates | 6 |
| characters.affiliations | Neptune Family | 6 |
| characters.affiliations | Operation Utopia | 6 |
| characters.affiliations | Poseidon | 6 |
| characters.origin_location_id | Birka | 6 |
| characters.origin_location_id | Gecko Islands | 6 |
| characters.origin_location_id | On a boat | 6 |
| characters.affiliations | Black Cat Pirates | 5 |
| characters.affiliations | Four Emperors | 5 |
| characters.affiliations | Germ Pirates | 5 |
| characters.affiliations | Gran Tesoro | 5 |
| characters.affiliations | Guardians | 5 |
| characters.affiliations | MADS | 5 |
| characters.affiliations | New Giant Warrior Pirates | 5 |
| characters.affiliations | Rumbar Pirates | 5 |
| characters.affiliations | Sand-Sand Clan | 5 |
| characters.affiliations | Spiders Cafe | 5 |
| characters.affiliations | Super Spot-Billed Duck Troops | 5 |
| characters.affiliations | Ukkari Hot-Spring Island | 5 |
| characters.origin_location_id | Drum Kingdom | 5 |
| characters.affiliations | Automata | 4 |
| characters.affiliations | Chinjao Family | 4 |
| characters.affiliations | Elbaph Royal Family | 4 |
| characters.affiliations | Freedom Fighters | 4 |
| characters.affiliations | Goa Kingdom | 4 |
| characters.affiliations | Inuarashi Musketeer Squad | 4 |
| characters.affiliations | Island of Rare Animals | 4 |
| characters.affiliations | Kyoshiro Family | 4 |
| characters.affiliations | Mimawarigumi | 4 |
| characters.affiliations | Neo Marines | 4 |
| characters.affiliations | SWORD | 4 |
| characters.affiliations | Seraphim | 4 |
| characters.affiliations | Shimotsuki Family | 4 |
| characters.affiliations | Vegapunk | 4 |
| characters.origin_location_id | Water 7 | 4 |
| characters.affiliations | Cacao Island | 3 |
| characters.affiliations | Criminal | 3 |
| characters.affiliations | Evil Black Drum Kingdom | 3 |
| characters.affiliations | G-2 | 3 |
| characters.affiliations | G-F Marine Base | 3 |
| characters.affiliations | Germa Kingdom | 3 |
| characters.affiliations | God's Guards | 3 |
| characters.affiliations | Groggy Monsters | 3 |
| characters.affiliations | His own crew | 3 |
| characters.affiliations | Kouzuki Hiyori | 3 |
| characters.affiliations | Macro Pirates | 3 |
| characters.affiliations | Nefertari Family | 3 |
| characters.affiliations | Nox Pirates | 3 |
| characters.affiliations | Riku Family | 3 |
| characters.affiliations | Sorbet Kingdom | 3 |
| characters.affiliations | Takoyaki 8 | 3 |
| characters.affiliations | Tom's Workers | 3 |
| characters.affiliations | Tonta Corps | 3 |
| characters.affiliations | Usopp Security Force | 3 |
| characters.affiliations | Wagomuland | 3 |
| characters.affiliations | World Economy News Paper | 3 |
| characters.origin_location_id | Drum Island | 3 |
| characters.origin_location_id | Foosha Village | 3 |
| characters.origin_location_id | God Valley | 3 |
| characters.origin_location_id | Kutsukku Island | 3 |
| characters.origin_location_id | Onigashima | 3 |
| characters.origin_location_id | Sorbet Kingdom | 3 |
| characters.origin_location_id | Syrup Village | 3 |
| characters.affiliations | CP6 | 2 |
| characters.affiliations | Drum Kingdom | 2 |
| characters.affiliations | Elbaph | 2 |
| characters.affiliations | Esperia Kingdom | 2 |
| characters.affiliations | Foosha Village | 2 |
| characters.affiliations | Gedatsu | 2 |
| characters.affiliations | Hyougoro Family | 2 |
| characters.affiliations | Mogaro Kingdom | 2 |
| characters.affiliations | Momoiro Island | 2 |
| characters.affiliations | Mt. Atama Thieves | 2 |
| characters.affiliations | Pirate crew | 2 |
| characters.affiliations | Prodence Kingdom | 2 |
| characters.affiliations | Pumpkin Cafe | 2 |
| characters.affiliations | Rain Dinners | 2 |
| characters.affiliations | Rosy Life Riders | 2 |
| characters.affiliations | Saruyama Alliance | 2 |
| characters.affiliations | Sea Floor | 2 |
| characters.affiliations | Thriller Bark Victim's Association | 2 |
| characters.affiliations | Uzuki Family | 2 |
| characters.affiliations | Wandering Clan | 2 |
| characters.affiliations | Water 7 | 2 |
| characters.affiliations | Yamato | 2 |
| characters.affiliations | Yonta Maria Grand Fleet | 2 |
| characters.origin_location_id | Esperia Kingdom | 2 |
| characters.origin_location_id | Kano Country | 2 |
| characters.origin_location_id | Loguetown | 2 |
| characters.origin_location_id | Mogaro Kingdom | 2 |
| characters.origin_location_id | New World | 2 |
| characters.origin_location_id | Orange Town | 2 |
| characters.origin_location_id | Organ Islands | 2 |
| crews.captain_id | Buggy | 2 |
| characters.affiliations | 16th Branch | 1 |
| characters.affiliations | A O Pirates | 1 |
| characters.affiliations | Agotogi Sand Merchants | 1 |
| characters.affiliations | Angel Island | 1 |
| characters.affiliations | Antonio's Graman | 1 |
| characters.affiliations | Bell-mère's mikan | 1 |
| characters.affiliations | Black Cage Corps | 1 |
| characters.affiliations | Bourgeois Kingdom | 1 |
| characters.affiliations | Brook | 1 |
| characters.affiliations | CP5 | 1 |
| characters.affiliations | CP7 | 1 |
| characters.affiliations | CP8 | 1 |
| characters.affiliations | Carmel | 1 |
| characters.affiliations | Charlos | 1 |
| characters.affiliations | Chouchou | 1 |
| characters.affiliations | Clan of D. | 1 |
| characters.affiliations | Cocoyasi Village | 1 |
| characters.affiliations | Conis | 1 |
| characters.affiliations | Crocus | 1 |
| characters.affiliations | Davy Family | 1 |
| characters.affiliations | Divine Squad | 1 |
| characters.affiliations | Doerena Kingdom | 1 |
| characters.affiliations | Donquixote Doflamingo | 1 |
| characters.affiliations | Dracule Mihawk | 1 |
| characters.affiliations | Egana | 1 |
| characters.affiliations | Enel | 1 |
| characters.affiliations | Figarland Shamrock | 1 |
| characters.affiliations | First Twenty | 1 |
| characters.affiliations | Flying Dutchman | 1 |
| characters.affiliations | Fujin | 1 |
| characters.affiliations | G-14 | 1 |
| characters.affiliations | Gaimon | 1 |
| characters.affiliations | Gan Fall | 1 |
| characters.affiliations | Ganzack Pirates | 1 |
| characters.affiliations | Gecko Pirates | 1 |
| characters.affiliations | Germa 66 | 1 |
| characters.affiliations | God Guardians | 1 |
| characters.affiliations | Gol D. Roger | 1 |
| characters.affiliations | Goldfish Empire | 1 |
| characters.affiliations | Gérard | 1 |
| characters.affiliations | Harahettania | 1 |
| characters.affiliations | Helmeppo | 1 |
| characters.affiliations | Higuma Bandits | 1 |
| characters.affiliations | Hocker | 1 |
| characters.affiliations | Hogback | 1 |
| characters.affiliations | Hound Pets | 1 |
| characters.affiliations | Human Auctioning House | 1 |
| characters.affiliations | Iceburg | 1 |
| characters.affiliations | Ilisia Kingdom | 1 |
| characters.affiliations | Isshi-100 | 1 |
| characters.affiliations | Johnny | 1 |
| characters.affiliations | Judy | 1 |
| characters.affiliations | Kamabakka Kingdom | 1 |
| characters.affiliations | Karakuri Island | 1 |
| characters.affiliations | Kaya | 1 |
| characters.affiliations | King (Title) | 1 |
| characters.affiliations | Kokoro | 1 |
| characters.affiliations | Kouzuki Family Oniwabanshu | 1 |
| characters.affiliations | Kumadori | 1 |
| characters.affiliations | Kurokoma Family | 1 |
| characters.affiliations | Kurozumi Orochi | 1 |
| characters.affiliations | Kuzan | 1 |
| characters.affiliations | Loki | 1 |
| characters.affiliations | Longarm Tribe | 1 |
| characters.affiliations | Lu Feld Conglomerate | 1 |
| characters.affiliations | Lulusia Kingdom | 1 |
| characters.affiliations | Lvneel Kingdom | 1 |
| characters.affiliations | Majiatsuka Kingdom | 1 |
| characters.affiliations | Marumieta | 1 |
| characters.affiliations | Matsuge | 1 |
| characters.affiliations | Moulon Family | 1 |
| characters.affiliations | Musketeers | 1 |
| characters.affiliations | Newkama Land | 1 |
| characters.affiliations | Nico Robin | 1 |
| characters.affiliations | Nojiko | 1 |
| characters.affiliations | Oide | 1 |
| characters.affiliations | Orange Town | 1 |
| characters.affiliations | Owl Library | 1 |
| characters.affiliations | Pacifista | 1 |
| characters.affiliations | Peachbeard Pirates | 1 |
| characters.affiliations | Penguin Trio | 1 |
| characters.affiliations | Perona | 1 |
| characters.affiliations | Portgas D. Ace | 1 |
| characters.affiliations | Pucci | 1 |
| characters.affiliations | Raijin Island | 1 |
| characters.affiliations | Rebel Army | 1 |
| characters.affiliations | Reformation Army | 1 |
| characters.affiliations | Roronoa Zoro | 1 |
| characters.affiliations | Roshio Pirates | 1 |
| characters.affiliations | Rosward Family | 1 |
| characters.affiliations | Royal Guard | 1 |
| characters.affiliations | Royal Guards | 1 |
| characters.affiliations | SMILE Factory | 1 |
| characters.affiliations | Sabaody Archipelago | 1 |
| characters.affiliations | Sakura Kingdom | 1 |
| characters.affiliations | Sankan Kingdom | 1 |
| characters.affiliations | Shakky's Rip-off Bar | 1 |
| characters.affiliations | Sheep's House | 1 |
| characters.affiliations | Shirahoshi | 1 |
| characters.affiliations | Slavery | 1 |
| characters.affiliations | Standing Kingdom | 1 |
| characters.affiliations | Stool Restaurant | 1 |
| characters.affiliations | Tama | 1 |
| characters.affiliations | Tenguyama Hitetsu | 1 |
| characters.affiliations | Tequila Wolf | 1 |
| characters.affiliations | Tessle Company | 1 |
| characters.affiliations | Tomato Gang | 1 |
| characters.affiliations | Tonjit | 1 |
| characters.affiliations | Torino Kingdom | 1 |
| characters.affiliations | Umit Shipping | 1 |
| characters.affiliations | Unnamed kingdom | 1 |
| characters.affiliations | Vegapunk/Edison | 1 |
| characters.affiliations | Vinsmoke Family | 1 |
| characters.affiliations | WCI 31 | 1 |
| characters.affiliations | Wanda | 1 |
| characters.affiliations | Wapol | 1 |
| characters.affiliations | Wapol Konzern | 1 |
| characters.affiliations | Warrior God | 1 |
| characters.affiliations | Yakuza | 1 |
| characters.affiliations | his own Mafia Family | 1 |
| characters.affiliations | his own crew | 1 |
| characters.devil_fruits | Aro Aro no Mi | 1 |
| characters.devil_fruits | Batto Batto no Mi | 1 |
| characters.devil_fruits | Goru Goru no Mi | 1 |
| characters.devil_fruits | Hebi Hebi no Mi, Model: King Cobra | 1 |
| characters.devil_fruits | Hito Hito no Mi, Model: Nika | 1 |
| characters.devil_fruits | Inu Inu no Mi, Model: Tanuki | 1 |
| characters.devil_fruits | Inu Inu no Mi, Model: Wolf | 1 |
| characters.devil_fruits | Kobu Kobu no Mi | 1 |
| characters.devil_fruits | Kote Kote no Mi | 1 |
| characters.devil_fruits | Modo Modo no Mi | 1 |
| characters.devil_fruits | Mosa Mosa no Mi | 1 |
| characters.devil_fruits | Nori Nori no Mi | 1 |
| characters.devil_fruits | Nuke Nuke no Mi | 1 |
| characters.devil_fruits | Raki Raki no Mi | 1 |
| characters.devil_fruits | Rako Rako no Mi | 1 |
| characters.devil_fruits | Ryu Ryu no Mi, Model: Pteranodon | 1 |
| characters.devil_fruits | Tori Tori no Mi, Model: Falcon | 1 |
| characters.devil_fruits | Uma Uma no Mi, Model: Pegasus | 1 |
| characters.devil_fruits | Ushi Ushi no Mi, Model: Giraffe | 1 |
| characters.devil_fruits | Uta Uta no Mi | 1 |
| characters.origin_location_id | Aoi Kingdom | 1 |
| characters.origin_location_id | At a random port | 1 |
| characters.origin_location_id | Bourgeois Kingdom | 1 |
| characters.origin_location_id | Cactus Island | 1 |
| characters.origin_location_id | Dawn Island | 1 |
| characters.origin_location_id | Germa Kingdom | 1 |
| characters.origin_location_id | Great Kingdom | 1 |
| characters.origin_location_id | Guanhao | 1 |
| characters.origin_location_id | Island of Rare Animals | 1 |
| characters.origin_location_id | Kamabakka Kingdom | 1 |
| characters.origin_location_id | Karakuri Island | 1 |
| characters.origin_location_id | Lvneel Kingdom | 1 |
| characters.origin_location_id | MADS | 1 |
| characters.origin_location_id | Moby Dick | 1 |
| characters.origin_location_id | Mt. Kintoki | 1 |
| characters.origin_location_id | North Pole | 1 |
| characters.origin_location_id | Packy: Loguetown | 1 |
| characters.origin_location_id | Porco Kingdom | 1 |
| characters.origin_location_id | Prodence Kingdom | 1 |
| characters.origin_location_id | Right Guard | 1 |
| characters.origin_location_id | Rural Village | 1 |
| characters.origin_location_id | Samuwanai Island | 1 |
| characters.origin_location_id | Sky Island | 1 |
| characters.origin_location_id | Sphinx | 1 |
| characters.origin_location_id | Standing Kingdom | 1 |
| characters.origin_location_id | Taya Kingdom | 1 |
| characters.origin_location_id | Tibet | 1 |
| characters.origin_location_id | Vespa Kingdom territory | 1 |
| characters.origin_location_id | Waford | 1 |
| characters.origin_location_id | Welbems Island | 1 |
| characters.origin_location_id | Yano Country | 1 |
| crews.captain_id | Charlotte Lola | 1 |
| crews.captain_id | Demalo Black | 1 |
| crews.captain_id | Eustass Kid | 1 |
| crews.captain_id | Fisher Tiger | 1 |
| crews.captain_id | Rapanui Pasqua | 1 |
| crews.captain_id | Squard | 1 |

## Anomalies de réconciliation (9)

| Type | Entité | Nom | Détail |
| --- | --- | --- | --- |
| invalid-value | characters | shiki | debut_chapter = 0 (fandom) hors contrainte : ignoré |
| invalid-value | characters | indigo | debut_chapter = 0 (fandom) hors contrainte : ignoré |
| invalid-value | characters | seagull-guns-nozdon | debut_chapter = 0 (fandom) hors contrainte : ignoré |
| invalid-value | characters | taro | debut_chapter = 0 (fandom) hors contrainte : ignoré |
| bounty-multiple-current | characters | gally | primes actuelles : 3450000, 5000000 → la plus élevée est retenue |
| invalid-value | characters | sunbell | debut_chapter = 0 (fandom) hors contrainte : ignoré |
| fruit-multiple-holders | devil_fruits | mori-mori-no-mi | porteurs actuels : stussy, aramaki-ryokugyu → aucun marqué actuel |
| captain-ambiguous | crews | bagi-kaizokudan | plusieurs capitaines Fandom : alvida, richie → non retenu |
| captain-ambiguous | crews | kuja-kaizokudan | plusieurs capitaines Fandom : boa-hancock, tritoma, shakuyaku, gloriosa → non retenu |

## Corrections manuelles appliquées (3)

| Entité | Slug | Champ | Avant | Après | Raison | Date |
| --- | --- | --- | --- | --- | --- | --- |
| characters | zeus | affiliations | {"crew":"mugiwara-no-ichimi","is_current":true} | {"crew":"mugiwara-no-ichimi","is_current":false} | Nuage-homie arme de Nami (« Living Weapon » sur Fandom), pas membre de l'équipage | 2026-11-12 |
| characters | pirate-bear | affiliations | {"crew":"mugiwara-no-ichimi","is_current":true} | {"crew":"mugiwara-no-ichimi","is_current":false} | Rattaché à l'équipage par Fandom sans qualificatif, absent des 10 membres officiels | 2026-11-12 |
| characters | pirate-penguin | affiliations | {"crew":"mugiwara-no-ichimi","is_current":true} | {"crew":"mugiwara-no-ichimi","is_current":false} | Rattaché à l'équipage par Fandom sans qualificatif, absent des 10 membres officiels | 2026-11-12 |

## Contrôle : équipage du Chapeau de paille

Équipage `mugiwara-no-ichimi` : **10 membres actuels** (attendu : 10), 4 fruits actuels, 10 primes actuelles. Contrôle **OK**.

| Membre | Rôle | Statut | Fruit actuel | Prime actuelle (berry) |
| --- | --- | --- | --- | --- |
| brook | Musician | alive | yomi-yomi-no-mi | 383,000,000 |
| franky | Carpenter | alive |  | 394,000,000 |
| jinbe | Helmsman | alive |  | 1,100,000,000 |
| monkey-d-luffy | Captain | alive | gomu-gomu-no-mi | 3,000,000,000 |
| nami | Navigator | alive |  | 366,000,000 |
| nico-robin | Archaeologist | alive | hana-hana-no-mi | 930,000,000 |
| roronoa-zoro | Right-hand man | alive |  | 1,111,000,000 |
| sanji | Cook | alive |  | 1,032,000,000 |
| tony-tony-chopper | Doctor | alive | hito-hito-no-mi | 1,000 |
| usopp | Sniper | alive |  | 500,000,000 |

## Entités canon sans source (0)

Plus portées par aucune source : conservées (slug publié), à traiter à la main.

_Aucun._

## Slugs suffixés après collision (10)

Slug souhaité déjà pris par une autre entité. Un slug publié ne change jamais ; un doublon se règle par `overrides/aliases.yaml`.

| Entité | Nom | Slug souhaité | Slug attribué |
| --- | --- | --- | --- |
| locations | Thriller Bark | surira-baku | surira-baku-58 |
| locations | Goat Island | goto-jima | goto-jima-106 |
| devil_fruits | Fruit du Canidé, Raccoon version | inu-inu-no-mi-moderu-bake-danuki | inu-inu-no-mi-moderu-bake-danuki-193 |
| devil_fruits | Phoenix Fruit | tori-tori-no-mi | tori-tori-no-mi-206 |
| crews | L'Équipage des Maquereaux | makuro-ichimi | makuro-ichimi-81 |
| crews | L'Équipage de Mad Treasure | maddo-toreja-kaizokudan | maddo-toreja-kaizokudan-85 |
| crews | Baggy's Delivery | bagizu-deribari | bagizu-deribari-88 |
| characters | Sanjuan Wolf | sanjuan-wolf | sanjuan-wolf-264 |
| characters | Silvers Rayleigh | silvers-rayleigh | silvers-rayleigh-549 |
| characters | Scarlett | scarlett | scarlett-730 |

## Complétude (valeurs manquantes)

| Champ | Lignes sans valeur |
| --- | --- |
| characters.name_fr | 903 |
| characters.name_jp | 266 |
| characters.age | 1092 |
| characters.debut_chapter | 296 |
| characters.origin_location_id | 1628 |
| characters.height_cm | 1231 |
| characters.status = 'unknown' | 110 |
| characters sans affiliation | 689 |
| crews.name_fr | 18 |
| crews.captain_id | 98 |
| devil_fruits.type | 3 |
| devil_fruits.name_fr | 14 |
| locations.sea | 13 |
| arcs.chapter_start | 50 |
