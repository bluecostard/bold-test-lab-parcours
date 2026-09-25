# Theme tokens (V2)

## Compact token summary

- Background: `#071426`
- Card: `#10243a`
- Card deep: `#0a1d31`
- Text: `#f4f7fb`
- Muted: `#aebed1`
- Accent lime: `#d6ff4a`
- Accent text on lime: `#101d0a` / `#142000`
- Line: `rgba(151, 185, 218, 0.18)`
- Radius: `18px`
- Font: `"Plus Jakarta Sans", "Segoe UI", sans-serif`
- Readable text: ≥ 16px
- Page width: `min(440px, 100%)`
- Primary button: lime pill, min-height 52px, font-weight 900
- Outline button: transparent, `#9fb7d4` border
- No slogan under the logo
- No grey squares on icons
- Stripe payment is simulated and labeled

## Raw source (`app/src/v2/v2.css` tokens)

```css
:root {
  --v2-bg: #071426;
  --v2-card: #10243a;
  --v2-card-deep: #0a1d31;
  --v2-text: #f4f7fb;
  --v2-muted: #aebed1;
  --v2-accent: #d6ff4a;
  --v2-line: rgba(151, 185, 218, 0.18);
  --v2-radius: 18px;
  --v2-space: 14px;
}
.v2-page {
  width: min(440px, 100%);
  min-height: 100dvh;
  margin: 0 auto;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 70% 0, rgba(9, 53, 79, .42), transparent 27rem),
    var(--v2-bg);
  color: var(--v2-text);
  font-family: "Plus Jakarta Sans", "Segoe UI", sans-serif;
}
.v2-card {
  min-width: 0; padding: 14px; border: 1px solid var(--v2-line);
  border-radius: var(--v2-radius);
  background: linear-gradient(145deg, rgba(16, 36, 58, .98), rgba(7, 30, 49, .98));
}
.v2-button {
  width: 100%; min-height: 52px; border: 0; border-radius: 999px; padding: 12px 18px;
  cursor: pointer; font-size: 17px; font-weight: 900;
}
.v2-button--primary { background: var(--v2-accent); color: #101d0a; }
.v2-button--outline { border: 1px solid #9fb7d4; background: transparent; color: var(--v2-text); }
.v2-field input, .v2-field textarea {
  min-height: 48px; border: 1px solid var(--v2-line); border-radius: 12px;
  background: var(--v2-bg); color: inherit; padding: 12px; font: inherit;
}
```
