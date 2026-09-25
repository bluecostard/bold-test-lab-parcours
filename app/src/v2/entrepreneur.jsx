import { useRef, useState } from "react";
import { readAccount, writeAccount } from "../screens/account.js";
import { demoReports, offers } from "./data.js";
import { BackButton, Button, Card, EntrepreneurNav, Field, Header, PageShell, SectionTitle, Tags } from "./primitives.jsx";

const categories = ["Alimentation", "Bien-être", "Écoresponsable", "Maison", "Nature", "Santé", "Technologie", "Voyage"];
const networks = ["Instagram", "TikTok", "Facebook", "LinkedIn", "YouTube", "X"];
const emptySocial = () => ({ platform: "", url: "" });
const emptyInstruction = () => ({ title: "", text: "" });

function validUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function imageToDataUrl(file, maxSize = 1280) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Cette image ne peut pas être ouverte."));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Compression de l’image impossible."));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", .8));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formattedDate(value) {
  if (!value) return "Jour à choisir";
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function addDays(value, days) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function campaignWindow(account) {
  const start = account.offerDate;
  const fullDay = account.offerLabel === "24 heures" || Number(account.offerPrice) === 149;
  const end = start ? addDays(start, fullDay ? 1 : 0) : "";
  return {
    startLabel: formattedDate(start),
    endLabel: formattedDate(end || start),
    range: start ? `Du ${formattedDate(start)} au ${formattedDate(end || start)}` : "Jour à choisir",
  };
}

