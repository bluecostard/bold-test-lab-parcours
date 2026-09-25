# 04 — Compte rendu de test

**Maquette :** `app/public/ecrans/04.png`  
**Rôle :** formulaire structuré du testeur, étape 2 sur 3. Plus gros trou à coder.  
**Typo :** section 6 — corps ≥ 17 px (mieux 18), titres de carte ≥ 20 px, cibles ≥ 48 px, étoiles ≥ 32 px. Pas de texte 14 px, pas de picto 12 px. Scroll OK.

## 1. Ce qui reste de la maquette

Ordre des blocs, de haut en bas, inchangé.

1. **En-tête**
   - Logo Gemelo à gauche (remplace « Bold test lab » dans le **même cadre**, même fond `#071426`, sans bande ni pastille).
   - Pas de slogan sous le logo.
   - Lien « ← Retour ».
2. **Titre**
   - « Compte rendu de test — **Bed Hop** »
   - Sous-titre : « Étape 2 sur 3 · Problèmes et expérience »
   - Barre de progression à 2/3 (premier tiers + deuxième tiers accent `#d6ff4a`, dernier tiers atténué).
3. **Carte Bug rencontré ?**
   - Picto insecte + titre « Bug rencontré ? »
   - Aide : « Avez-vous rencontré un bug ou un comportement anormal pendant votre test ? »
   - Deux radios horizontaux : **Oui** (sélectionné dans la maquette, pastille accent + bord accent) et **Non**.
4. **Champ Sur quel écran ? \*** (visible si Oui)
   - Liste déroulante. Placeholder maquette : « Recherche des lieux » → pour Bed Hop : noms d’écrans réels uniquement (voir données manquantes).
5. **Champ Décrivez précisément le bug \*** (visible si Oui)
   - Zone de texte, compteur `0/500` en bas à droite.
   - Exemple maquette à remplacer : plus « Le bouton Réserver ne répond pas ».
6. **Champ Comment le reproduire ? \*** (visible si Oui)
   - Zone de texte, liste numérotée encouragée, `0/500`.
7. **Champ Résultat attendu / résultat obtenu \*** (visible si Oui)
   - Une seule zone, `0/500`.
   - Le testeur peut écrire les deux parties ; 05 les sépare à la vérification si le texte contient les deux libellés, sinon 05 demande le résultat attendu à part.
8. **Rangée preuves**
   - À gauche : « Ajouter une capture » — picto appareil photo — « PNG, JPG (max 10 Mo) »
   - À droite : « Ajouter une vidéo » — picto caméra — « MP4, MOV (max 100 Mo) »
   - Deux tuiles côte à côte, fond carte `#10243a`.
9. **Carte Batterie**
   - Picto batterie + titre « Batterie »
   - Pastille à droite : « Question uniquement pour les applications mobiles »
   - Aide : « L’application consomme-t-elle beaucoup de batterie ? »
   - Quatre radios : **Non** / **Un peu** / **Beaucoup** / **Je ne sais pas**
   - Bed Hop est une application : la carte **s’affiche**.
10. **Carte Vos notes**
    - Picto étoile + titre « Vos notes »
    - Aide : « Donnez vos impressions globales sur votre expérience de Bed Hop. »
    - **Design visuel** — 5 étoiles + texte d’aide lisibilité + « Pourquoi cette note ? (optionnel) » `0/500`
    - **Logique du parcours** — 5 étoiles + texte d’aide fluidité + « Pourquoi cette note ? (optionnel) » `0/500`
11. **Bouton lime pleine largeur** « Continuer → »

Typo et cartes : mêmes places que le PNG. Pas de panneau flottant.

## 2. Ce qui devient cliquable / saisissable

| Zone | Action |
|---|---|
| ← Retour | Revient à 03 (avis texte) si on vient de 03, sinon à 02. Brouillon conservé. |
| Logo Gemelo | Rien. Pas de lien. |
| Oui / Non | Obligatoire. **Non** masque les champs bug (écran, description, reproduction, résultat). Batterie et notes restent. |
| Liste « Sur quel écran ? » | Une valeur parmi les écrans fournis pour Bed Hop. Obligatoire si Oui. |
| 3 zones de texte bug | Saisie, max 500, compteur visible. Obligatoire si Oui. |
| Ajouter une capture | Sélecteur fichier image. Aperçu dans la tuile, croix pour retirer (comme 03). Facultatif ici ; 05 l’affiche. |
| Ajouter une vidéo | Sélecteur fichier vidéo. Facultatif. |
| Radios Batterie | Une valeur obligatoire pour une appli mobile. |
| Étoiles Design | 1 à 5, obligatoire. |
| Étoiles Parcours | 1 à 5, obligatoire. |
| Pourquoi cette note (×2) | Facultatif, max 500. |
| Continuer → | Va à 05. Bloqué tant que les champs visibles obligatoires sont vides. Étoiles à 0 = incomplet. |

