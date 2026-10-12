# Messages

**Maquette :** aucune (`17.png` n’existe pas).  
**Référence client :** liste visible, **verrouillée comme une appli de rencontre** tant que le compte n’a pas payé une campagne.  
**Tokens :** fond `#071426`, cartes `#10243a`, texte `#f4f7fb`, accent `#d6ff4a`.  
**Rôle :** 5e picto de la barre (à la place de Profil). Visible pour **tout le monde**.

Le paiement Stripe reste **simulé** et étiqueté comme tel. « Compte a payé » = une offre (19 / 39 / 55 / 65 / 49 / 109 / 149 €) + une **date** déjà enregistrées après 12 → 13 → 14. Pas de vrai débit.

## 1. Blocs (les deux états partagent la même liste)

1. **En-tête**
   - Titre « Messages » ≥ 20 px, texte `#f4f7fb`.
   - Engrenage / hamburger → `volet.md`.
   - Pas de slogan. Pas d’onglet Profil ici.
2. **Liste d’aperçus** (toujours rendue)
   - Rangées type messagerie : cercle (logo Bed Hop **ou** initiales sur `#10243a`) + nom + une ligne d’aperçu + heure.
   - Texte ≥ 17 px. Rangée cible **≥ 48 px**. Pictos au pouce, pas 12 px.
   - **Deux fils démo seulement**, tous liés à la campagne **Bed Hop**. Pas de 3e fil, pas de 6e appli, pas de marque réelle.
     1. **Bed Hop** — aperçu : « Une question sur le créneau 11 h – 17 h. »
     2. **Alexandre** — aperçu : « Je peux préciser l’écran Autour de toi. »
   - Cercle Alexandre = initiales **A**, pas de portrait inventé.
3. **Barre du bas** — 5 pictos, **Message** actif.

### État A — sans campagne payée

- La liste et les aperçus sont **floutés** (`filter: blur` sur la liste, pas un rectangle gris posé sur un picto).
- Rangées **non cliquables**. Aucune conversation ne s’ouvre.
- **Couche ancrée en bas** de la colonne (pleine largeur, fond carte `#10243a`), **pas** un panneau flottant au milieu :
  - Titre : « Disponible après une campagne »
  - Aide courte : une campagne payante (simulée) déverrouille les messages.
  - Bouton lime « Voir les offres → » → **12** (offre + jour). Pas de filtre 6 h / 12 h / 24 h.
- On ne fabrique pas de conversation « teaser » lisible sous le flou.

### État B — avec campagne payée

- Même liste, **nette**, cliquable.
- Tap sur une rangée → **fil** (même écran empilé, pas une maquette neuve) :
  - ← retour à la liste
  - nom du fil
  - bulles fond `#10243a` / accent pour soi, texte `#f4f7fb` / `#101d0a`
  - champ d’envoi en bas ≥ 48 px, placeholder « Écrire un message »
- Contenu démo **opérationnel** (créneau, écran Autour de toi). Pas un témoignage de marque. Pas « testé pendant deux semaines ».
- Envoi local seulement, reste sur l’appareil.

## 2. Ce qui devient cliquable

| Zone | Sans campagne payée | Avec campagne payée |
|---|---|---|
| Rangées | Rien | Ouvre le fil |
| Overlay « Voir les offres → » | **12** | absent |
| Engrenage | Volet | Volet |
| Champ d’envoi | absent | saisie + envoi local |
| ← dans un fil | — | liste Messages |
| Autres onglets | barre à 5 | barre à 5 |

## 3. Ce qui manque

| Besoin | Décision |
|---|---|
| Maquette 17 / avatars photo | Absents. Initiales ou logo Bed Hop `/visuels/logo-bedhop-tight.png` dans un cercle, sans débord. |
| Vrais messages live | **En service** : `/api/messages` entre propriétaires dont la campagne est payée (les deux côtés). |
| Autres correspondants | Liste des autres propriétaires payés (pas de fil inventé). |
| Déverrouillage | Paiement serveur (`booking.paid`). Un brouillon 04 ou un avis 06 **ne** suffit **pas**. |
| Superdesign | Indisponible. On s’arrête si on demande un autre layout que liste + flou + bandeau bas. |

## 4. Enchaînement

- **Depuis :** onglet Message (barre à 5).
- **Sans paiement :** overlay → **12** → 13 simulé étiqueté → 14. Au retour sur Message : état B si offre + date sont là.
- **Avec paiement :** liste → fil démo → retour liste.
- **Pas vers :** 03 / 04 depuis Messages. Un avis se donne depuis 02.
- **Volet :** Profil (11), Réglages, session.
- Profil n’est **pas** le 5e onglet.
