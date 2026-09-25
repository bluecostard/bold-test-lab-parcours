# Volet latéral

**Maquette :** aucune. Contrôle déjà prévu : **engrenage** (11, haut droite) / hamburger équivalent sur les en-têtes qui en ont un.  
**Tokens :** fond `#071426`, cartes `#10243a`, texte `#f4f7fb`, accent `#d6ff4a`.  
**Rôle :** Profil a quitté la barre. Le volet le porte, avec les réglages et la session.

Ce n’est **pas** un 6e onglet. Ce n’est **pas** un panneau flottant au milieu d’une maquette : le volet **glisse depuis le bord** (colonne téléphone), fond de page légèrement atténué derrière. Fermeture : tap hors volet, ou contrôle de fermeture.

## 1. Blocs

1. **Tête du volet**
   - Logo Gemelo dans son cadre, **sans slogan**.
   - Si connecté : prénom (ex. Alexandre sur 11) ≥ 17 px. Si non : « Invité ».
2. **Liste verticale**, une rangée = carte ou ligne pleine largeur, cible **≥ 48 px**, texte **≥ 17 px**, picto au pouce (pas 12 px) :

   | Rangée | Visible | Destination |
   |---|---|---|
   | **Profil** | toujours | **11** (maquette conservée ; slogan retiré ; barre du bas = 5 pictos, plus l’onglet Profil) |
   | **Réglages** | toujours | écran réglages déjà spécifié (CGV, CGU, données, Contact). Pas de barre basse. |
   | **Se connecter** | si déconnecté | login Clerk déjà reconstruit. Après succès → 11. |
   | **Se déconnecter** | si connecté | Clerk sign-out. On reste où on était, ou 01. Pas les deux rangées à la fois. |

3. **Interdit dans ce volet**
   - Chercher (champ dans Explorer)
   - Explorer (3e onglet)
   - Message (5e onglet)
   - Découvrir / Communauté / Classement (déjà dans la barre)

## 2. Ce qui devient cliquable

| Zone | Action |
|---|---|
| Profil | Ferme le volet, ouvre 11. |
| Réglages | Ferme le volet, ouvre réglages. |
| Se connecter | Ferme le volet, ouvre Clerk. |
| Se déconnecter | Ferme la session, ferme le volet. |
| Fond atténué / fermer | Referme, écran précédent inchangé. |

Pas d’URL inventée. Pas de 6e appli. Pas de témoignage dans le volet.

## 3. Ce qui manque

- Pas de PNG volet. On réutilise les pictos déjà dans l’app (personne, engrenage, porte) **dans leur cercle / ligne**, sans pastille grise par-dessus.
- 11 garde ses blocs maquette (contribution, projet, « Faire tester mon service »). Ateliero / Noma des PNG : noms réels seulement s’ils existent déjà (Bed Hop, Du rose au noir, Comptoir du Oui) — on n’invente pas un 4e projet « à moi ».
- Login : écran Clerk existant, on n’en invente pas un.

## 4. Enchaînement

- **Depuis :** engrenage / hamburger sur 01, 11, Explorer, Messages, classement, Communauté (09 en mode onglet).
- **Vers :** 11, réglages, Clerk.
- **Retour :** écran d’où le volet a été ouvert, sauf après « Se connecter » réussi → 11.
- 11 « Faire tester mon service » reste le chemin campagne payante vers **12**, comme aujourd’hui. C’est aussi le déverrouillage de Messages.
