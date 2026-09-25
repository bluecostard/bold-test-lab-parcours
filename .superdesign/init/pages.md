# Page dependency trees (V2)

## discover
Entry: `app/src/v2/screens.jsx` DiscoverScreen
- `app/src/v2/primitives.jsx`
- `app/src/v2/data.js`
- `app/src/v2/v2.css`

## profile
Entry: `app/src/v2/screens.jsx` ProfileScreen
- `app/src/v2/primitives.jsx`
- `app/src/v2/state.js`
  - `app/src/screens/account.js`
- `@clerk/react` when `VITE_CLERK_PUBLISHABLE_KEY` is set
- Gear menu → settings + login/logout

## login (to refine, not invent)
Entry: `app/src/v2/screens.jsx` LoginScreen
Reference validated UI: `app/src/screens/Login.jsx`
- Logo `/logo-gemelo.png` 150px centered
- No title, no explanation, no bottom nav
- Clerk `SignIn` navy/lime appearance
- After sign-in → profile

## settings (NEW TARGET — no mockup 01–16)
Currently `PlaceholderScreen` in `app/src/v2/AppV2.jsx`.
Functional content to keep from `app/src/screens/Settings.jsx`:
- Menu: CGV, CGU, Traitement des données, Contact
- Legal texts already written
- Contact: name, email, message, localStorage via `writeAccount`
- No Clerk button here (gear on profile only)
- No bottom nav on legal/contact

## confirmation / results / report
Entry: `app/src/v2/entrepreneur.jsx`
Visual reference mockups: `app/public/ecrans/14.png`, `15.png`, `16.png`
Profile visual reference: `app/public/ecrans/11.png`
