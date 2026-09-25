# Shared layouts (V2)

## App shell
- Path: `app/src/v2/primitives.jsx` (`PageShell`)
- Phone column `min(440px, 100%)`, background `#071426`, text `#f4f7fb`.
- Optional fixed bottom nav when `withNav`.

```jsx
export function PageShell({ children, withNav = false, pageRef }) {
  return <div ref={pageRef} className={`v2-page${withNav ? " v2-page--nav" : ""}`}>{children}</div>;
}

export function Header() {
  return (
    <header className="v2-header">
      <img src="/logo-gemelo.png" alt="Gemelo" />
    </header>
  );
}

export function BottomNav({ active = "discover", onNavigate }) {
  return (
    <nav className="v2-bottom-nav" aria-label="Navigation principale">
      {bottomNavigation.map((item) => (
        <button
          key={item.id}
          type="button"
          className={active === item.id ? "is-active" : ""}
          aria-current={active === item.id ? "page" : undefined}
          onClick={() => onNavigate(item.id)}
        >
          <NavIcon name={item.icon} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}
```

## Routing shell
- Path: `app/src/v2/AppV2.jsx`
- State machine (`place.screen`), not React Router.
- Settings is currently a placeholder; login exists but is too raw.

Do not invent Chercher / Explorer / Message. No slogan under the logo.
