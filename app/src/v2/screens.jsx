import { useEffect, useRef, useState } from "react";
import { SignIn, useClerk, useUser } from "@clerk/react";
import { campaigns, demoReports, ranking, testerComments, testerProjects } from "./data.js";
import { readProfile, readV2State, setLocalUser, updateLocalProfile, updateV2State } from "./state.js";
import { ShellWithNav } from "./chrome.jsx";
import {
  BackButton,
  Button,
  Card,
  ExpandIcon,
  Field,
  Header,
  PageShell,
  ProjectIdentity,
  SectionTitle,
  Tags,
} from "./primitives.jsx";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const clerkAppearance = {
  variables: {
    colorPrimary: "#d6ff4a",
    colorBackground: "#10243a",
    colorText: "#f4f7fb",
    colorInputBackground: "#07111c",
    colorInputText: "#f4f7fb",
    colorNeutral: "#d5e2ef",
    borderRadius: "16px",
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif",
  },
  elements: {
    card: { background: "#10243a", boxShadow: "none", width: "100%" },
    formButtonPrimary: { background: "#d6ff4a", color: "#142000", fontWeight: 800 },
    footerActionLink: { color: "#d6ff4a" },
    socialButtonsBlockButton: { background: "#07111c", color: "#f4f7fb", border: "0" },
    formFieldInput: { background: "#07111c", color: "#f4f7fb" },
    headerTitle: { color: "#ffffff" },
    headerSubtitle: { color: "#9aafc4" },
  },
};

