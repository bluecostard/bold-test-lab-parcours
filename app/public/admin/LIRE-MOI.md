# Gemelo — back-office

Interface d’administration à `https://gemelo.online/admin/`.

## Accès

1. Ouvrir `/admin/`.
2. Saisir le jeton `GEMELO_ADMIN_TOKEN` (variable d’environnement Vercel, min. 16 caractères).
3. Le jeton reste dans `sessionStorage` de l’onglet.

Mode maquette hors ligne : `/admin/?demo=1` (données seed + localStorage uniquement).

## API

- `GET /api/admin` — snapshot live (campagnes, avis, paiements, classement).
- `POST /api/admin` — actions : `hide-review`, `pause-campaign`, `resume-campaign`, `reject-campaign`.

Auth : `Authorization: Bearer <GEMELO_ADMIN_TOKEN>`.

## Données

Les données live viennent de Vercel Blob (mêmes stores que l’app). Aucune seed de démo n’est écrite en production.
