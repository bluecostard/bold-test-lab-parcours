# 09 — Les applis des testeurs

**Maquette :** `app/public/ecrans/09.png`  
**Rôle :** galerie plein écran des projets des meilleurs testeurs. **Pas** un parcours de test ni d’avis.

## 1. Ce qui reste de la maquette

Ordre des blocs, inchangé.

1. **En-tête**
   - Picto trophée à gauche.
   - Titre « Les applis des testeurs » (les mots « des testeurs » en accent).
   - Croix **X** à droite (fermeture). Pas de barre d’onglets basse sur ce PNG : on n’en ajoute pas.
2. Sous-titre « Les 10 meilleurs contributeurs »
3. Texte d’intro : « Ces projets gagnent en visibilité grâce aux avis utiles de notre communauté, pas par l’achat d’espace publicitaire. »
4. Bandeau info : picto groupe + « Leurs projets restent ici tant qu’ils figurent dans le top 10. »
5. **Liste numérotée de cartes**, une sous l’autre, scroll vertical.
   - Chaque carte (même structure que le PNG) :
     - Grand visuel à gauche dans un cadre arrondi, `overflow: hidden`, une image, pas de débord.
     - Colonne droite : logo dans son cadre + nom + pitch + citation entre guillemets + tags + bouton lime « Découvrir → »
     - Chiffre 1, 2, 3… en haut à gauche de la carte.

Les cartes fictives Plantae / Mindflow / Goodspot / Albea **disparaissent**. On ne les redessine pas. On garde le **même gabarit de carte** pour les projets réels seulement.

## 2. Ce qui devient cliquable / saisissable

| Zone | Action |
|---|---|
| X | Ferme et revient à 01 (ou à l’écran d’origine : 01 ou 10). |
| Visuel / logo | Le logo ouvre le **site** du projet (règle Gemelo). Le visuel n’ouvre pas l’avis. |
| Découvrir → | Ouvre la **page dédiée projet testeur** déjà reconstruite : captures (rail horizontal, un écran visible, `overflow: hidden`), 1 lien site, 1 lien réseau, like. |
| Carte entière hors bouton | Même destination que Découvrir, si besoin d’une grande zone tactile. |

**Interdit sur cet écran et après Découvrir :** tester, donner un avis, ouvrir 03/04/05. Ces projets ne sont pas des campagnes entrepreneur.

## 3. Ce qui manque

Seuls **deux** projets testeurs existent. On n’invente pas 8 autres pour remplir le top 10.

| Rang | Projet | Visuel | Logo | Pitch | Citation | Tags | Site | Réseau |
|---|---|---|---|---|---|---|---|---|
| 1 | Du rose au noir | `/visuels/visuel-rose.jpg` | `/visuels/logo-rose.png` | Une idée sur ton argent, ta situation | « Le parcours est simple et les deux formules sont bien distinctes. » | Site · Séparation · Argent | `https://duroseaunoir.online` | Instagram, **href absent** → icône maquette atténuée dans son cercle, pas d’URL inventée, pas de carré gris |
| 2 | Comptoir du Oui | `/visuels/visuel-comptoir-tight.png` | `/visuels/logo-comptoir-tight.png` | La mutuelle du jour J | « Le livret et la cagnotte se comprennent dès l’accueil. » | Application · Mariage · Cagnotte | `https://comptoir-du-oui.vercel.app` | Instagram, **href absent** → même traitement |

- Pas de 3e ni 4e carte tant qu’il n’y a pas de vrai projet + vraie capture + vrai site.
- Le sous-titre « Les 10 meilleurs contributeurs » **reste** (texte maquette). La liste n’affiche que les projets fournis.
- Une seule capture par projet testeur aujourd’hui. La page dédiée le gère déjà (rail à un écran).

## 4. Enchaînement

- **Depuis :** 01 — bouton étendre / « Ouvrir en plein écran → » de la section « Les applis des testeurs ». Dans ce cas le PNG s’applique : **X** à droite, **pas** de barre basse ajoutée sur cette ouverture.
- **Depuis :** onglet bas **Communauté** (2e picto de la barre à 5) — même contenu 09, barre à 5 pictos visible, Communauté actif. Le X n’est pas obligatoire ici (on quitte par un autre onglet).
- **Vers :** page dédiée projet testeur (déjà reconstruite).
- **Pas vers :** 02, 03, 04, 05.
- **Retour / X :** 01 ou écran précédent.

Explorer et Message ont leurs **propres onglets** (`explorer.md`, `messages.md`). Chercher est le champ **dans** Explorer. Profil est dans le **volet**, plus dans la barre.
