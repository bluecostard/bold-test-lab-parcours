import { mapSocials } from "../../lib/campaignDraft.js";

/** Icônes de marque (formes / couleurs plateformes). */
function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" width="43" height="43" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="v2-ig-grad" cx="0.3" cy="1.07" r="1.2">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="url(#v2-ig-grad)" />
      <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16.4" cy="7.6" r="1.05" fill="#fff" />
    </svg>
  );
}

function TikTokMark() {
  return (
    <svg viewBox="0 0 24 24" width="43" height="43" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#010101" />
      <path
        fill="#25F4EE"
        transform="translate(-0.55,0.2)"
        d="M14.5 5.8c.5 1.35 1.7 2.3 3.15 2.45v1.95a5.1 5.1 0 0 1-3.15-1v4.4a4 4 0 1 1-4-4c.25 0 .5.03.75.08v2.05a2 2 0 1 0 1.25 1.87V5.8h2z"
      />
      <path
        fill="#FE2C55"
        transform="translate(0.55,-0.2)"
        d="M14.5 5.8c.5 1.35 1.7 2.3 3.15 2.45v1.95a5.1 5.1 0 0 1-3.15-1v4.4a4 4 0 1 1-4-4c.25 0 .5.03.75.08v2.05a2 2 0 1 0 1.25 1.87V5.8h2z"
      />
      <path
        fill="#fff"
        d="M14.5 5.8c.5 1.35 1.7 2.3 3.15 2.45v1.95a5.1 5.1 0 0 1-3.15-1v4.4a4 4 0 1 1-4-4c.25 0 .5.03.75.08v2.05a2 2 0 1 0 1.25 1.87V5.8h2z"
      />
    </svg>
  );
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" width="43" height="43" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#1877F2" />
      <path
        fill="#fff"
        d="M15.6 12.7h-2v6.9h-2.9v-6.9H8.9v-2.45h1.8V8.7c0-1.75 1-2.7 2.6-2.7.75 0 1.55.15 1.55.15v1.95h-.85c-.85 0-1.1.55-1.1 1.1v1.3h2.3l-.4 2.45z"
      />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" width="43" height="43" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#0A66C2" />
      <circle cx="7.15" cy="7.55" r="1.35" fill="#fff" />
      <rect x="6" y="9.5" width="2.3" height="8.1" fill="#fff" />
      <path
        fill="#fff"
        d="M11.15 9.5h2.2v1.15c.4-.7 1.1-1.35 2.35-1.35 1.75 0 3.1 1.15 3.1 3.55v4.75h-2.3v-4.2c0-1.05-.4-1.75-1.35-1.75-.85 0-1.35.6-1.55 1.15-.1.25-.1.55-.1.85v3.95h-2.35V9.5z"
      />
    </svg>
  );
}

function YouTubeMark() {
  return (
    <svg viewBox="0 0 24 24" width="43" height="43" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#FF0000" />
      <path
        fill="#fff"
        d="M18.85 8.55a1.7 1.7 0 0 0-1.2-1.2C16.4 7 12 7 12 7s-4.4 0-5.65.35a1.7 1.7 0 0 0-1.2 1.2C4.8 9.85 4.8 12 4.8 12s0 2.15.35 3.45a1.7 1.7 0 0 0 1.2 1.2c1.25.35 5.65.35 5.65.35s4.4 0 5.65-.35a1.7 1.7 0 0 0 1.2-1.2c.35-1.3.35-3.45.35-3.45s0-2.15-.35-3.45z"
      />
      <path fill="#FF0000" d="M10.7 14.4V9.6L14.85 12 10.7 14.4z" />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" width="43" height="43" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#000" />
      <path
        fill="#fff"
        d="M15.7 6.6h1.7l-3.7 4.25L18.5 17.4h-3.25l-2.55-3.35-2.9 3.35H7.05l3.95-4.55L6.7 6.6h3.35l2.3 3.05L15.7 6.6zm-.6 9.6h.95L9.85 7.55H8.85l6.25 8.65z"
      />
    </svg>
  );
}

const MARKS = {
  Instagram: InstagramMark,
  TikTok: TikTokMark,
  Facebook: FacebookMark,
  LinkedIn: LinkedInMark,
  YouTube: YouTubeMark,
  X: XMark,
};

export function SocialBrandIcon({ network }) {
  const Mark = MARKS[network];
  if (!Mark) return null;
  return (
    <span className={`v2-social-brand v2-social-brand--${network.toLowerCase()}`} aria-hidden="true">
      <Mark />
    </span>
  );
}

/** Liste campagne : 6 réseaux toujours visibles, inscrits cliquables, autres grisés. */
export function CampaignSocialList({ socials, name }) {
  const items = mapSocials(socials);
  return (
    <ul className="v2-socials">
      {items.map((social) => {
        const label = social.label;
        const content = (
          <>
            <SocialBrandIcon network={label} />
            <span className="v2-social-label">{label}</span>
          </>
        );
        return (
          <li key={label}>
            {social.href ? (
              <a href={social.href} target="_blank" rel="noreferrer" aria-label={`${label} de ${name}`}>
                {content}
              </a>
            ) : (
              <span className="is-disabled" aria-disabled="true">
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
