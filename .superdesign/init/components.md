# Shared UI primitives (V2)

Framework: React + Vite. Custom components in `app/src/v2/primitives.jsx`. No shadcn / Tailwind.

## PageShell
- Path: `app/src/v2/primitives.jsx`
- Props: `children`, `withNav` (boolean), `pageRef`
- Description: Phone column 440px, optional bottom-nav padding.

```jsx
export function PageShell({ children, withNav = false, pageRef }) {
  return <div ref={pageRef} className={`v2-page${withNav ? " v2-page--nav" : ""}`}>{children}</div>;
}
```

## Header
- Path: `app/src/v2/primitives.jsx`
- Description: Gemelo wordmark `/logo-gemelo.png`. No slogan.

```jsx
export function Header() {
  return (
    <header className="v2-header">
      <img src="/logo-gemelo.png" alt="Gemelo" />
    </header>
  );
}
```

## Card
- Path: `app/src/v2/primitives.jsx`
- Props: `children`, `className`, `as`

```jsx
export function Card({ children, className = "", as: Tag = "section", ...props }) {
  return <Tag className={`v2-card ${className}`.trim()} {...props}>{children}</Tag>;
}
```

## SectionTitle
- Path: `app/src/v2/primitives.jsx`
- Props: `icon`, `title`, `description`, `action`

```jsx
export function SectionTitle({ icon, title, description, action }) {
  return (
    <div className="v2-section-title">
      {icon ? <span className="v2-section-icon" aria-hidden="true">{icon}</span> : null}
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
```

## Button
- Path: `app/src/v2/primitives.jsx`
- Props: `variant` = `primary` | `outline`

```jsx
export function Button({ children, variant = "primary", className = "", ...props }) {
  return <button className={`v2-button v2-button--${variant} ${className}`.trim()} {...props}>{children}</button>;
}
```

## BackButton
- Path: `app/src/v2/primitives.jsx`

```jsx
export function BackButton({ onClick }) {
  return <button type="button" className="v2-back" onClick={onClick}><span aria-hidden="true">←</span> Retour</button>;
}
```

## Field
- Path: `app/src/v2/primitives.jsx`

```jsx
export function Field({ label, error, children }) {
  return (
    <label className="v2-field">
      <span>{label}</span>
      {children}
      {error ? <small role="alert">{error}</small> : null}
    </label>
  );
}
```

## BottomNav
- Path: `app/src/v2/primitives.jsx`
- Tester nav only: Découvrir, Communauté, Classement, Profil.
- Settings / legal / contact / login must NOT show this nav.