## 3. Ce qui manque

- **Étape 1 sur 3** : aucune maquette dédiée. On n’invente pas cet écran. 03 joue ce rôle sans barre.
- **Liste d’écrans Bed Hop** : les captures existantes sont `/visuels/ecran-bedhop.jpg`, `/visuels/iphone-accueil.png`, `/visuels/iphone-autour.png`, `/visuels/iphone-comment.png`. Libellés à utiliser, sans en inventer d’autres : « Accueil », « Autour de toi », « Comment ça marche ». Si un quatrième écran n’a pas de nom fourni, il n’entre pas dans la liste.
- **Vidéo de démo** : aucun fichier vidéo projet n’est fourni. La tuile vidéo reste l’icône de la maquette jusqu’à upload testeur.
- **Exemple prérempli Noma** : à ne pas garder. Champs vides à l’ouverture, ou brouillon local s’il existe.
- **Marque PNG** : « Bold test lab » + slogan « Des meilleurs produits grâce à vos avis » → logo Gemelo seul, slogan absent.

## 4. Enchaînement

- **Depuis :** 03 « Publier mon avis → » (l’avis texte est déjà saisi ; la publication réelle a lieu en 05).
- **Vers :** 05 Vérifier mon compte rendu.
- **Retour :** 03 ou 02, brouillon intact.
- **Si bug = Non :** 05 marque les items bug comme sans objet (complétés), et n’affiche pas le champ « Que deviez-vous voir… ».

## 5. Données à persister (brouillon local)

`campaignId`, `hadBug`, `screen`, `bugText`, `repro`, `expectedObserved`, `photo` (fichier local), `video` (fichier local), `battery`, `designScore`, `designWhy`, `journeyScore`, `journeyWhy`, plus le texte 03.

Pas de « testé pendant deux semaines » nulle part sur cet écran.

## 6. Contraintes chiffrées (lisibilité)

Remplir le formulaire doit être **agréable**. Textes et icônes assez grands. **Ne pas compresser** pour tout faire tenir sans scroll : l’écran défile. L’ordre des blocs de `04.png` ne change pas.

| Élément | Minimum | Cible |
|---|---|---|
| Corps et labels (aide, libellés de champ, radios, pastille Batterie, « Pourquoi cette note ») | **17 px** | **18 px** |
| Titres de carte (« Bug rencontré ? », « Batterie », « Vos notes ») | **20 px** | 20 px ou plus |
| Titre d’écran « Compte rendu de test — Bed Hop » | 20 px | même famille que les titres de carte |
| Radios Oui / Non et les 4 radios Batterie | cible tactile **≥ 48 × 48 px** | pastille + libellé dans la cible |
| Étoiles Design et Parcours | glyphe **≥ 32 px**, cible **≥ 48 px** | espacées pour le pouce (gap **≥ 10 px**) |
| Tuiles « Ajouter une capture » / « Ajouter une vidéo » | cible **≥ 48 px** | plutôt 56–64 px de haut, picto visible au pouce |
| Pictos de carte (insecte, batterie, étoile, appareil, caméra) | visibles au pouce | **pas 12 px** |
| Compteur `0/500` | ≥ 16 px | 16–17 px, jamais 14 px |
| Bouton « Continuer → » | déjà pleine largeur | min-height ≥ 52 px, texte ≥ 17 px |

**Interdit :** texte à 14 px, picto à 12 px, labels à 16 px trop serrés, réduction des marges entre cartes pour « tout caser ».

Si titre de critère + 5 étoiles 32 px ne tiennent pas sur une ligne, les étoiles passent **sous** le libellé, **dans la même carte**. On n’agrandit pas en réordonnant les blocs. On n’invente pas de 3e critère de note.

