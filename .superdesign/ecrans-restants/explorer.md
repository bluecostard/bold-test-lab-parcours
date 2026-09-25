# Explorer

**Maquette :** aucune (`17.png` n’existe pas). Superdesign et Mobbin indisponibles.  
**Référence client :** **Instagram Explore** — le **principe**, pas le look Instagram.  
**Tokens :** fond `#071426`, cartes `#10243a`, texte `#f4f7fb`, accent `#d6ff4a`.  
**Rôle :** 3e onglet (milieu) de la barre à 5 pictos. Découvrir des visuels. Chercher est **ici**, pas un 6e onglet.

On ne crée pas un nouveau langage visuel. On ne dessine pas un PNG de remplacement. On n’utilise pas le générateur d’image natif de Cursor.

## 1. Blocs (de haut en bas)

1. **En-tête**
   - Logo Gemelo à gauche, même cadre / fond que 01, **sans slogan**.
   - Engrenage / hamburger à droite → `volet.md`.
2. **Champ Chercher** (comme Instagram, collé sous l’en-tête)
   - Fond carte `#10243a`, hauteur **≥ 48 px**.
   - Loupe à gauche, dans le champ, visible au pouce (pas 12 px).
   - Placeholder : « Chercher un projet ».
   - Texte saisi ≥ 17 px.
   - Filtre **sur place** la mosaïque. Pas de page Chercher séparée, pas d’onglet.
3. **Mosaïque** (principe Instagram)
   - Grille type Explore : certaines cellules **plus grandes**.
   - **Bed Hop** : cellule large (2 colonnes × 2 rangées). Seule **campagne**.
   - **Du rose au noir** : cellule 1 × 1.
   - **Comptoir du Oui** : cellule 1 × 1.
   - Une image par cellule, cadre, `overflow: hidden`, **pas de débord**.
   - Pas de texte posé sur un autre texte. Pas de PNG en fond de page.
   - Pastille discrète **sur** la cellule, coin, fond carte ou accent :
     - Bed Hop : « Campagne »
     - les deux autres : « Communauté »
   - **Pas d’autre cellule.** On ne remplit pas les trous avec une 4e, 5e ou 6e appli.
4. **Barre du bas** — 5 pictos, **Explorer** actif. Voir `00-index.md`.

État vide (recherche sans correspondance) : une ligne « Aucun projet » ≥ 17 px. Pas de suggestions inventées.

## 2. Ce qui devient cliquable

| Zone | Action |
|---|---|
| Champ Chercher | Focus, saisie. Filtre les 3 visuels (nom). |
| Cellule **Bed Hop** | Ouvre **02** Campagne. De là on peut tester / aviser (03 / 04). |
| Cellule **Du rose au noir** | Page dédiée projet testeur déjà spécifiée (comme 09 → Découvrir). |
| Cellule **Comptoir du Oui** | Même page dédiée testeur. |
| Logo Gemelo | Rien. |
| Engrenage | Volet. |
| Autres onglets | Destinations de la barre à 5. |

**On ne teste et on n’avise que les campagnes.** Un visuel testeur **n’ouvre pas** 03 / 04 / 05. Pas de bouton « Tester » / « Donner un avis » sur une cellule Communauté.

## 3. Ce qui manque

| Besoin | Fichier / décision |
|---|---|
| Visuel Bed Hop | `/visuels/ecran-bedhop.jpg` (repli : `/visuels/iphone-accueil.png`). Pas de fond de page. |
| Visuel Du rose au noir | `/visuels/visuel-rose.jpg` |
| Visuel Comptoir du Oui | `/visuels/visuel-comptoir-tight.png` |
| Maquette 17 | Absente. Principe Instagram + tokens. Arrêt si on demande un autre layout. |
| Autres projets | N’existent pas. Grille à **3** cellules, dont 1 large. |
| URL, faux témoignages, Noma / Plantae… | Interdits. |

Le logo d’un projet, **sur la page dédiée ou 02**, ouvre le site (règle Gemelo). Dans la mosaïque, le tap ouvre la page, pas l’URL.

## 4. Enchaînement

- **Depuis :** onglet Explorer (toute écran qui porte la barre à 5).
- **Vers campagne :** 02 Bed Hop.
- **Vers testeur :** page dédiée déjà reconstruite. Retour = Explorer (ou 09 si on vient de Communauté — ici on revient à Explorer).
- **Pas vers :** 03, 04 depuis un visuel testeur.
- **Chercher :** reste sur cet écran.
- **Volet :** Profil / Réglages / session, puis retour Explorer.
