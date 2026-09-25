# 08 — Une question sur votre avis (recalage)

**Maquette :** `app/public/ecrans/08.png`  
**Statut :** déjà reconstruit en **version courte**. Ne pas redessiner. Blocs PNG manquants à réintégrer au prochain passage code.

## 1. Ce qui reste de la maquette (blocs dans l’ordre)

1. « ← Retour »
2. Titre « Une question sur votre avis » (« question » en accent).
3. Sous-titre : « L’entrepreneur souhaite en savoir un peu plus sur votre expérience. »
4. **Carte expéditeur**
   - Logo Bed Hop dans son cadre.
   - Nom **Bed Hop**
   - Ligne « Entrepreneur »
   - Horodatage à droite (ex. « Aujourd’hui à 14:28 »)
5. **Rangée Votre signalement**
   - Libellé « Votre signalement : »
   - Titre du bug (celui de 04/07)
   - Chevron › à droite
6. **Question** en titre (texte envoyé depuis 07).
7. **Oui / Non** — Oui avec bord et fond accent comme le PNG.
8. **Votre précision (facultatif)** — zone `0/500`, placeholder du type « Vous pouvez ajouter un détail ici (message d’erreur, appareil utilisé, moment de la journée…). »
9. Bouton lime « Répondre à la question → »
10. Bouton contour « Passer pour le moment »
11. Bandeau i : « La réponse est facultative. Votre avis et vos points restent inchangés si vous ne répondez pas. »
12. **Rangée Relire mon avis** — picto œil + titre + « Vous pouvez consulter à tout moment l’avis que vous avez publié. » + chevron
13. **Rangée Si vous ne répondez pas** — picto bulle + « Si vous ne répondez pas, l’entrepreneur verra : “Précision non obtenue”. »

## 2. Ce qui devient cliquable / saisissable

| Zone | Action |
|---|---|
| ← Retour | 06 |
| Rangée signalement › | 06 (relire l’avis / le signalement publié). Pas de nouvel écran. |
| Oui / Non | Choix obligatoire seulement si on clique « Répondre ». |
| Précision | Facultatif, 500. |
| Répondre à la question → | Enregistre choix + précision, retour 06, statut « Réponse enregistrée ». |
| Passer pour le moment | 06, statut « Précision non obtenue ». Avis et points inchangés. |
| Relire mon avis › | 06 |

## 3. Blocs manquants dans la spec / version courte actuelle

À réintégrer, **aux mêmes places** que le PNG :

- Carte expéditeur avec rôle « Entrepreneur » + horodatage
- Rangée « Votre signalement » + chevron
- Placeholder de précision
- Rangée « Relire mon avis »
- Rangée « Précision non obtenue »
- Projet : Bed Hop, pas Noma

Déjà présent (à garder) : titre, Oui/Non, précision, deux boutons, bandeau facultatif.

## 4. Ce qui manque comme donnée

- Question réelle : celle saisie en 07. Démo si 07 n’a rien envoyé : une phrase liée à Bed Hop, pas au bouton Réserver Noma.
- Horodatage : heure locale de l’envoi.

## 5. Enchaînement

- **Depuis :** notification / carte sur 06 après qu’un entrepreneur a envoyé la question depuis 07.
- **Vers :** 06 après réponse ou passage.
- **Relire :** 06.
- Répondre ne change ni l’avis ni les points.