function downloadDemo(filename, content, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const reportPriorities = demoReports;

const batteryAnswers = [
  { label: "Non", count: 8, percent: 40, tone: "green" },
  { label: "Un peu", count: 6, percent: 30, tone: "blue" },
  { label: "Beaucoup", count: 2, percent: 10, tone: "orange" },
  { label: "Je ne sais pas", count: 4, percent: 20, tone: "purple" },
];

function reportText(account) {
  return [
    `Rapport de démonstration — ${account.projectName || "projet"}`,
    `Offre : ${account.offerLabel || "—"} · ${account.offerPrice || "—"} € simulés`,
    `Date : ${formattedDate(account.offerDate)}`,
    "",
    "Vue d’ensemble (données de démonstration)",
    "42 rapports soumis · 31 rapports détaillés · Design 4,1/5 · Parcours 3,2/5",
    "",
    "Corrections prioritaires",
    ...reportPriorities.map((item, index) => `${index + 1}. ${item.title} (${item.testers} testeurs, écran ${item.screen})`),
    "",
    "Points appréciés",
    "« Des lieux calmes et inspirants, une belle source d’idées pour se ressourcer. »",
  ].join("\n");
}

function ProjectSummary({ account }) {
  return (
    <Card className="v2-project-summary">
      {account.projectLogo ? <img src={account.projectLogo} alt={`Logo ${account.projectName}`} /> : <span className="v2-logo-placeholder">Logo</span>}
      <div><h2>{account.projectName || "Votre projet"}</h2><p>{account.projectPitch || "Description à compléter"}</p>{account.category ? <Tags items={[account.category]} /> : null}</div>
    </Card>
  );
}

export function EntrepreneurFormScreen({ navigate, back, pageRef }) {
  const saved = readAccount();
  const [name, setName] = useState(saved.projectName || "");
  const [pitch, setPitch] = useState(saved.projectPitch || "");
  const [link, setLink] = useState(saved.projectLink || "");
  const [category, setCategory] = useState(saved.category || "");
  const [logo, setLogo] = useState(saved.projectLogo || "");
  const [screens, setScreens] = useState(saved.projectScreens || []);
  const [socials, setSocials] = useState(saved.projectSocials?.length ? saved.projectSocials : [emptySocial(), emptySocial()]);
  const [instructions, setInstructions] = useState(saved.projectInstructions?.length ? saved.projectInstructions : [emptyInstruction()]);
  const [errors, setErrors] = useState({});
  const [storageError, setStorageError] = useState("");
  const [imageError, setImageError] = useState("");
  const logoInput = useRef(null);
  const screenInput = useRef(null);

  async function chooseLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try { setLogo(await imageToDataUrl(file, 720)); setImageError(""); }
    catch (error) { setImageError(error.message); }
    event.target.value = "";
  }
  async function chooseScreens(event) {
    const files = Array.from(event.target.files || []);
    if (screens.length + files.length > 6) {
      setImageError("Vous pouvez conserver jusqu’à 6 captures.");
      event.target.value = "";
      return;
    }
    try {
      const additions = await Promise.all(files.map((file) => imageToDataUrl(file)));
      setScreens((current) => [...current, ...additions]);
      setImageError("");
    }
    catch (error) { setImageError(error.message); }
    event.target.value = "";
  }
  function save(event) {
    event.preventDefault();
    const next = {};
    if (!name.trim()) next.name = "Le nom est obligatoire.";
    if (!pitch.trim()) next.pitch = "La description est obligatoire.";
    if (link.trim() && !validUrl(link.trim())) next.link = "Saisissez une URL complète valide.";
    if (!category) next.category = "Choisissez une catégorie.";
    if (socials.length < 2 || socials.length > 6) next.socials = "Ajoutez entre 2 et 6 réseaux.";
    const selected = socials.map((social) => social.platform).filter(Boolean);
    if (new Set(selected).size !== selected.length) next.socials = "Chaque réseau doit être unique.";
    socials.forEach((social, index) => {
      if (!social.platform) next[`social-platform-${index}`] = "Choisissez un réseau.";
      if (!validUrl(social.url)) next[`social-url-${index}`] = "URL complète invalide.";
    });
    if (!instructions.length) next.instructions = "Ajoutez au moins une consigne.";
    instructions.forEach((instruction, index) => {
      if (!instruction.title.trim()) next[`instruction-title-${index}`] = "Titre obligatoire.";
      if (!instruction.text.trim()) next[`instruction-text-${index}`] = "Texte obligatoire.";
    });
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      writeAccount({
        ...readAccount(), projectName: name.trim(), projectPitch: pitch.trim(), projectLink: link.trim(), category,
        projectLogo: logo, projectScreens: screens,
        projectSocials: socials.map((item) => ({ platform: item.platform, url: item.url.trim() })),
        projectInstructions: instructions.map((item) => ({ title: item.title.trim(), text: item.text.trim() })),
        projectSteps: instructions.map((item) => item.text.trim()).join("\n\n"),
      });
      navigate("offer");
    } catch (error) {
      setStorageError(error?.name === "QuotaExceededError" || error?.code === 22
        ? "Stockage local saturé. Supprimez des captures ou choisissez des images plus légères."
        : "Impossible d’enregistrer la campagne sur cet appareil.");
    }
  }
  return (
    <PageShell pageRef={pageRef}>
      <form className="v2-stack v2-business-form" onSubmit={save} noValidate>
        <BackButton onClick={back} /><div><h1>Créer ou modifier <span className="v2-accent">ma campagne</span></h1><p className="v2-muted">Ces informations composent la page visible par les testeurs.</p></div>
        <Card><SectionTitle title="Identité du projet" /><Field label="Nom du projet" error={errors.name}><input value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label="Description" error={errors.pitch}><textarea rows={3} value={pitch} onChange={(event) => setPitch(event.target.value)} /></Field><Field label="Lien produit" error={errors.link}><input type="url" placeholder="https://" value={link} onChange={(event) => setLink(event.target.value)} /></Field><label className="v2-field"><span>Catégorie</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Choisir</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>{errors.category ? <small role="alert">{errors.category}</small> : null}</label></Card>
        <Card><SectionTitle title="Visuels" description="Logo entier et jusqu’à 6 captures compressées sur cet appareil." /><div className="v2-logo-editor">{logo ? <img src={logo} alt="Aperçu du logo" /> : <span className="v2-logo-placeholder">Logo</span>}<div><Button type="button" variant="outline" onClick={() => logoInput.current?.click()}>{logo ? "Remplacer" : "Ajouter un logo"}</Button>{logo ? <button type="button" className="v2-text-button" onClick={() => setLogo("")}>Supprimer</button> : null}</div></div><input ref={logoInput} className="v2-hidden-input" type="file" accept="image/*" onChange={chooseLogo} /><div className="v2-capture-list">{screens.map((src, index) => <figure key={`${src.slice(-18)}-${index}`}><img src={src} alt={`Capture ${index + 1}`} /><button type="button" onClick={() => setScreens((current) => current.filter((_, position) => position !== index))} aria-label={`Supprimer la capture ${index + 1}`}>×</button></figure>)}</div><Button type="button" variant="outline" disabled={screens.length >= 6} onClick={() => screenInput.current?.click()}>Ajouter des captures ({screens.length}/6)</Button><input ref={screenInput} className="v2-hidden-input" type="file" accept="image/*" multiple onChange={chooseScreens} />{imageError ? <p className="v2-error" role="alert">{imageError}</p> : null}</Card>
        <Card><SectionTitle title="Réseaux sociaux" description="Entre 2 et 6 réseaux uniques avec une URL réelle." /><div className="v2-repeat-list">{socials.map((social, index) => <fieldset key={index}><legend>Réseau {index + 1}</legend><label className="v2-field"><span>Plateforme</span><select value={social.platform} onChange={(event) => setSocials((current) => current.map((item, position) => position === index ? { ...item, platform: event.target.value } : item))}><option value="">Choisir</option>{networks.map((network) => <option key={network} disabled={socials.some((item, position) => position !== index && item.platform === network)}>{network}</option>)}</select>{errors[`social-platform-${index}`] ? <small>{errors[`social-platform-${index}`]}</small> : null}</label><Field label="URL" error={errors[`social-url-${index}`]}><input type="url" placeholder="https://" value={social.url} onChange={(event) => setSocials((current) => current.map((item, position) => position === index ? { ...item, url: event.target.value } : item))} /></Field><button type="button" className="v2-text-button" onClick={() => setSocials((current) => current.filter((_, position) => position !== index))}>Supprimer</button></fieldset>)}</div>{errors.socials ? <p className="v2-error" role="alert">{errors.socials}</p> : null}<Button type="button" variant="outline" disabled={socials.length >= 6} onClick={() => setSocials((current) => [...current, emptySocial()])}>Ajouter un réseau</Button></Card>
        <Card><SectionTitle title="Consignes" description="Chaque consigne contient un titre et un texte." /><div className="v2-repeat-list">{instructions.map((instruction, index) => <fieldset key={index}><legend>Consigne {index + 1}</legend><Field label="Titre" error={errors[`instruction-title-${index}`]}><input value={instruction.title} onChange={(event) => setInstructions((current) => current.map((item, position) => position === index ? { ...item, title: event.target.value } : item))} /></Field><Field label="Texte" error={errors[`instruction-text-${index}`]}><textarea rows={3} value={instruction.text} onChange={(event) => setInstructions((current) => current.map((item, position) => position === index ? { ...item, text: event.target.value } : item))} /></Field><button type="button" className="v2-text-button" onClick={() => setInstructions((current) => current.filter((_, position) => position !== index))}>Supprimer</button></fieldset>)}</div>{errors.instructions ? <p className="v2-error">{errors.instructions}</p> : null}<Button type="button" variant="outline" onClick={() => setInstructions((current) => [...current, emptyInstruction()])}>Ajouter une consigne</Button></Card>
        {storageError ? <p className="v2-info" role="alert">{storageError}</p> : null}<Button type="submit">Enregistrer et choisir une offre <span aria-hidden="true">→</span></Button>
      </form>
    </PageShell>
  );
}

