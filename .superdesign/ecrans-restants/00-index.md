# Dossier d’écrans restants — Gemelo

Spécifications prêtes à coder. Aucune ligne de code dans ce dossier.

## Identité

- Nom et logo : **Gemelo** (`/logo-gemelo.png`). Jamais Gememelo, jamais Bold test lab.
- Couleurs : fond `#071426`, cartes `#10243a`, texte `#f4f7fb`, accent `#d6ff4a` (texte sur accent `#101d0a`).
- Textes lisibles ≥ 16 px partout. Pictos au pouce.
- Sur **04** et **05** : plus grand encore — voir les contraintes chiffrées de chaque fichier (corps ≥ 17 px, titres de carte ≥ 20 px, cibles ≥ 48 px).
- Slogan global retiré. Ne pas le remettre, y compris sous le logo de 04 / 11.
- On ne teste et on ne donne un avis **que** sur une campagne entrepreneur.
- Campagne démo : **Bed Hop**. Projets testeurs : **Du rose au noir**, **Comptoir du Oui**.
- Noma, Plantae, Mindflow, Goodspot, Albea = fictifs des PNG. Remplacer par les vrais noms ci-dessus.
- Ne pas écrire « testé pendant deux semaines ».
- Ne pas inventer une 6e appli, une URL, ni un témoignage de marque réelle.

## Barre du bas — 5 pictos (tranché)

Cette barre **remplace** l’ancienne consigne « menus extra = volet, pas de 5e onglet ». Il n’y a plus 4 onglets.

Ordre exact, de gauche à droite :

| # | Picto | Destination |
|---|---|---|
| 1 | **Découvrir** | `01` Accueil |
| 2 | **Communauté** | `09` Les applis des testeurs |
| 3 | **Explorer** | `explorer.md` — au milieu |
| 4 | **Classement** | écran classement déjà reconstruit |
| 5 | **Message** | `messages.md` |

**Profil** sort de la barre : il s’ouvre depuis le **volet latéral** (engrenage / hamburger déjà prévu) — `volet.md`.

**Chercher** n’est pas un 6e onglet. Le champ est **dans Explorer**, comme Instagram.

Écrans qui portent cette barre : 01, onglet Communauté (09), classement, Explorer, Messages, et 10 / 11 s’ils avaient déjà une barre (11 n’a plus l’onglet Profil : le 5e picto est Message).

Écrans **sans** barre (PNG) : 02–08, 12–16, login, réglages. On n’en ajoute pas.

## Fichiers de ce dossier

| Fichier | Écran | Maquette | Statut |
|---|---|---|---|
| `03-avis-texte.md` | Avis texte | `03.png` | Recalé (écarts vs PNG) |
| `04-compte-rendu.md` | Compte rendu de test | `04.png` | À coder — trou principal + typo large |
| `05-verifier-compte-rendu.md` | Vérifier mon compte rendu | `05.png` | À coder + typo large |
| `07-detail-signalement.md` | Détail du signalement | `07.png` | À coder |
| `08-question-facultative.md` | Question facultative | `08.png` | Recalé (version courte incomplète) |
| `09-applis-testeurs.md` | Les applis des testeurs | `09.png` | À coder — onglet Communauté |
| `explorer.md` | Explorer | pas de 17.png | À coder — principe Instagram, tokens Gemelo |
| `messages.md` | Messages | pas de 17.png | À coder — visible, verrouillé sans campagne payée |
| `volet.md` | Volet latéral | pas de PNG | À coder — Profil + Réglages + session |
| `bloques.md` | Trous encore ouverts | — | À jour |

## Enchaînement retenu (sans inventer d’écran)

```
01 Accueil                          ← onglet Découvrir
 ├─ Tester cette appli → 02 Campagne
 │    └─ Donner mon avis → 03 Avis texte
 │         └─ Publier mon avis → 04 Compte rendu (étape 2/3)
 │              └─ Continuer → 05 Vérifier
 │                   ├─ Compléter et publier → 06 Avis publié
 │                   └─ Enregistrer le brouillon → 02 (brouillon conservé)
 ├─ Ouvrir en plein écran → 09
 │    └─ Découvrir → page dédiée projet testeur (déjà reconstruite)
 ├─ (entrepreneur) 16 Rapport → Voir détails et preuves → 07
 │    ├─ Envoyer la question → le testeur ouvre 08
 │    └─ Lancer un test ciblé → 12 Offre + jour (écran existant)
 ├─ Engrenage / hamburger → volet
 │    ├─ Profil → 11
 │    ├─ Réglages → réglages déjà spécifiés
 │    └─ Se connecter / Se déconnecter → Clerk déjà reconstruit
 onglet Communauté → 09
 onglet Explorer → mosaïque
    ├─ visuel Bed Hop → 02
    └─ visuel testeur → page dédiée (pas 03 / 04)
 onglet Classement → classement déjà reconstruit
 onglet Message → liste
    ├─ sans campagne payée → flou + CTA → 12
    └─ avec campagne payée → conversation démo
```

03 n’affiche pas le stepper (absent du PNG). 04 affiche « Étape 2 sur 3 » comme la maquette. 05 est l’étape 3 sans barre (absente du PNG).

## Superdesign

Le skill Superdesign n’est pas disponible (pas d’outil MCP, pas de `SKILL.md` utilisable). Mobbin n’a pas pu s’authentifier. **Pas de maquette 17.**

Le client a tranché à la place : Explorer = principe Instagram dans les tokens Gemelo ; Messages = liste type appli de rencontre, verrouillée sans campagne ; volet = Profil / Réglages / session. On ne crée pas de nouveau langage visuel. On n’utilise pas le générateur d’image natif de Cursor.

## Ordre de code recommandé (quand le code sera autorisé)

1. **Coquille** — barre à 5 pictos + volet (Profil hors barre). Tout le reste s’y branche.
2. **04 puis 05** — trou principal, typo et cibles tactiles larges, ordre des blocs 04.png.
3. **Explorer** — champ Chercher + mosaïque 3 visuels démo.
4. **Messages** — liste visible, flou + CTA 12 si pas de campagne payée.
5. **09** — aligner l’onglet Communauté (sans inventer de cartes).
6. **Recalages** 03, 08, puis 07.
