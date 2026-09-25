# 03 — Mon avis (recalage, déjà reconstruit)

**Maquette :** `app/public/ecrans/03.png`  
**Statut :** déjà reconstruit. Ne pas redessiner. Ci-dessous uniquement les **écarts bloquants ou manquants** vs le PNG, pour le prochain passage code.

## 1. Ce qui reste de la maquette (à conserver)

1. « ← Retour à la campagne » (libellé complet, pas seulement « Retour »).
2. Identité : logo campagne dans son cadre + titre « Mon avis sur **Bed Hop** » + « Décrivez ce que vous avez réellement essayé. » + tags.
3. Carte **Votre expérience** : grande zone, placeholder « Ce qui fonctionne, ce qui bloque, votre suggestion… », compteur en bas à droite.
4. Carte **Ajouter des preuves** : texte d’aide + **trois zones** sur une rangée :
   - aperçu capture déjà choisie (cadre, croix pour retirer) ;
   - tuile « Capture d’écran » (picto appareil, JPG/PNG jusqu’à 10 Mo) ;
   - tuile « Vidéo » (picto caméra, MP4/MOV jusqu’à 100 Mo).
5. Bandeau info : « Masquez vos informations personnelles avant de publier. » + « Ne partagez pas votre nom, e-mail, numéro de téléphone ou toute information sensible. »
6. Bouton lime « Publier mon avis → »
7. Fine print : « Votre avis sera visible par la communauté. »

## 2. Ce qui devient cliquable / saisissable

| Zone | Action |
|---|---|
| Retour à la campagne | 02 |
| Zone expérience | Saisie |
| Croix sur l’aperçu | Retire la capture |
| Tuile capture | Sélecteur image |
| Tuile vidéo | Sélecteur vidéo |
| Publier mon avis → | Enchaîne vers **04** (le PNG promet une publication ; la publication réelle est 05). Même bouton, même place, même libellé. |

## 3. Écarts vs l’existant / vs le PNG (sans recoder maintenant)

| Point | PNG 03 | État actuel (à noter) | Décision spec |
|---|---|---|---|
| Compteur | **0/10000** | 0/1000 | Recaler à **10000** |
| Preuves | 3 zones (aperçu + capture + vidéo) | 2 tuiles Photo / Vidéo, pas d’aperçu cadre | Remettre la rangée à 3 |
| Libellés preuves | « Capture d’écran » / « Vidéo » + poids | « Photo » / « Vidéo » | Reprendre les libellés PNG |
| CTA | « Publier mon avis → » | « Vérifier mon avis → » + bouton brouillon | CTA = libellé PNG ; **pas** de bouton brouillon sur 03 (il est sur 05) |
| Fine print communauté | Présente | Absente | Remettre |
| Destination CTA | Publication (PNG) | Un écran « Vérifier mon avis » qui n’est pas 05 | Destination **04**, publication sur 05 |
| Projet | Noma | Bed Hop déjà en données | Garder Bed Hop |

Écart assumé (à ne pas « corriger » en inventant un bouton) : le libellé « Publier » mène à 04, pas à 06. 05 porte « Compléter et publier ».

## 4. Ce qui manque

- Capture d’aperçu : fichier testeur, ou vide. Ne pas coller une capture Noma.
- Pas de lien réseau sur cet écran.

## 5. Enchaînement

- **Depuis :** 02 « Donner mon avis → » (connexion Clerk si besoin, écran login déjà reconstruit).
- **Vers :** 04.
- **Retour :** 02.
- Un avis se donne **uniquement** sur la campagne entrepreneur (Bed Hop). Jamais depuis 09.