export function OfferScreen({ navigate, back, pageRef }) {
  const account = readAccount();
  const today = localToday();
  const savedIndex = offers.findIndex((offer) => offer.label === account.offerLabel);
  const [selectedIndex, setSelectedIndex] = useState(savedIndex);
  const [date, setDate] = useState(account.offerDate >= today ? account.offerDate : "");
  const selected = offers[selectedIndex];
  function choose(index) {
    const offer = offers[index];
    setSelectedIndex(index);
    writeAccount({ ...readAccount(), offerLabel: offer.label, offerRange: offer.range, offerPrice: offer.price });
  }
  function chooseDate(value) {
    setDate(value);
    writeAccount({ ...readAccount(), offerDate: value });
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack">
        <BackButton onClick={back} /><div><h1>Choisir <span className="v2-accent">une offre</span></h1><p className="v2-muted">Lancez votre campagne et gagnez en visibilité.</p></div><ProjectSummary account={account} />
        <Card><SectionTitle icon="◷" title="1. Choisir une offre" description="Sélectionnez un créneau disponible." /><div className="v2-offer-list" role="radiogroup" aria-label="Offres de campagne">{offers.map((offer, index) => <button key={offer.label} type="button" role="radio" aria-checked={selectedIndex === index} className={selectedIndex === index ? "is-selected" : ""} onClick={() => choose(index)}><span><strong>{offer.label}</strong><small>{offer.range}</small></span><b>{offer.price} €</b><i aria-hidden="true" /></button>)}</div></Card>
        <Card><SectionTitle icon="▦" title="2. Choisir le jour" description="La date ne peut pas être passée." /><label className="v2-field"><span>Date de début</span><input type="date" min={today} value={date} onChange={(event) => chooseDate(event.target.value)} /></label><p className="v2-info">Disponibilité simulée pour ce prototype.</p></Card>
        <Card><SectionTitle icon="✓" title="Ce que comprend chaque offre" /><div className="v2-benefits"><article><strong>◉</strong><span>Visibilité dès l’ouverture</span></article><article><strong>▤</strong><span>Page projet dédiée</span></article><article><strong>▥</strong><span>Suivi des résultats</span></article><article><strong>▧</strong><span>Rapport final</span></article></div><p className="v2-info">Aucune offre ne garantit un nombre de tests ou d’avis positifs.</p></Card>
        <Card className="v2-offer-summary"><ProjectSummary account={account} /><p><strong>{selected?.label || "Offre à choisir"}</strong> · {selected ? `${selected.price} €` : "—"}<br />{formattedDate(date)}</p><Button type="button" disabled={!selected || !date || date < today} onClick={() => navigate("payment")}>Continuer vers le paiement <span aria-hidden="true">→</span></Button></Card>
      </main>
    </PageShell>
  );
}