export function DiscoverScreen({ navigate, pageRef, openDrawer }) {
  const featured = campaigns[0];
  return (
    <ShellWithNav active="discover" navigate={navigate} pageRef={pageRef} openDrawer={openDrawer}>
      <main className="v2-stack">
        <Card className="v2-feature">
          <div className="v2-campaign-strip"><span aria-hidden="true">📣</span><strong>À tester pendant 24 h · Campagne entrepreneur</strong><span aria-label="Durée limitée">◷</span></div>
          <div className="v2-feature-body">
            <div><ProjectIdentity campaign={featured} /><Tags items={featured.tags} /><p className="v2-description">{featured.description}</p></div>
            <div className="v2-phone-frame"><img src={featured.screenshots[0]} alt={`Aperçu de ${featured.name}`} /></div>
          </div>
          <Button type="button" onClick={() => navigate("campaign", { campaignId: featured.id })}>Tester cette appli <span aria-hidden="true">→</span></Button>
          <p className="v2-helper">Créez un compte pour tester et donner votre avis.</p>
        </Card>
        <Card>
          <SectionTitle
            icon="✳"
            title="Les applis des testeurs"
            description="Consultez les projets des meilleurs testeurs. Les tests et avis portent uniquement sur les campagnes entrepreneur."
            action={<button type="button" className="v2-icon-button" aria-label="Ouvrir tous les projets" onClick={() => navigate("community")}><ExpandIcon /></button>}
          />
          <div className="v2-project-rail" role="list" aria-label="Projets des testeurs">
            {testerProjects.map((project) => (
              <button key={project.id} type="button" onClick={() => navigate("browse", { campaignId: project.id })} aria-label={`Découvrir ${project.name}`}>
                <img src={project.cover} alt="" /><strong>{project.name}</strong><span>{project.pitch}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle icon="●" title="Commentaires existants" description="Les derniers retours de la communauté." />
          <ul className="v2-comments">
            {testerComments.map((comment) => (
              <li key={comment.id}><span className="v2-avatar" aria-hidden="true">{comment.author.charAt(0)}</span><p><strong>{comment.author} · {comment.project}</strong><q>{comment.text}</q></p><span aria-label={`${comment.likes} mentions J’aime`}>♥ {comment.likes}</span></li>
            ))}
          </ul>
        </Card>
      </main>
    </ShellWithNav>
  );
}

export function CampaignScreen({ campaign, navigate, back, pageRef }) {
  const [slide, setSlide] = useState(0);
  const railRef = useRef(null);
  function updateSlide() {
    const rail = railRef.current;
    if (rail) setSlide(Math.round(rail.scrollLeft / Math.max(1, rail.clientWidth)));
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack v2-detail">
        <BackButton onClick={back} />
        <div><h1>Tester <span>{campaign.name}</span></h1><p className="v2-status">📣 Campagne de 24 h</p><p className="v2-deadline">◷ Campagne en cours</p></div>
        <section className="v2-detail-intro">
          <div><ProjectIdentity campaign={campaign} linked /><Tags items={campaign.tags} /><p className="v2-description">{campaign.description}</p></div>
          <div>
            <div ref={railRef} className="v2-screenshot-rail" aria-label={`Captures de ${campaign.name}`} onScroll={updateSlide}>
              {campaign.screenshots.map((src, index) => <figure key={src}><div className="v2-phone-frame"><img src={src} alt={`Capture ${index + 1} de ${campaign.name}`} /></div></figure>)}
            </div>
            <p className="v2-slide-counter" aria-live="polite">{slide + 1} / {campaign.screenshots.length}</p>
          </div>
        </section>
        {campaign.productLinks ? <Card><SectionTitle icon="↗" title="Accéder au produit" description={`Ouvrez ${campaign.name} sur la plateforme de votre choix.`} /><ul className="v2-link-list">{campaign.productLinks.map((link) => <li key={link.label}><a href={link.href} target="_blank" rel="noreferrer"><span className="v2-link-icon" aria-hidden="true">{link.icon}</span><span><strong>{link.label}</strong><small>{link.detail}</small></span><span aria-hidden="true">↗</span></a></li>)}</ul></Card> : null}
        {campaign.socials ? <Card><SectionTitle icon="⌘" title="Réseaux de l’entrepreneur" description={`Suivez ${campaign.name} sur ses réseaux pour rester informé.`} /><ul className="v2-socials">{campaign.socials.map((social) => <li key={social.label}>{social.href ? <a href={social.href} target="_blank" rel="noreferrer" aria-label={`${social.label} de ${campaign.name}`}><span aria-hidden="true">{social.icon}</span>{social.label}</a> : <span className="is-disabled" aria-disabled="true"><span aria-hidden="true">{social.icon}</span>{social.label}</span>}</li>)}</ul></Card> : null}
        {campaign.instructions ? <Card><SectionTitle icon="▤" title="Consignes de l’entrepreneur" description={`Suivez ces étapes pour tester ${campaign.name}.`} /><ol className="v2-instructions">{campaign.instructions.map((item) => <li key={item}>{item}</li>)}</ol></Card> : null}
        <Card><SectionTitle icon="●" title="Votre retour" description="Une fois votre test réalisé, partagez votre avis." /><Button type="button" onClick={() => navigate("review", { campaignId: campaign.id })}>Donner mon avis <span aria-hidden="true">→</span></Button><p className="v2-helper">Votre brouillon reste sur cet appareil.</p></Card>
      </main>
    </PageShell>
  );
}

export function TesterProjectScreen({ project, back, pageRef }) {
  const [slide, setSlide] = useState(0);
  const [state, setState] = useState(readV2State);
  const railRef = useRef(null);
  const liked = Boolean(state.projectLikes[project.id]);
  function updateSlide() {
    const rail = railRef.current;
    if (rail) setSlide(Math.round(rail.scrollLeft / Math.max(1, rail.clientWidth)));
  }
  function like() {
    if (liked) return;
    setState(updateV2State((current) => ({ ...current, projectLikes: { ...current.projectLikes, [project.id]: true } })));
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack v2-detail">
        <BackButton onClick={back} />
        <div><h1>Découvrir <span>{project.name}</span></h1></div>
        <section className="v2-detail-intro">
          <div><ProjectIdentity campaign={project} /><Tags items={project.tags} /><p className="v2-description">{project.description}</p></div>
          <div>
            <div ref={railRef} className="v2-screenshot-rail" aria-label={`Captures de ${project.name}`} onScroll={updateSlide}>
              {project.screenshots.map((src, index) => <figure key={src}><div className="v2-phone-frame"><img src={src} alt={`Capture ${index + 1} de ${project.name}`} /></div></figure>)}
            </div>
            <p className="v2-slide-counter" aria-live="polite">{slide + 1} / {project.screenshots.length}</p>
          </div>
        </section>
        <Card>
          <ul className="v2-link-list">
            <li>
              <a href={project.website} target="_blank" rel="noreferrer">
                <span className="v2-link-icon" aria-hidden="true">◎</span>
                <span><strong>Site internet</strong><small>{project.website.replace(/^https?:\/\//, "")}</small></span>
                <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              {project.social?.href ? (
                <a href={project.social.href} target="_blank" rel="noreferrer" aria-label={`${project.social.label} de ${project.name}`}>
                  <span className="v2-link-icon" aria-hidden="true">◎</span>
                  <span><strong>{project.social.label}</strong><small>Réseau social</small></span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <span className="is-disabled" aria-disabled="true">
                  <span className="v2-link-icon" aria-hidden="true">◎</span>
                  <span><strong>{project.social?.label || "Réseau social"}</strong><small>Lien non fourni</small></span>
                </span>
              )}
            </li>
          </ul>
        </Card>
        <button type="button" className="v2-like" aria-pressed={liked} disabled={liked} onClick={like}>
          {liked ? "♥" : "♡"} {project.likes + (liked ? 1 : 0)}
        </button>
      </main>
    </PageShell>
  );
}

export function ReviewFormScreen({ campaign, navigate, back, pageRef }) {
  const saved = readV2State().reviewDrafts[campaign.id] || {};
  const [text, setText] = useState(saved.text || "");
  const [photoName, setPhotoName] = useState(saved.photoName || "");
  const [photoUrl, setPhotoUrl] = useState(saved.photoUrl || "");
  const [videoName, setVideoName] = useState(saved.videoName || "");
  const [error, setError] = useState("");
  useEffect(() => {
    updateV2State((state) => ({ ...state, reviewDrafts: { ...state.reviewDrafts, [campaign.id]: { text, photoName, photoUrl, videoName } } }));
  }, [campaign.id, photoName, photoUrl, text, videoName]);
  function continueReview(event) {
    event.preventDefault();
    if (text.trim().length < 20) return setError("Décrivez votre expérience en au moins 20 caractères.");
    setError("");
    navigate("report-form", { campaignId: campaign.id });
  }
  return (
    <PageShell pageRef={pageRef}>
      <form className="v2-stack v2-review-form" onSubmit={continueReview} noValidate>
        <BackButton onClick={() => navigate("campaign", { campaignId: campaign.id })}>Retour à la campagne</BackButton>
        <div className="v2-identity">
          <span className="v2-project-logo"><img src={campaign.logo} alt={`Logo ${campaign.name}`} /></span>
          <div>
            <h1>Mon avis sur <span className="v2-accent">{campaign.name}</span></h1>
            <p>Décrivez ce que vous avez réellement essayé.</p>
          </div>
        </div>
        <Tags items={campaign.tags} />
        <Card><Field label="Votre expérience" error={error}><textarea rows={7} maxLength={10000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Ce qui fonctionne, ce qui bloque, votre suggestion…" aria-describedby="review-count" /></Field><p id="review-count" className="v2-count">{text.length} / 10000</p></Card>
        <Card>
          <SectionTitle title="Ajouter des preuves" description="Ajoutez des captures d’écran et/ou une vidéo pour rendre votre avis plus utile et crédible." />
          <div className="v2-upload-grid v2-upload-grid--3">
            <div className="v2-upload v2-upload--preview">
              {photoUrl ? <img src={photoUrl} alt="" /> : null}
              {photoUrl ? <button type="button" className="v2-upload-remove" aria-label="Retirer la capture" onClick={() => { setPhotoName(""); setPhotoUrl(""); }}>×</button> : null}
            </div>
            <label className="v2-upload"><span aria-hidden="true">▣</span><strong>Capture d’écran</strong><small>JPG, PNG jusqu’à 10 Mo</small><input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return setPhotoName(""); setPhotoName(file.name); const reader = new FileReader(); reader.onload = () => setPhotoUrl(String(reader.result)); reader.readAsDataURL(file); }} /></label>
            <label className="v2-upload"><span aria-hidden="true">▶</span><strong>Vidéo</strong><small>{videoName || "MP4, MOV jusqu’à 100 Mo"}</small><input type="file" accept="video/*" onChange={(event) => setVideoName(event.target.files?.[0]?.name || "")} /></label>
          </div>
          <p className="v2-info">Masquez vos informations personnelles avant de publier. Ne partagez pas votre nom, e-mail, numéro de téléphone ou toute information sensible.</p>
        </Card>
        <Button type="submit">Publier mon avis <span aria-hidden="true">→</span></Button>
        <p className="v2-helper">Votre avis sera visible par la communauté.</p>
      </form>
    </PageShell>
  );
}

export function ReviewSummaryScreen({ campaign, navigate, back, pageRef }) {
  const draft = readV2State().reviewDrafts[campaign.id] || {};
  function publish() {
    updateV2State((state) => ({ ...state, publishedReviews: { ...state.publishedReviews, [campaign.id]: { ...draft, author: "Vous", publishedAt: new Date().toISOString(), likes: 0 } } }));
    navigate("review-published", { campaignId: campaign.id }, true);
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack">
        <BackButton onClick={back} />
        <div><h1>Vérifier <span className="v2-accent">mon avis</span></h1><p className="v2-muted">Avant publication</p></div>
        <Card><ProjectIdentity campaign={campaign} /><Tags items={campaign.tags} /></Card>
        <Card><SectionTitle icon="✓" title="Votre expérience" /><p className="v2-review-copy">{draft.text}</p></Card>
        <Card><SectionTitle icon="▣" title="Preuves jointes" /><ul className="v2-proof-list"><li>Photo : {draft.photoName || "Aucune"}</li><li>Vidéo : {draft.videoName || "Aucune"}</li></ul></Card>
        <p className="v2-info">Votre avis aide l’entrepreneur même si vous ne revenez pas répondre plus tard.</p>
        <Button type="button" onClick={publish}>Publier mon avis <span aria-hidden="true">→</span></Button>
        <Button type="button" variant="outline" onClick={back}>Modifier</Button>
      </main>
    </PageShell>
  );
}

export function PublishedReviewScreen({ campaign, navigate, back, pageRef }) {
  const savedState = readV2State();
  const review = savedState.publishedReviews[campaign.id] || savedState.reviewDrafts[campaign.id] || {};
  const optionalAnswer = savedState.optionalAnswers[campaign.id];
  const [shared, setShared] = useState(false);
  async function share() {
    const message = `Mon avis sur ${campaign.name}`;
    if (navigator.share) await navigator.share({ title: message, text: review.text });
    else if (navigator.clipboard) await navigator.clipboard.writeText(`${message}\n${review.text}`);
    setShared(true);
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack">
        <BackButton onClick={back} />
        <h1>Avis sur <span className="v2-accent">{campaign.name}</span></h1>
        <Card className="v2-published"><div className="v2-review-author"><span className="v2-avatar">V</span><div><strong>Vous</strong><span>Avis publié sur cet appareil</span></div></div><h2>Mon retour d’expérience</h2><p>{review.text}</p>{review.photoName ? <p className="v2-proof-chip">▣ {review.photoName}</p> : null}<div className="v2-review-actions"><Button type="button" variant="outline" disabled title="Vous ne pouvez pas aimer votre propre avis">♡ Votre avis</Button><Button type="button" variant="outline" onClick={share}>↗ Partager</Button></div>{shared ? <p role="status" className="v2-helper">Avis partagé ou copié.</p> : null}</Card>
        <Card>
          <SectionTitle icon="●" title="Question facultative" description="Répondre ne modifie ni votre avis ni vos points." />
          <p>{savedState.sentQuestions[campaign.id]?.text || demoReports[0].defaultQuestion}</p>
          {optionalAnswer ? <p className="v2-info">{optionalAnswer.status === "skipped" ? "Précision non obtenue" : `Réponse enregistrée : ${optionalAnswer.choice}`}</p> : null}
          <Button type="button" onClick={() => navigate("optional-question", { campaignId: campaign.id })}>Voir la question <span aria-hidden="true">→</span></Button>
        </Card>
      </main>
    </PageShell>
  );
}

function formatQuestionTime(iso) {
  const date = iso ? new Date(iso) : new Date();
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `Aujourd’hui à ${time}`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function OptionalQuestionScreen({ campaign, navigate, pageRef }) {
  const saved = readV2State();
  const sent = saved.sentQuestions[campaign.id] || {};
  const report = demoReports.find((item) => item.id === sent.reportId) || demoReports[0];
  const [choice, setChoice] = useState("Oui");
  const [detail, setDetail] = useState("");
  function goPublished() {
    navigate("review-published", { campaignId: campaign.id }, true);
  }
  function finish(status) {
    updateV2State((state) => ({
      ...state,
      optionalAnswers: {
        ...state.optionalAnswers,
        [campaign.id]: status === "skipped" ? { status, label: "Précision non obtenue" } : { status, choice, detail },
      },
    }));
    goPublished();
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack">
        <BackButton onClick={goPublished} />
        <div>
          <h1>Une <span className="v2-accent">question</span> sur votre avis</h1>
          <p className="v2-muted">L’entrepreneur souhaite en savoir un peu plus sur votre expérience.</p>
        </div>
        <Card className="v2-sender">
          <div className="v2-sender-head">
            <a className="v2-project-logo" href={campaign.website} target="_blank" rel="noreferrer" aria-label={`Ouvrir le site de ${campaign.name}`}>
              <img src={campaign.logo} alt={`Logo ${campaign.name}`} />
            </a>
            <div>
              <h2>{campaign.name}</h2>
              <p>Entrepreneur</p>
            </div>
            <time dateTime={sent.sentAt || undefined}>{formatQuestionTime(sent.sentAt)}</time>
          </div>
          <button type="button" className="v2-link-row" onClick={goPublished}>
            <span>
              <small>Votre signalement :</small>
              <strong>{sent.bugTitle || report.title}</strong>
            </span>
            <b aria-hidden="true">›</b>
          </button>
        </Card>
        <h2 className="v2-question-title">{sent.text || report.defaultQuestion}</h2>
        <fieldset className="v2-choice v2-choice--pair">
          <legend className="v2-sr">Votre réponse</legend>
          {["Oui", "Non"].map((option) => (
            <label key={option} className={choice === option ? "is-on" : ""}>
              <input type="radio" name="answer" checked={choice === option} onChange={() => setChoice(option)} />
              {option}
            </label>
          ))}
        </fieldset>
        <Field label="Votre précision (facultatif)">
          <textarea rows={4} maxLength={500} value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="Vous pouvez ajouter un détail ici (message d’erreur, appareil utilisé, moment de la journée…)." aria-describedby="precision-count" />
        </Field>
        <p id="precision-count" className="v2-count">{detail.length} / 500</p>
        <Button type="button" onClick={() => finish("answered")}>Répondre à la question <span aria-hidden="true">→</span></Button>
        <Button type="button" variant="outline" onClick={() => finish("skipped")}>Passer pour le moment</Button>
        <p className="v2-info">La réponse est facultative. Votre avis et vos points restent inchangés si vous ne répondez pas.</p>
        <button type="button" className="v2-link-row v2-link-row--card" onClick={goPublished}>
          <span aria-hidden="true">◎</span>
          <span>
            <strong>Relire mon avis</strong>
            <small>Vous pouvez consulter à tout moment l’avis que vous avez publié.</small>
          </span>
          <b aria-hidden="true">›</b>
        </button>
        <div className="v2-link-row v2-link-row--card" role="note">
          <span aria-hidden="true">◐</span>
          <span>
            <strong>Si vous ne répondez pas</strong>
            <small>Si vous ne répondez pas, l’entrepreneur verra : « Précision non obtenue ».</small>
          </span>
        </div>
      </main>
    </PageShell>
  );
}

export function CommunityScreen({ navigate, pageRef, openDrawer }) {
  return (
    <ShellWithNav active="community" navigate={navigate} pageRef={pageRef} openDrawer={openDrawer} header={false}>
      <main className="v2-stack">
        <div className="v2-community-head">
          <h1>Les applis <span className="v2-accent">des testeurs</span></h1>
          <button type="button" className="v2-icon-button" aria-label="Fermer" onClick={() => navigate("discover")}>×</button>
        </div>
        <p className="v2-muted">Les 10 meilleurs contributeurs</p>
        <p className="v2-info">Ces projets gagnent en visibilité grâce aux avis utiles de notre communauté, pas par l’achat d’espace publicitaire.</p>
        <p className="v2-description">Leurs projets restent ici tant qu’ils figurent dans le top 10.</p>
        <div className="v2-community-list">
          {testerProjects.map((project, index) => {
            const comment = testerComments.find((item) => item.projectId === project.id);
            return (
              <Card key={project.id} className="v2-community-card v2-community-card--row">
                <span className="v2-rank-badge">{index + 1}</span>
                <img src={project.cover} alt="" />
                <div>
                  <ProjectIdentity campaign={project} size="compact" linked />
                  {comment ? <q>{comment.text}</q> : null}
                  <Tags items={project.tags} />
                  <Button type="button" onClick={() => navigate("browse", { campaignId: project.id })}>Découvrir <span aria-hidden="true">→</span></Button>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </ShellWithNav>
  );
}

export function RankingScreen({ navigate, pageRef, openDrawer }) {
  return (
    <ShellWithNav active="ranking" navigate={navigate} pageRef={pageRef} openDrawer={openDrawer}>
      <main className="v2-stack">
        <div><h1>Classement <span className="v2-accent">des testeurs</span></h1><p className="v2-muted">30 derniers jours</p></div>
        <p className="v2-description">Les avis précis et appréciés font gagner des points.</p>
        <ol className="v2-ranking-list">
          {ranking.map((person, index) => <li key={person.name} className={index < 3 ? `is-podium is-${index + 1}` : ""}><span className="v2-position">{index + 1}</span><span className="v2-avatar">{person.name.charAt(0)}</span><span><strong>{person.name}</strong><small>{person.tested} applis testés</small></span><b>{person.points} pts</b></li>)}
        </ol>
        <Card className="v2-user-rank"><strong>Vous · 12e</strong><b>210 pts</b><p>Encore 18 points pour atteindre le top 10.</p><progress value="210" max="228">210 sur 228</progress><Button type="button" onClick={() => navigate("discover")}>Tester la campagne <span aria-hidden="true">→</span></Button></Card>
      </main>
    </ShellWithNav>
  );
}

function ProfileBody({ navigate, pageRef, openDrawer, signedIn, name, avatar, onAvatar }) {
  const [showReviews, setShowReviews] = useState(false);
  const profile = readProfile();
  const projectName = profile.projectName || "Aucun projet configuré";
  const reviews = Object.entries(readV2State().publishedReviews);
  return (
    <ShellWithNav navigate={navigate} pageRef={pageRef} openDrawer={openDrawer}>
      <main className="v2-stack v2-profile">
        <section className="v2-profile-identity">
          <label className="v2-avatar-editor">
            {avatar ? <img src={avatar} alt="" /> : <span aria-hidden="true">{name.charAt(0)}</span>}
            <input type="file" accept="image/*" onChange={onAvatar} />
            <span>Modifier</span>
          </label>
          <div>
            <p>Bonjour</p>
            <h1>{name}</h1>
            <p>Testeur depuis mars 2024</p>
          </div>
        </section>
        <Card>
          <SectionTitle
            icon="▥"
            title="Ma contribution"
            description="Un grand merci pour votre engagement ! Voici votre activité des 30 derniers jours."
            action={<button type="button" className="v2-inline-link" onClick={() => setShowReviews((open) => !open)}>Voir mes avis →</button>}
          />
          <div className="v2-stats">
            <div><span className="v2-stat-icon" aria-hidden="true">🏆</span><strong>12e</strong><span>au classement des testeurs</span></div>
            <div><span className="v2-stat-icon" aria-hidden="true">📶</span><strong>210</strong><span>points gagnés</span></div>
            <div><span className="v2-stat-icon" aria-hidden="true">💬</span><strong>6</strong><span>avis utiles publiés</span></div>
          </div>
          {showReviews ? (
            <ul className="v2-local-reviews">
              {reviews.length ? reviews.map(([id, review]) => {
                const campaign = campaigns.find((item) => item.id === id);
                return (
                  <li key={id}>
                    {campaign ? (
                      <button type="button" onClick={() => navigate("review-published", { campaignId: id })}>
                        <strong>{campaign.name}</strong>
                        <span>{review.text}</span>
                      </button>
                    ) : (
                      <p>Avis conservé localement, hors campagne entrepreneur.</p>
                    )}
                  </li>
                );
              }) : <li>Aucun avis publié sur cet appareil.</li>}
            </ul>
          ) : null}
        </Card>
        <Card>
          <SectionTitle
            icon="◇"
            title="Mon projet"
            action={profile.projectName ? <span className="v2-wait-chip">En attente du top 10</span> : null}
          />
          <div className="v2-profile-project">
            {profile.projectLogo ? <img className="v2-profile-project-logo" src={profile.projectLogo} alt={`Logo ${projectName}`} /> : <span className="v2-logo-placeholder" aria-hidden="true">◇</span>}
            <div>
              <h2>{projectName}</h2>
              <p>{profile.projectPitch || "Ajoutez votre projet pour le présenter à la communauté."}</p>
            </div>
          </div>
          <button type="button" className="v2-ghost-chip" onClick={() => navigate("entrepreneur")}>✎ Modifier mon projet</button>
          <p className="v2-helper v2-helper--left">Votre projet sera présenté dans la Communauté tant que vous serez dans le top 10.</p>
          <Button type="button" onClick={() => navigate("entrepreneur")}>Ajouter ou modifier mon projet <span aria-hidden="true">→</span></Button>
        </Card>
        <button className="v2-service-entry" type="button" onClick={() => navigate("entrepreneur")}>
          <span aria-hidden="true">📣</span>
          <span>
            <strong>Faire tester mon service</strong>
            <small>Touchez des testeurs qualifiés grâce à une campagne payante, en complément de la visibilité de la Communauté.</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
      </main>
    </ShellWithNav>
  );
}

function ClerkProfile(props) {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  async function avatarChange(event) {
    const file = event.target.files?.[0];
    if (file && user?.setProfileImage) await user.setProfileImage({ file });
  }
  return <ProfileBody {...props} signedIn={Boolean(isSignedIn)} name={user?.fullName || user?.firstName || "Alexandre"} avatar={user?.imageUrl || ""} onSignOut={() => signOut().then(() => props.navigate("discover"))} onAvatar={avatarChange} />;
}

function LocalProfile(props) {
  const [profile, setProfile] = useState(readProfile);
  function avatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const user = { ...(profile.user || {}), name: profile.name, avatar: String(reader.result) };
      setLocalUser(user);
      setProfile(readProfile());
    };
    reader.readAsDataURL(file);
  }
  function signOut() {
    setLocalUser(null);
    props.navigate("discover");
  }
  return <ProfileBody {...props} signedIn={Boolean(profile.user)} name={profile.name} avatar={profile.avatar} onSignOut={signOut} onAvatar={avatarChange} />;
}

export function ProfileScreen(props) {
  return clerkKey ? <ClerkProfile {...props} /> : <LocalProfile {...props} />;
}

function LoginShell({ back, pageRef, children }) {
  return (
    <PageShell pageRef={pageRef}>
      <section className="v2-login">
        <BackButton onClick={back} />
        <img className="v2-login-logo" src="/logo-gemelo.png" alt="Gemelo" />
        {children}
      </section>
    </PageShell>
  );
}

function ClerkLogin({ navigate, back, pageRef }) {
  const { isSignedIn } = useUser();
  useEffect(() => {
    if (isSignedIn) navigate("profile", {}, true);
  }, [isSignedIn, navigate]);
  return (
    <LoginShell back={back} pageRef={pageRef}>
      <SignIn routing="hash" appearance={clerkAppearance} />
    </LoginShell>
  );
}

export function LoginScreen({ navigate, back, pageRef }) {
  if (!clerkKey) {
    return (
      <LoginShell back={back} pageRef={pageRef}>
        <p className="v2-login-missing">La clé Clerk n’est pas encore enregistrée sur Gemelo.</p>
      </LoginShell>
    );
  }
  return <ClerkLogin navigate={navigate} back={back} pageRef={pageRef} />;
}

export function PlaceholderScreen({ title, back, pageRef }) {
  return <PageShell pageRef={pageRef}><main className="v2-stack"><BackButton onClick={back} /><Header /><Card><h1>{title}</h1><p className="v2-description">Ce flux sera reconstruit dans le prochain lot. Aucun paiement ni envoi serveur n’a lieu.</p></Card></main></PageShell>;
}
