# Gemelo — back-office

Interface d’administration à `https://gemelo.online/admin/`.

## Accès

1. Ouvrir `/admin/`.
2. Se connecter avec le **même compte Clerk** que l’app Gemelo.
3. Seuls les e-mails autorisés (ou un rôle admin Clerk) accèdent aux données live.

Mode maquette hors ligne : `/admin/?demo=1`.

## Autorisations serveur

- E-mails admin : `GEMELO_ADMIN_EMAILS` (sinon défauts produit) + `ADMIN_NOTIFY_EMAIL`
- IDs Clerk : `GEMELO_ADMIN_USER_IDS`
- Metadata Clerk : `public_metadata.role = "admin"` ou `admin: true`
- Secours scripts : `GEMELO_ADMIN_TOKEN` (Bearer)
- Lookup e-mail : `CLERK_SECRET_KEY` (Backend API)

## API

- `GET /api/public-config` — clé publishable Clerk
- `GET /api/admin` — snapshot live
- `POST /api/admin` — `hide-review`, `pause-campaign`, `resume-campaign`, `reject-campaign`