export function PaymentScreen({ navigate, back, pageRef }) {
  const account = readAccount();
  return (
    <PageShell pageRef={pageRef}><main className="v2-stack"><BackButton onClick={back} /><div><h1>Vérifier <span className="v2-accent">et payer</span></h1><p className="v2-muted">Dernier récapitulatif avant la simulation.</p></div><ProjectSummary account={account} /><p className="v2-simulation" role="status"><strong>Paiement simulé</strong><br />Aucune carte, aucun CVC et aucune donnée bancaire ne sont demandés ou stockés.</p><Card><SectionTitle icon="▦" title="Créneau sélectionné" /><p className="v2-review-copy">{formattedDate(account.offerDate)} · {account.offerRange}</p></Card><Card><SectionTitle icon="✓" title="Ce qui est inclus" /><ul className="v2-check-list"><li>Mise en avant sur la page d’accueil</li><li>Page dédiée avec vos consignes</li><li>Tableau de bord des retours</li><li>Rapport final de démonstration</li></ul></Card><Card><SectionTitle icon="◇" title="Détail du paiement" /><div className="v2-total"><span>{account.offerLabel}</span><b>{account.offerPrice} €</b></div><div className="v2-total"><strong>Total simulé</strong><strong>{account.offerPrice} €</strong></div></Card><Button type="button" onClick={() => { writeAccount({ ...readAccount(), campaignPaid: true }); navigate("confirmation", {}, true); }}>Simuler le paiement de {account.offerPrice} € <span aria-hidden="true">→</span></Button></main></PageShell>
  );
}

