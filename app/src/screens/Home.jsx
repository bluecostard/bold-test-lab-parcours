import { useEffect, useState } from "react";
import { Menu } from "./Menu.jsx";

const COMMENT_KEY = "gemelo-comments-v1";

const seeded = {
  "Bed Hop": [
    { id: "seed-bed-1", author: "Léa", text: "La recherche entre 11 h et 17 h est claire. On comprend que l’entreprise paie.", likes: 12, liked: false },
    { id: "seed-bed-2", author: "Thomas", text: "L’invitation sans compte est simple. Le bouton de réservation pourrait être plus visible.", likes: 7, liked: false },
    { id: "seed-bed-3", author: "Camille", text: "Le principe du lit d’une heure se comprend dès le premier écran.", likes: 4, liked: false },
  ],
  "Du rose au noir": [
    { id: "seed-rose-1", author: "Alex", text: "Le reste à vivre se calcule vite. Les deux formules sont bien distinctes.", likes: 9, liked: false },
    { id: "seed-rose-2", author: "Sophie", text: "J’ai suivi le parcours sans blocage. Le vocabulaire est clair.", likes: 6, liked: false },
    { id: "seed-rose-3", author: "Julien", text: "Utile pour voir une situation avant de choisir une formule.", likes: 3, liked: false },
  ],
  "Comptoir du Oui": [
    { id: "seed-oui-1", author: "Manon", text: "Le livret et la cagnotte se comprennent. Ce n’est pas présenté comme un prêt.", likes: 11, liked: false },
    { id: "seed-oui-2", author: "Nicolas", text: "L’idée de financer le mariage des autres est claire dès l’accueil.", likes: 5, liked: false },
    { id: "seed-oui-3", author: "Élise", text: "J’aimerais voir plus tôt comment on cotise.", likes: 2, liked: false },
  ],
};

function readComments() {
  let saved = {};
  try {
    const parsed = JSON.parse(localStorage.getItem(COMMENT_KEY) || "{}");
    if (parsed && typeof parsed === "object") saved = parsed;
  } catch {
    saved = {};
  }
  const merged = {};
  for (const [name, seeds] of Object.entries(seeded)) {
    const extra = Array.isArray(saved[name]) ? saved[name].filter((item) => item && !String(item.id).startsWith("seed-")) : [];
    merged[name] = [...seeds, ...extra];
  }
  return merged;
}

export const products = [
  {
    name: "Bed Hop",
    pitch: "Une heure de lit autour de toi",
    lead: "L’hôte est là. L’entreprise paie. Repos de 11 h à 17 h, facturé à la boîte avant d’entrer.",
    tags: ["Application", "Repos", "Entreprise"],
    logo: "/visuels/logo-bedhop-tight.png",
    screen: "/visuels/ecran-bedhop.jpg",
    screens: ["/visuels/ecran-bedhop.jpg"],
    photo: "/visuels/visuel-bedhop.jpg",
    url: "https://bedhop.online",
    kind: "cette appli",
    links: [
      { label: "App Store", detail: "Ouvrir sur l’App Store", href: "https://apps.apple.com/fr/app/bed-hop/id6807971956" },
      { label: "Google Play", detail: "Ouvrir sur Google Play", href: "https://play.google.com/store/apps/details?id=online.bedhop.app" },
      { label: "Visiter le site", detail: "Découvrir Bed Hop sur le web", href: "https://bedhop.online" },
    ],
    socials: [{ label: "Instagram", href: "https://www.instagram.com/bedhop26" }],
    steps: [
      "Ouvrez Bed Hop.",
      "Cherchez une chambre entre 11 h et 17 h.",
      "Dites si la réservation est claire.",
    ],
    facts: [
      "Une heure de lit chez l’habitant, 11 h–17 h.",
      "Le salarié n’a pas de compte : il arrive avec une invitation.",
      "À ouvrir : bedhop.online",
    ],
  },
  {
    name: "Du rose au noir",
    pitch: "Une idée sur ton argent, ta situation",
    lead: "Simulateur de vérité financière pour une séparation : mariage, PACS ou concubinage.",
    tags: ["Site", "Séparation", "Argent"],
    logo: "/visuels/logo-rose.png",
    screen: "/visuels/ecran-rose.jpg",
    screens: ["/visuels/ecran-rose.jpg"],
    photo: "/visuels/visuel-rose.jpg",
    url: "https://duroseaunoir.online",
    kind: "ce site",
    links: [
      { label: "Visiter le site", detail: "Ouvrir Du rose au noir", href: "https://duroseaunoir.online" },
    ],
    socials: [],
    steps: [
      "Ouvrez le site.",
      "Estimez le reste à vivre.",
      "Dites si le parcours est clair.",
    ],
    facts: [
      "Le calcul se fait sur le site, avant toute formule.",
      "Deux formules : Mon argent, et Cap.",
      "À ouvrir : duroseanoir.online",
    ],
  },
  {
    name: "Comptoir du Oui",
    pitch: "La mutuelle du jour J",
    lead: "Finance le mariage des autres, les autres financent le tien. Pas une banque, pas un prêt.",
    tags: ["Application", "Mariage", "Cagnotte"],
    logo: "/visuels/logo-comptoir-tight.png",
    screen: "/visuels/ecran-comptoir.jpg",
    screens: ["/visuels/ecran-comptoir.jpg"],
    photo: "/visuels/visuel-comptoir-tight.png",
    url: "https://comptoir-du-oui.vercel.app",
    kind: "cette appli",
    links: [
      { label: "Visiter le site", detail: "Ouvrir Comptoir du Oui", href: "https://comptoir-du-oui.vercel.app" },
    ],
    socials: [],
    steps: [
      "Ouvrez l’application.",
      "Regardez le livret et la cagnotte.",
      "Dites si le principe est clair.",
    ],
    facts: [
      "Chacun a un livret. Le couple ouvre la cagnotte.",
      "Les cotisations sont libres. Ce n’est pas un placement.",
      "À ouvrir : comptoir-du-oui.vercel.app",
    ],
  },
];

