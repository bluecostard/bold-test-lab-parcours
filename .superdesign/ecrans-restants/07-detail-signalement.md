# 07 — Détail du signalement (entrepreneur)

**Maquette :** `app/public/ecrans/07.png`  
**Rôle :** lecture d’un problème agrégé, preuves, question facultative, relance payante.

## 1. Ce qui reste de la maquette

Ordre des blocs, inchangé. Remplacer Noma par **Bed Hop** dans les mêmes cadres.

1. **←** + titre « Détail du signalement »
2. Sous-titre « Campagne payante · Bed Hop »
3. **Identité**
   - Logo Bed Hop dans son cadre.
   - Nom, pitch, tags (Application · Repos · Entreprise).
4. **Carte titre du problème**
   - Picto insecte + titre du signalement (ex. démo à écrire avec le vocabulaire Bed Hop, pas « Réserver » Noma).
   - Ligne écran concerné.
   - Pastille droite « À vérifier » + picto horloge.
5. **Deux stats**
   - Gauche : picto groupe + « 12 signalements de testeurs indépendants » (nombre démo tant que le live n’existe pas).
   - Droite : picto signal + « Même problème confirmé sur plusieurs appareils ».
6. **Carte Étapes pour reproduire**
   - Liste numérotée 1 / 2 / 3, fond carte.
   - Contenu : consignes Bed Hop, pas les 3 lignes Noma.
7. **Deux cartes côte à côte**
   - **Résultat attendu** (pastille verte) + texte.
   - **Résultat observé** (pastille croix) + texte.
8. **Carte Preuves jointes**
   - Titre + « 2 fichiers › » à droite.
   - Gauche : capture dans un cadre, `overflow: hidden`.
   - Droite : tuile vidéo avec picto lecture et durée si un fichier existe.
9. **Carte Question facultative au testeur**
   - Picto message + titre.
   - Zone de texte préremplie d’une question (saisissable).
   - Bouton lime « Envoyer la question → »
   - Fine print : « Le testeur peut répondre s’il le souhaite. Votre rapport restera disponible sans réponse. »
10. **Rangée Lancer un test ciblé de ce problème**
    - Picto cible + titre + chevron ›
    - Aide : « Obtenez plus de retours de testeurs sur ce point précis. »

## 2. Ce qui devient cliquable / saisissable

| Zone | Action |
|---|---|
| ← | Retour à 16 (rapport) ou 15 (résultats) selon l’origine. |
| Logo Bed Hop | Ouvre `https://bedhop.online` (règle Gemelo : le logo d’un projet ouvre son site). |
| « 2 fichiers › » | Fait défiler jusqu’aux preuves / ouvre la preuve suivante dans le cadre. Pas de galerie inventée hors maquette. |
| Capture | Reste dans son cadre. Pas d’overlay flottant au milieu de l’écran. |
| Tuile vidéo | Lit la vidéo dans le cadre si un fichier existe ; sinon icône maquette atténuée, pas de rectangle gris. |
| Zone question | Saisissable, max 500. |
| Envoyer la question → | Enregistre la question. Le testeur concerné (ou tous les testeurs du signalement, démo locale) voit 08. Confirmation courte sous le bouton, pas de nouvelle page. |
| Lancer un test ciblé › | Ouvre **12** Choisir une offre + jour. Pas de nouvel écran : aucune maquette « test ciblé ». Le jour reste obligatoire. Pas d’onglets 6 h / 12 h / 24 h. |

## 3. Ce qui manque

- **Titre et textes Noma** à réécrire pour Bed Hop, dans les mêmes blocs. Proposition de contenu (à valider, pas une nouvelle mise en page) :
  - Titre : « Le créneau 11 h – 17 h n’est pas clair »
  - Écran : « Autour de toi »
  - Étapes : « Ouvrez Bed Hop. » / « Cherchez une chambre entre 11 h et 17 h. » / « Dites si la réservation est claire. »
  - Attendu : « Les chambres disponibles entre 11 h et 17 h s’affichent. »
  - Observé : « Le créneau n’est pas compris du premier coup. »
- **Preuve photo :** `/visuels/iphone-autour.png` ou `/visuels/ecran-bedhop.jpg` dans le cadre.
- **Preuve vidéo :** aucun fichier. Tuile = icône lecture de la maquette, durée masquée, pas d’URL inventée.
- **Vrais compteurs live** (12 signalements, multi-appareils) : données de démonstration jusqu’à un backend. Le libellé reste celui du PNG.
- **Écran « test ciblé »** : n’existe pas. On réutilise 12. Si le client veut un formulaire spécifique, c’est bloqué (pas de maquette, Superdesign indisponible).

## 4. Enchaînement

- **Depuis :** 16 « Voir détails et preuves → » sur une correction prioritaire. (Aujourd’hui ce lien ouvre un texte inline : à remplacer par 07, sans changer 16 autour.)
- **Depuis :** 15 « Suivre les retours → » peut aussi mener ici si un signalement est ouvert — 15 reste tel quel, 07 est la destination du détail.
- **Vers :** 08 côté testeur après envoi de question.
- **Vers :** 12 si l’entrepreneur lance un test ciblé.
- **Retour :** 16 ou 15.

Paiement éventuel après 12 : 13 simulé, étiqueté comme tel, puis 14.