export function ConfirmationScreen({ navigate, pageRef }) {
  const account = readAccount();
  const slot = campaignWindow(account);
  const [receipt, setReceipt] = useState(false);
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack v2-confirmation">
        <Header />
        <div className="v2-success" aria-hidden="true"><i /><span>✓</span></div>
        <div>
          <h1>Paiement <span className="v2-accent">confirmé</span></h1>
          <p className="v2-muted">Merci pour votre confiance !</p>
        </div>
        <Card className="v2-confirm-summary">
          <ProjectSummary account={account} />
          <dl className="v2-confirm-meta">
            <div>
              <dt>📅 Créneau acheté</dt>
              <dd>{slot.range}</dd>
            </div>
            <div>
              <dt>💳 Montant</dt>
              <dd>{account.offerPrice} € simulés</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <SectionTitle icon="▦" title="Campagne programmée" />
          <ul className="v2-check-list">
            <li>Nous vérifierons les liens et les consignes avant sa mise en ligne.</li>
            <li>Retrouvez votre campagne et vos résultats dans votre espace.</li>
          </ul>
          <Button type="button" onClick={() => navigate("results", {}, true)}>Voir ma campagne <span aria-hidden="true">→</span></Button>
          <Button type="button" variant="outline" onClick={() => setReceipt(true)}>Voir mon reçu</Button>
        </Card>
        {receipt ? (
          <Card>
            <SectionTitle title="Reçu simulé" description="Paiement Stripe simulé — aucune carte n’a été débitée." />
            <p className="v2-review-copy">{account.projectName || "Votre projet"} · {account.offerLabel} · {account.offerPrice} € · {slot.range}</p>
          </Card>
        ) : null}
      </main>
    </PageShell>
  );
}

export function ResultsScreen({ navigate, pageRef }) {
  const account = readAccount();
  const [tab, setTab] = useState("campaigns");
  const [filter, setFilter] = useState("all");
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const hasCampaign = Boolean(account.projectName);
  const visible = hasCampaign && (filter === "all" || filter === "done");
  return (
    <PageShell withNav pageRef={pageRef}>
      <main className="v2-stack">
        <div>
          <h1>⚡ Mes <span className="v2-accent">résultats de test</span></h1>
          <p className="v2-muted">Vos campagnes, des retours concrets</p>
        </div>
        <div className="v2-switch" role="tablist" aria-label="Type de résultats">
          <button type="button" role="tab" aria-selected={tab === "campaigns"} className={tab === "campaigns" ? "is-on" : ""} onClick={() => setTab("campaigns")}>📣 Mes campagnes</button>
          <button type="button" role="tab" aria-selected={tab === "favorites"} className={tab === "favorites" ? "is-on" : ""} onClick={() => setTab("favorites")}>♡ Mes projets favoris</button>
        </div>
        {tab === "favorites" ? (
          <Card><p className="v2-description">Aucun projet favori enregistré.</p></Card>
        ) : (
          <>
            <div className="v2-pills" role="group" aria-label="Filtrer les campagnes">
              {[["all", "Tous"], ["live", "En cours"], ["done", "Terminées"]].map(([id, label]) => (
                <button key={id} type="button" className={filter === id ? "is-on" : ""} onClick={() => setFilter(id)}>{label}</button>
              ))}
            </div>
            {visible ? (
              <Card className="v2-result-card">
                <div className="v2-result-head">
                  <ProjectSummary account={account} />
                  <span className="v2-status-ok">✓ Terminée</span>
                </div>
                <p className="v2-demo-badge">Exemple fictif · campagne réalisée en 24 h</p>
                {account.category ? <Tags items={[account.category]} /> : null}
                <div className="v2-result-stats v2-result-stats--3">
                  <div><span aria-hidden="true">▤</span><strong>31</strong><span>rapports actionnables</span></div>
                  <div><span aria-hidden="true">★</span><strong>4,1 / 5</strong><span>Design</span></div>
                  <div><span aria-hidden="true">◎</span><strong>3,2 / 5</strong><span>Parcours utilisateur</span></div>
                </div>
                <p className="v2-info"><strong>Principal point d’amélioration</strong><br />« Réserver peu visible » — plusieurs testeurs ont du mal à trouver le bouton de réservation.</p>
                <Button type="button" onClick={() => navigate("report")}>Ouvrir le rapport <span aria-hidden="true">→</span></Button>
                <div className="v2-result-links">
                  <button type="button" onClick={() => setReviewsOpen((open) => !open)}>Lire tous les avis →</button>
                  <button type="button" onClick={() => downloadDemo(`${account.projectName || "campagne"}-rapport.txt`, reportText(account))}>Télécharger le rapport PDF</button>
                </div>
                {reviewsOpen ? (
                  <ul className="v2-local-reviews">
                    <li>« Des lieux calmes et inspirants, une belle source d’idées. »</li>
                    <li>« Le bouton Réserver est trop bas dans la fiche. »</li>
                    <li>Données de démonstration, non issues d’un serveur.</li>
                  </ul>
                ) : null}
              </Card>
            ) : (
              <Card><p className="v2-description">{hasCampaign ? "Aucune campagne ne correspond à ce filtre." : "Aucune campagne enregistrée sur cet appareil."}</p></Card>
            )}
          </>
        )}
      </main>
      <EntrepreneurNav active="results" onNavigate={navigate} />
    </PageShell>
  );
}

