# 05 — Vérifier mon compte rendu

**Maquette :** `app/public/ecrans/05.png`  
**Rôle :** étape 3, contrôle de complétude avant publication.  
**Typo :** section 5 — mêmes planchers que 04 (corps ≥ 17 px, titres de carte ≥ 20 px, rangées ≥ 48 px). Pas de texte 14 px, pas de picto 12 px. Scroll OK.

## 1. Ce qui reste de la maquette

Ordre des blocs, inchangé.

1. **←** + titre « Vérifier mon compte rendu » (le mot « compte rendu » en accent `#d6ff4a`).
2. Sous-titre « Avant publication ».
3. **Identité projet**
   - Logo Bed Hop dans son cadre (`/visuels/logo-bedhop-tight.png`), sans débord.
   - Nom **Bed Hop**.
   - Pitch : « Une heure de lit autour de toi ».
   - Tags : Application · Repos · Entreprise.
4. **Carte Résumé du problème**
   - Picto insecte + titre « Résumé du problème »
   - Lien « Modifier » + picto crayon, à droite.
   - Titre du bug (texte saisi en 04).
   - Ligne « Écran concerné » + valeur choisie.
5. **Carte Vérifier la complétude**
   - Picto liste + titre « Vérifier la complétude »
   - Aide : « Votre compte rendu doit contenir ces informations. »
   - Quatre lignes, chacune : pastille (vert = complété, accent attention = à compléter) + libellé + détail + statut à droite.
     1. Écran concerné
     2. Étapes pour reproduire
     3. Résultat obtenu
     4. Résultat attendu
6. **Champ inline si un item est à compléter**
   - Dans la maquette : « Que deviez-vous voir après avoir appuyé ? \* »
   - Zone de texte sous la checklist, même carte ou juste en dessous, fond input sombre.
   - Le libellé s’adapte à l’item manquant (écran, étapes, obtenu, attendu). Un seul champ à la fois, celui du premier item incomplet.
7. **Rangée preuves**
   - Gauche : aperçu capture dans un cadre téléphone, `overflow: hidden`, une image à la fois.
   - Droite : tuile pointillée « Ajouter une vidéo · Optionnel » + bouton « Choisir une vidéo ».
8. **Bandeau info**
   - Picto i + « Un compte rendu complet aide l’entrepreneur même si vous ne revenez pas répondre plus tard. »
9. **Bouton lime** « Compléter et publier » — **désactivé** tant qu’un item obligatoire est à compléter (gris/atténué comme le PNG).
10. **Bouton contour** « Enregistrer le brouillon ».

Pas de barre d’étapes sur ce PNG : on n’en ajoute pas.

## 2. Ce qui devient cliquable / saisissable

| Zone | Action |
|---|---|
| ← | Retour à 04, valeurs conservées. |
| Modifier | Retour à 04, focus carte bug. |
| Champ inline « à compléter » | Saisie obligatoire pour débloquer la ligne. Max 500. Enregistre dans le brouillon 04. |
| Aperçu capture | Ouvre la capture en grand dans le cadre (pas un overlay flottant au milieu). Croix pour retirer. |
| Choisir une vidéo | Sélecteur fichier, facultatif. |
| Compléter et publier | Actif seulement si checklist 100 % verte (ou sans objet si pas de bug). Publie avis + compte rendu. Va à 06. |
| Enregistrer le brouillon | Sauve en local, retour 02. Pas de publication. |

## 3. Ce qui manque

- **Capture Bed Hop** pour l’aperçu démo : utiliser `/visuels/ecran-bedhop.jpg` ou `/visuels/iphone-autour.png` si le testeur n’a rien chargé — uniquement en donnée de prévisualisation designer, pas comme fond de page. En usage réel : aperçu du fichier choisi en 03/04, sinon tuile vide du même format.
- **Vidéo** : aucun MP4 fourni. Tuile « Ajouter une vidéo » reste l’état maquette.
- **Résultat attendu** : souvent manquant si 04 a un seul champ mixte. C’est volontairement l’item « à compléter » de la maquette.
- Si **bug = Non** : la carte « Résumé du problème » affiche « Aucun bug signalé ». Les 4 lignes passent à « Sans objet / Complété ». Le champ inline bug est masqué. « Compléter et publier » s’active dès que Design + Parcours + (Batterie si appli) sont remplis — ces notes ne sont pas dans la checklist PNG ; elles ont déjà été exigées en 04.

## 4. Enchaînement

- **Depuis :** 04 « Continuer → »
- **Vers publication :** 06 Avis publié (déjà reconstruit). Le compte rendu publié devient un signalement lisible en 07 côté entrepreneur.
- **Vers brouillon :** 02 Campagne.
- **Modifier :** 04.

Connexion Clerk : si le testeur n’est pas connecté, 05 « Compléter et publier » envoie d’abord au login Clerk déjà reconstruit, puis revient ici. On n’invente pas d’écran de connexion.

## 5. Contraintes chiffrées (lisibilité)

Même exigence que 04 : lire et corriger le compte rendu doit rester confortable. **Ne pas compresser** pour éviter le scroll. Ordre des blocs de `05.png` inchangé.

| Élément | Minimum | Cible |
|---|---|---|
| Corps et labels (sous-titre, pitch, tags, « Écran concerné », détails de checklist, bandeau i, « Optionnel ») | **17 px** | **18 px** |
| Titres de carte (« Résumé du problème », « Vérifier la complétude ») | **20 px** | 20 px ou plus |
| Titre d’écran « Vérifier mon compte rendu » | 20 px | le mot « compte rendu » reste en accent |
| Lien « Modifier » | 17 px, cible ≥ 48 px | picto crayon visible au pouce, pas 12 px |
| Lignes de checklist | hauteur de rangée **≥ 48 px** | pastille + libellé + statut lisibles |
| Champ inline « à compléter » | texte ≥ 17 px, zone ≥ 48 px de haut | compteur ≥ 16 px, jamais 14 px |
| Aperçu capture / tuile vidéo | cadre **≥ 48 px** | overflow hidden, une image, pas de débord |
| Pictos (insecte, liste, i, caméra) | visibles au pouce | **pas 12 px** |
| « Compléter et publier » / « Enregistrer le brouillon » | min-height ≥ 52 px | texte ≥ 17 px |

**Interdit :** texte 14 px, picto 12 px, checklist tassée. Les notes 04 (étoiles, batterie) ne s’affichent pas en checklist ici ; elles ont déjà été exigées en 04.

