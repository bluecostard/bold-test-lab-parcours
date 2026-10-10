import { bottomNavigation } from "./data.js";

export function PageShell({ children, withNav = false, pageRef }) {
  return (
    <div ref={pageRef} className={`v2-page${withNav ? " v2-page--nav" : ""}`}>
      <a className="v2-skip" href="#contenu">Aller au contenu</a>
      <div id="contenu">{children}</div>
    </div>
  );
}

export function Header({ action, onHome, mark = "wordmark" }) {
  const logo = (
    <img
      src={mark === "app" ? "/icon-app.png" : "/logo-gemelo.png"}
      alt="Gemelo"
      className={mark === "app" ? "v2-app-icon" : undefined}
    />
  );
  return (
    <header className={action ? "v2-header v2-header--actions" : "v2-header"}>
      {onHome ? (
        <button type="button" className="v2-header-home" aria-label="Retour à l’accueil" onClick={onHome}>
          {logo}
        </button>
      ) : logo}
      {action}
    </header>
  );
}

export function FlowHeader({ navigate, openDrawer }) {
  return (
    <Header
      onHome={() => navigate("discover")}
      action={openDrawer ? <GearButton onClick={openDrawer} /> : null}
    />
  );
}

export function Card({ children, className = "", as: Tag = "section", ...props }) {
  return <Tag className={`v2-card ${className}`.trim()} {...props}>{children}</Tag>;
}

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

export function Button({ children, variant = "primary", className = "", ...props }) {
  return <button className={`v2-button v2-button--${variant} ${className}`.trim()} {...props}>{children}</button>;
}

export function BottomNav({ active = "discover", onNavigate }) {
  return (
    <nav className="v2-bottom-nav" aria-label="Navigation principale">
      {bottomNavigation.map((item) => (
        <button
          key={item.id}
          type="button"
          className={active === item.id ? "is-active" : ""}
          aria-label={item.label}
          aria-current={active === item.id ? "page" : undefined}
          onClick={() => onNavigate(item.id)}
        >
          <NavIcon name={item.icon} />
        </button>
      ))}
    </nav>
  );
}

const entrepreneurNavigation = [
  { id: "discover", label: "Accueil", icon: "home" },
  { id: "entrepreneur", label: "Campagnes", icon: "campaigns" },
  { id: "results", label: "Résultats", icon: "results" },
  { id: "profile", label: "Profil", icon: "profile" },
];

export function EntrepreneurNav({ active = "results", onNavigate }) {
  return (
    <nav className="v2-bottom-nav" aria-label="Navigation entrepreneur">
      {entrepreneurNavigation.map((item) => (
        <button
          key={item.id}
          type="button"
          className={active === item.id ? "is-active" : ""}
          aria-label={item.label}
          aria-current={active === item.id ? "page" : undefined}
          onClick={() => onNavigate(item.id)}
        >
          <NavIcon name={item.icon} />
        </button>
      ))}
    </nav>
  );
}

export function NavIcon({ name }) {
  const paths = {
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    people: <><circle cx="9" cy="9" r="3" /><circle cx="16.5" cy="10" r="2.5" /><path d="M3.5 19c.7-3.2 2.5-4.8 5.5-4.8s4.8 1.6 5.5 4.8M14 15c2.9-.5 5 .8 6 4" /></>,
    ranking: <><path d="M5 20v-6M12 20V5M19 20v-10" /><path d="M3 20h18" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20c.8-4.2 3.3-6.3 7.5-6.3s6.7 2.1 7.5 6.3" /></>,
    explore: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
    message: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H12l-4 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5Z" /></>,
    home: <><path d="M4 11.2 12 4l8 7.2V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1Z" /></>,
    campaigns: <><path d="M5 9v6l12 4V5L5 9Z" /><path d="M5 12H3" /><path d="M8 15.2V20" /></>,
    results: <><path d="M4 19V10M12 19V5M20 19v-7" /><path d="M3 19h18" /></>,
  };
  return <svg className="v2-nav-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 4H5a1 1 0 0 0-1 1v4M15 4h4a1 1 0 0 1 1 1v4M9 20H5a1 1 0 0 1-1-1v-4M15 20h4a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}

export function BackButton({ onClick, children = "Retour" }) {
  return <button type="button" className="v2-back" onClick={onClick} aria-label={children ? undefined : "Retour"}><span aria-hidden="true">←</span>{children ? ` ${children}` : ""}</button>;
}

export function GearButton({ onClick, expanded = false }) {
  return (
    <button type="button" className="v2-gear" aria-label="Ouvrir le menu" aria-expanded={expanded} onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3h4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v4h-.2a1.7 1.7 0 0 0-1.5 1Z" /></svg>
    </button>
  );
}

export function ProjectIdentity({ campaign, size = "default", linked = false }) {
  const image = <img src={campaign.logo} alt={`Logo ${campaign.name}`} />;
  return (
    <div className={`v2-identity v2-identity--${size}`}>
      {linked ? (
        <a className="v2-project-logo" href={campaign.website} target="_blank" rel="noreferrer" aria-label={`Ouvrir le site de ${campaign.name}`}>
          {image}
        </a>
      ) : <span className="v2-project-logo">{image}</span>}
      <div>
        <h2>{campaign.name}</h2>
        <p>{campaign.pitch}</p>
      </div>
    </div>
  );
}

export function Tags({ items }) {
  return <ul className="v2-tags" aria-label="Catégories">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

export function CampaignInstructions({ campaign }) {
  if (!campaign.instructions?.length) return null;
  return (
    <Card>
      <SectionTitle icon="▤" title="Consignes de l’entrepreneur" description={`Suivez ces étapes pour tester ${campaign.name}.`} />
      <ol className="v2-instructions">{campaign.instructions.map((item) => <li key={item}>{item}</li>)}</ol>
    </Card>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="v2-field">
      <span>{label}</span>
      {hint ? <em className="v2-field-hint">{hint}</em> : null}
      {children}
      {error ? <small role="alert">{error}</small> : null}
    </label>
  );
}

export function ErrorMessage({ children }) {
  return children ? <p className="v2-error" role="alert">{children}</p> : null;
}