export function ReportScreen({ navigate, back, pageRef }) {
  const account = readAccount();
  const [reviewsOpen, setReviewsOpen] = useState(false);
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack">
        <BackButton onClick={back} />
        <Header />
        <Card className="v2-report-identity">
          <ProjectSummary account={account} />
          <p className="v2-demo-badge">Données fictives · Terminée</p>
        </Card>
        <Card>
          <SectionTitle title="Vue d’ensemble" description="Des testeurs réels, des retours utiles" />
          <div className="v2-result-stats">
            <div><strong>42</strong><span>rapports de test soumis</span></div>
            <div><strong>31</strong><span>rapports détaillés et exploitables</span></div>
            <div><strong>4,1 / 5</strong><span>Note moyenne Design</span></div>
            <div><strong>3,2 / 5</strong><span>Note moyenne Parcours</span></div>
          </div>
        </Card>
        <Card>
          <SectionTitle icon="◎" title="3 corrections prioritaires" description="Les principaux points à améliorer" />
          <ol className="v2-priority-list">
            {reportPriorities.map((item, index) => (
              <li key={item.id}>
                <div>
                  <b>{index + 1}</b>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.testers} testeurs distincts l’ont signalé · Écran : {item.screen}</small>
                    <button type="button" className="v2-inline-link" onClick={() => navigate("report-detail", { reportId: item.id, from: "report", campaignId: "bed-hop" })}>
                      Voir détails et preuves →
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <SectionTitle icon="♥" title="Points appréciés" description="Un retour récurrent dans les avis" />
          <q className="v2-loved">Des lieux calmes et inspirants, une belle source d’idées pour se ressourcer au quotidien.</q>
        </Card>
        <Card>
          <SectionTitle icon="▥" title="Batterie : 20 réponses" description="Comment les testeurs ont évalué l’impact sur la batterie" />
          <ul className="v2-bars">
            {batteryAnswers.map((item) => (
              <li key={item.label}>
                <span>{item.label}</span>
                <div className="v2-bar-track"><i className={`is-${item.tone}`} style={{ width: `${item.percent}%` }} /></div>
                <b>{item.count}</b>
                <small>{item.percent} %</small>
              </li>
            ))}
          </ul>
        </Card>
        <div className="v2-report-actions">
          <button type="button" onClick={() => setReviewsOpen((open) => !open)}>Lire les avis</button>
          <button type="button" onClick={() => downloadDemo(`${account.projectName || "campagne"}-rapport.txt`, reportText(account))}>Rapport PDF</button>
          <button type="button" onClick={() => downloadDemo(`${account.projectName || "campagne"}-rapport.csv`, ["Sujet,Valeur", "Rapports soumis,42", "Rapports détaillés,31", "Design,4.1", "Parcours,3.2"].join("\n"), "text/csv;charset=utf-8")}>Exporter CSV</button>
        </div>
        {reviewsOpen ? (
          <Card>
            <ul className="v2-local-reviews">
              <li>« Des lieux calmes et inspirants, une belle source d’idées. »</li>
              <li>« Le bouton Réserver est trop bas dans la fiche. »</li>
              <li>Données de démonstration, non issues d’un serveur.</li>
            </ul>
          </Card>
        ) : null}
      </main>
    </PageShell>
  );
}