export function Home({ onOpen }) {
  const [openName, setOpenName] = useState(null);
  const [activeName, setActiveName] = useState(products[0].name);
  const [comments, setComments] = useState(readComments);
  const [drafts, setDrafts] = useState({});
  const active = products.find((item) => item.name === activeName) ?? products[0];

  useEffect(() => {
    localStorage.setItem(COMMENT_KEY, JSON.stringify(comments));
  }, [comments]);

  function publish(name) {
    const text = (drafts[name] || "").trim();
    if (!text) return;
    const entry = { id: crypto.randomUUID(), author: "Vous", text, likes: 0, liked: false };
    setComments((current) => ({ ...current, [name]: [...(current[name] || []), entry] }));
    setDrafts((current) => ({ ...current, [name]: "" }));
    setOpenName(name);
  }

  function like(name, id) {
    setComments((current) => ({
      ...current,
      [name]: (current[name] || []).map((comment) => (
        comment.id === id && !comment.liked ? { ...comment, likes: comment.likes + 1, liked: true } : comment
      )),
    }));
  }

  function toggle(name) {
    const top = window.scrollY;
    setOpenName((current) => (current === name ? null : name));
    requestAnimationFrame(() => window.scrollTo(0, top));
  }

  return (
    <div className="home">
      <header className="home-brand">
        <img src="/logo-gemelo.png" alt="Gemelo" />
        <p>Des meilleurs applis grâce à vos avis</p>
      </header>

      <section className="home-hero">
        <p className="home-banner">
          <span>📣 À tester pendant 24 h · Campagne entrepreneur</span>
          <span aria-hidden="true">🕒</span>
        </p>
        <div className="home-stage">
          <div className="home-copy">
            <div className="home-product">
              <img className="home-mark" src={active.logo} alt="" />
              <div>
                <h1>{active.name}</h1>
                <p>{active.pitch}</p>
              </div>
            </div>
            <ul className="home-tags">
              {active.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
            <p className="home-lead">{active.lead}</p>
          </div>
          <img className="home-phone" src={`${active.screen}?v=7`} alt={`Écran de ${active.name}`} />
        </div>
        <button type="button" className="home-cta" onClick={() => onOpen(2, active.name)}>Tester cette appli →</button>
      </section>

      <section className="home-card">
        <div className="home-card-head">
          <h2>✳️ Les applis des testeurs</h2>
          <button type="button" className="home-square" aria-label="Ouvrir les applis des testeurs" onClick={() => onOpen(9)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 4H5a1 1 0 0 0-1 1v4M15 4h4a1 1 0 0 1 1 1v4M9 20H5a1 1 0 0 1-1-1v-4M15 20h4a1 1 0 0 0 1-1v-4" />
            </svg>
          </button>
        </div>
        <p className="home-fine">Découvrez librement les projets des 10 meilleurs testeurs.</p>
        <ul className="home-rail">
          {products.map((app) => (
            <li key={app.name}>
              <button type="button" className={app.name === active.name ? "is-on" : ""} onClick={() => setActiveName(app.name)}>
                <img src={`${app.photo}?v=6`} alt={`${app.name}, ${app.pitch}`} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="home-card">
        <h2>Commentaires des testeurs</h2>
        <p className="home-fine">Bed Hop, Du rose au noir, Comptoir du Oui</p>
        <ol className="home-comments">
          {products.map((item) => {
            const open = openName === item.name;
            const thread = comments[item.name] || [];
            return (
              <li key={item.name} className="home-comment-row">
                <img className="home-app-shot" src={`${item.logo}?v=6`} alt={`Logo ${item.name}`} />
                <div className="home-comment-copy">
                  <strong>{item.name}</strong>
                  <ul className="home-thread">
                    {thread.map((comment) => (
                      <li key={comment.id}>
                        <p>
                          <b>{comment.author || "Vous"}</b>
                          <q>{comment.text}</q>
                        </p>
                        <button type="button" className="home-like" aria-pressed={comment.liked} onClick={() => like(item.name, comment.id)}>
                          ♥ {comment.likes}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="home-comment-btn" aria-expanded={open} onClick={() => toggle(item.name)}>
                    {open ? "Fermer" : "Commenter"}
                  </button>
                  {open ? (
                    <form className="home-composer" onSubmit={(event) => { event.preventDefault(); publish(item.name); }}>
                      <textarea
                        rows={3}
                        value={drafts[item.name] || ""}
                        placeholder="Écrire un commentaire"
                        aria-label={`Commentaire sur ${item.name}`}
                        onChange={(event) => setDrafts((current) => ({ ...current, [item.name]: event.target.value }))}
                      />
                      <button type="submit" className="home-cta">Publier</button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <Menu screen={1} onOpen={onOpen} />
    </div>
  );
}
