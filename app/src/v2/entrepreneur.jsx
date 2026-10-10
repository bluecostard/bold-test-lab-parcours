import { useAuth, useUser } from "@clerk/react";
import { useEffect, useRef, useState } from "react";
import { readAccount, writeAccount } from "../screens/account.js";
import { slotAvailable } from "../../lib/availability.js";
import { apply, addDays, demoOfferDays, formattedDate, localToday, slotEnded } from "./booking.js";
import { useCampaignCatalog } from "./catalog.js";
import { confirmCheckout, paymentMode, startCheckout } from "./checkoutApi.js";
import { offers } from "./data.js";
import { hostMediaValue, uploadMedia } from "./mediaApi.js";
import { listReviews } from "./reviewsApi.js";
import { hasPaidCampaign } from "./state.js";
import { BackButton, Button, Card, EntrepreneurNav, Field, Header, PageShell, SectionTitle, Tags } from "./primitives.jsx";

const categories = ["Alimentation", "Bien-être", "Écoresponsable", "Maison", "Nature", "Santé", "Technologie", "Voyage"];
const networks = ["Instagram", "TikTok", "Facebook", "LinkedIn", "YouTube", "X"];
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
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

function downloadFile(filename, content, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const batteryOptions = [
  { label: "Non", tone: "green" },
  { label: "Un peu", tone: "blue" },
  { label: "Beaucoup", tone: "orange" },
  { label: "Je ne sais pas", tone: "purple" },
];

function scoreAvg(reviews, key) {
  const values = reviews.map((item) => Number(item[key])).filter((value) => value >= 1 && value <= 5);
  if (!values.length) return null;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function reportText(account, reviews = []) {
  const stats = reviewStats(reviews);
  return [
    `Rapport — ${account.projectName || "projet"}`,
    `Offre : ${account.offerLabel || "—"} · ${account.offerPrice || "—"} €`,
    `Date : ${formattedDate(account.offerDate)}`,
    "",
    "Vue d’ensemble",
    `${stats.total} avis soumis`,
    `Note design : ${stats.design ?? "—"}`,
    `Note parcours : ${stats.journey ?? "—"}`,
    "",
    "Avis",
    ...(reviews.length
      ? reviews.map((item, index) => `${index + 1}. ${item.author || "Testeur"} — ${item.text || item.body || ""}`)
      : ["Aucun avis pour le moment."]),
  ].join("\n");
}

function reportCsv(reviews = []) {
  const rows = [
    ["Auteur", "Date", "Avis", "Bug", "Écran", "Batterie", "Design", "Parcours"],
    ...reviews.map((item) => [
      item.author || "",
      item.publishedAt || "",
      String(item.text || item.body || "").replace(/"/g, '""'),
      item.hadBug || "",
      item.screen || "",
      item.battery || "",
      item.designScore ?? "",
      item.journeyScore ?? "",
    ]),
  ];
  return rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
}

function hasProjectDraft(account = readAccount()) {
  return Boolean(account.projectName?.trim() && account.projectPitch?.trim());
}

function ProjectSummary({ account }) {
  if (!account.projectName?.trim()) return null;
  const tags = account.tags?.length ? account.tags : account.category ? [account.category] : [];
  const image = account.projectLogo
    ? <img src={account.projectLogo} alt={`Logo ${account.projectName}`} />
    : <span aria-hidden="true">Logo</span>;
  const logo = account.projectLink ? (
    <a className="v2-project-logo" href={account.projectLink} target="_blank" rel="noreferrer" aria-label={`Ouvrir le site de ${account.projectName}`}>
      {image}
    </a>
  ) : (
    <span className="v2-project-logo">{image}</span>
  );
  return (
    <Card className="v2-project-summary">
      {logo}
      <div>
        <h2>{account.projectName}</h2>
        <p>{account.projectPitch || "Description à compléter"}</p>
        {tags.length ? <Tags items={tags} /> : null}
      </div>
    </Card>
  );
}

export function EntrepreneurFormScreen(props) {
  return clerkKey ? <EntrepreneurFormAuthed {...props} /> : <EntrepreneurFormBody {...props} getToken={null} />;
}

function EntrepreneurFormAuthed(props) {
  const { getToken } = useAuth();
  return <EntrepreneurFormBody {...props} getToken={getToken} />;
}

function EntrepreneurFormBody({ navigate, back, pageRef, getToken }) {
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
    try {
      if (getToken) {
        const uploaded = await uploadMedia(getToken, file, "image");
        setLogo(uploaded.url);
      } else {
        setLogo(await imageToDataUrl(file, 720));
      }
      setImageError("");
    } catch (error) {
      try {
        setLogo(await imageToDataUrl(file, 720));
        setImageError("");
      } catch {
        setImageError(error.message);
      }
    }
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
      const additions = [];
      for (const file of files) {
        try {
          if (getToken) additions.push((await uploadMedia(getToken, file, "image")).url);
          else additions.push(await imageToDataUrl(file));
        } catch {
          additions.push(await imageToDataUrl(file));
        }
      }
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
      navigate(readAccount().offerLabel ? "payment" : "offer");
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
        <Card><SectionTitle title="Visuels" description="Logo entier et jusqu’à 6 captures." /><div className="v2-logo-editor">{logo ? <img src={logo} alt="Aperçu du logo" /> : <span className="v2-logo-placeholder">Logo</span>}<div><Button type="button" variant="outline" onClick={() => logoInput.current?.click()}>{logo ? "Remplacer" : "Ajouter un logo"}</Button>{logo ? <button type="button" className="v2-text-button" onClick={() => setLogo("")}>Supprimer</button> : null}</div></div><input ref={logoInput} className="v2-hidden-input" type="file" accept="image/*" onChange={chooseLogo} /><div className="v2-capture-list">{screens.map((src, index) => <figure key={`${src.slice(-18)}-${index}`}><img src={src} alt={`Capture ${index + 1}`} /><button type="button" onClick={() => setScreens((current) => current.filter((_, position) => position !== index))} aria-label={`Supprimer la capture ${index + 1}`}>×</button></figure>)}</div><Button type="button" variant="outline" disabled={screens.length >= 6} onClick={() => screenInput.current?.click()}>Ajouter des captures ({screens.length}/6)</Button><input ref={screenInput} className="v2-hidden-input" type="file" accept="image/*" multiple onChange={chooseScreens} />{imageError ? <p className="v2-error" role="alert">{imageError}</p> : null}</Card>
        <Card><SectionTitle title="Réseaux sociaux" description="Entre 2 et 6 réseaux uniques avec une URL réelle." /><div className="v2-repeat-list">{socials.map((social, index) => <fieldset key={index}><legend>Réseau {index + 1}</legend><label className="v2-field"><span>Plateforme</span><select value={social.platform} onChange={(event) => setSocials((current) => current.map((item, position) => position === index ? { ...item, platform: event.target.value } : item))}><option value="">Choisir</option>{networks.map((network) => <option key={network} disabled={socials.some((item, position) => position !== index && item.platform === network)}>{network}</option>)}</select>{errors[`social-platform-${index}`] ? <small>{errors[`social-platform-${index}`]}</small> : null}</label><Field label="URL" error={errors[`social-url-${index}`]}><input type="url" placeholder="https://" value={social.url} onChange={(event) => setSocials((current) => current.map((item, position) => position === index ? { ...item, url: event.target.value } : item))} /></Field><button type="button" className="v2-text-button" onClick={() => setSocials((current) => current.filter((_, position) => position !== index))}>Supprimer</button></fieldset>)}</div>{errors.socials ? <p className="v2-error" role="alert">{errors.socials}</p> : null}<Button type="button" variant="outline" disabled={socials.length >= 6} onClick={() => setSocials((current) => [...current, emptySocial()])}>Ajouter un réseau</Button></Card>
        <Card><SectionTitle title="Consignes" description="Chaque consigne contient un titre et un texte." /><div className="v2-repeat-list">{instructions.map((instruction, index) => <fieldset key={index}><legend>Consigne {index + 1}</legend><Field label="Titre" error={errors[`instruction-title-${index}`]}><input value={instruction.title} onChange={(event) => setInstructions((current) => current.map((item, position) => position === index ? { ...item, title: event.target.value } : item))} /></Field><Field label="Texte" error={errors[`instruction-text-${index}`]}><textarea rows={3} value={instruction.text} onChange={(event) => setInstructions((current) => current.map((item, position) => position === index ? { ...item, text: event.target.value } : item))} /></Field><button type="button" className="v2-text-button" onClick={() => setInstructions((current) => current.filter((_, position) => position !== index))}>Supprimer</button></fieldset>)}</div>{errors.instructions ? <p className="v2-error">{errors.instructions}</p> : null}<Button type="button" variant="outline" onClick={() => setInstructions((current) => [...current, emptyInstruction()])}>Ajouter une consigne</Button></Card>
        {storageError ? <p className="v2-info" role="alert">{storageError}</p> : null}<Button type="submit">{readAccount().offerLabel ? "Enregistrer et payer" : "Enregistrer et choisir une offre"} <span aria-hidden="true">→</span></Button>
      </form>
    </PageShell>
  );
}

export function OfferScreen({ navigate, back, pageRef }) {
  const account = readAccount();
  const catalog = useCampaignCatalog();
  const today = localToday();
  const savedIndex = offers.findIndex((offer) => offer.label === account.offerLabel);
  const [selectedIndex, setSelectedIndex] = useState(savedIndex);
  const selected = offers[selectedIndex];
  const ignoreId = account.campaignId || "";
  const offerLabel = selected?.label || account.offerLabel || "";
  const days = demoOfferDays(today, 4).map((day) => ({
    ...day,
    available: slotAvailable(day.value, offerLabel, catalog, ignoreId, today),
  }));
  const firstOpen = days.find((day) => day.available)?.value || "";
  const savedDate = account.offerDate && account.offerDate >= today ? account.offerDate : "";
  const [date, setDate] = useState(savedDate || firstOpen);
  const [pickOther, setPickOther] = useState(() => Boolean(savedDate && !days.some((day) => day.value === savedDate)));
  const customSelected = pickOther && date && !days.some((day) => day.value === date);
  const chosenAvailable = slotAvailable(date, offerLabel, catalog, ignoreId, today);
  function choose(index) {
    const offer = offers[index];
    setSelectedIndex(index);
    apply({ offer });
  }
  function chooseDate(value) {
    setDate(value);
    apply({ date: value });
    if (days.some((day) => day.value === value)) setPickOther(false);
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack">
        <BackButton onClick={back} /><div><h1>Choisir <span className="v2-accent">une offre</span></h1><p className="v2-muted">Voyez les tarifs, choisissez un créneau, puis décrivez votre projet.</p></div><ProjectSummary account={account} />
        <Card><SectionTitle icon="◷" title="1. Choisir une offre" description="Sélectionnez un créneau disponible." /><div className="v2-offer-list" role="radiogroup" aria-label="Offres de campagne">{offers.map((offer, index) => <button key={offer.label} type="button" role="radio" aria-checked={selectedIndex === index} className={selectedIndex === index ? "is-selected" : ""} onClick={() => choose(index)}><span><strong>{offer.label}</strong><small>{offer.range}</small></span><b>{offer.price} €</b><i aria-hidden="true" /></button>)}</div></Card>
        <Card>
          <SectionTitle icon="▦" title="2. Choisir le jour" description="Vérifiez la disponibilité pour votre campagne." />
          <div className="v2-day-list" role="radiogroup" aria-label="Jours disponibles">
            {days.map((day) => (
              <button
                key={day.value}
                type="button"
                role="radio"
                aria-checked={!customSelected && date === day.value}
                disabled={!day.available}
                className={!customSelected && date === day.value ? "is-selected" : ""}
                onClick={() => chooseDate(day.value)}
              >
                <span>{day.label}</span>
                <em className={day.available ? "is-open" : "is-full"}>{day.available ? "Disponible" : "Complet"}</em>
              </button>
            ))}
          </div>
          {pickOther ? (
            <>
              <Field label="Indiquez le jour souhaité">
                <input type="date" min={today} value={customSelected ? date : ""} onChange={(event) => { setPickOther(true); chooseDate(event.target.value); }} />
              </Field>
              {customSelected && date ? (
                <div className={`v2-picked-day${chosenAvailable ? " is-open" : " is-full"}`}>
                  <span>{formattedDate(date)}</span>
                  <em className={chosenAvailable ? "is-open" : "is-full"}>{chosenAvailable ? "Disponible" : "Complet"}</em>
                </div>
              ) : null}
            </>
          ) : (
            <button type="button" className="v2-text-button" onClick={() => setPickOther(true)}>Autres dates</button>
          )}
          <p className="v2-info">Disponible ou Complet se calcule sur les campagnes déjà payées pour le même créneau.</p>
        </Card>
        <Card><SectionTitle icon="✓" title="Ce que comprend chaque offre" /><div className="v2-benefits"><article><strong>◉</strong><span>Visibilité dès l’ouverture</span></article><article><strong>▤</strong><span>Page projet dédiée</span></article><article><strong>▥</strong><span>Suivi des résultats</span></article><article><strong>▧</strong><span>Rapport final</span></article><article><strong>◈</strong><span>Seul votre service est sous les projecteurs, le jour et la période choisis.</span></article></div><p className="v2-info">Aucune offre ne garantit un nombre de tests ou d’avis positifs.</p></Card>
        <Card className="v2-offer-summary"><ProjectSummary account={account} /><p><strong>{selected?.label || "Offre à choisir"}</strong> · {selected ? `${selected.price} €` : "—"}<br />{formattedDate(date)}{date ? ` · ${chosenAvailable ? "Disponible" : "Complet"}` : ""}</p><p className="v2-info">Vous pouvez modifier le jour, la période ou annuler jusqu’à 72 h avant le début, depuis votre compte.</p>{date && !chosenAvailable ? <p className="v2-info" role="status">Ce créneau est complet. Choisissez un autre jour.</p> : null}<Button type="button" disabled={!selected || !date || !chosenAvailable} onClick={() => { apply({ date }); navigate(hasProjectDraft(account) ? "payment" : "entrepreneur"); }}>{hasProjectDraft(account) ? "Continuer vers le paiement" : "Continuer et décrire le projet"} <span aria-hidden="true">→</span></Button></Card>
      </main>
    </PageShell>
  );
}

function campaignPayload(account) {
  return {
    name: account.projectName,
    pitch: account.projectPitch,
    description: account.projectPitch,
    tags: account.tags?.length ? account.tags : account.category ? [account.category] : [],
    logo: account.projectLogo,
    cover: account.projectScreens?.[0] || account.projectLogo,
    screenshots: account.projectScreens || [],
    website: account.projectLink,
    socials: account.projectSocials || [],
    instructions: (account.projectInstructions || []).map((item) => item.text || item.title).filter(Boolean),
    offerLabel: account.offerLabel,
    offerRange: account.offerRange,
    offerPrice: account.offerPrice,
    offerDate: account.offerDate,
  };
}

function reviewStats(reviews) {
  const byScreen = {};
  for (const item of reviews.filter((review) => review.hadBug === "Oui")) {
    const screen = item.screen || "Parcours";
    if (!byScreen[screen]) byScreen[screen] = [];
    byScreen[screen].push(item);
  }
  const answers = reviews.map((item) => item.battery).filter(Boolean);
  return {
    total: reviews.length,
    quotes: reviews.map((item) => item.text || item.body).filter(Boolean),
    design: scoreAvg(reviews, "designScore"),
    journey: scoreAvg(reviews, "journeyScore"),
    batteryCount: answers.length,
    battery: batteryOptions.map((option) => {
      const count = answers.filter((value) => value === option.label).length;
      const percent = answers.length ? Math.round((count / answers.length) * 100) : 0;
      return { ...option, count, percent };
    }),
    priorities: Object.entries(byScreen)
      .sort((left, right) => right[1].length - left[1].length)
      .slice(0, 3)
      .map(([screen, items]) => ({
        id: items[0].id,
        title: items[0].bugText || items[0].title || screen,
        testers: items.length,
        screen,
        campaignId: items[0].campaignId,
      })),
  };
}

export function PaymentScreen(props) {
  return clerkKey ? <PaymentAuthed {...props} /> : <PaymentBody {...props} getToken={null} user={null} />;
}

function PaymentAuthed(props) {
  const { getToken } = useAuth();
  const { user } = useUser();
  return <PaymentBody {...props} getToken={getToken} user={user} />;
}

function PaymentBody({ navigate, back, pageRef, getToken, user }) {
  const account = readAccount();
  const slot = campaignWindow(account);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [payMode, setPayMode] = useState(null);
  useEffect(() => {
    if (!account.offerLabel || !account.offerDate) navigate("offer", {}, true);
    else if (!hasProjectDraft(account)) navigate("entrepreneur", {}, true);
  }, [account.offerDate, account.offerLabel, navigate]);
  useEffect(() => {
    paymentMode().then(setPayMode).catch(() => setPayMode({ available: false, livemode: false }));
  }, []);
  async function confirm() {
    if (busy) return;
    if (!getToken || !user) {
      navigate("login", { from: "payment" });
      return;
    }
    setBusy(true);
    setError("");
    try {
      const next = readAccount();
      const payload = campaignPayload(next);
      payload.logo = await hostMediaValue(getToken, payload.logo, "logo.jpg");
      payload.cover = await hostMediaValue(getToken, payload.cover, "cover.jpg");
      payload.screenshots = (await Promise.all((payload.screenshots || []).map((src, index) => hostMediaValue(getToken, src, `capture-${index + 1}.jpg`)))).filter(Boolean);
      writeAccount({
        ...readAccount(),
        projectLogo: payload.logo,
        projectScreens: payload.screenshots,
      });
      const checkout = await startCheckout(getToken, {
        ...payload,
        offerLabel: next.offerLabel,
        offerRange: next.offerRange,
        offerPrice: next.offerPrice,
        offerDate: next.offerDate,
        email: user.primaryEmailAddress?.emailAddress || "",
      });
      if (!checkout.url) throw new Error("Impossible d’ouvrir Stripe.");
      window.location.href = checkout.url;
    } catch (payError) {
      setError(payError.message || "Impossible d’ouvrir Stripe.");
      setBusy(false);
    }
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack">
        <BackButton onClick={back} />
        <div>
          <h1>Vérifier <span className="v2-accent">et payer</span></h1>
          <p className="v2-muted">Un dernier aperçu avant de passer au paiement sécurisé.</p>
        </div>
        <ProjectSummary account={account} />
        <Card className="v2-slot-card">
          <SectionTitle
            icon="▦"
            title="Créneau sélectionné"
            action={<button type="button" className="v2-inline-link" onClick={() => navigate("offer")}>Modifier le créneau</button>}
          />
          <p className="v2-review-copy">{formattedDate(account.offerDate)} · {account.offerRange}</p>
          <dl className="v2-campaign-window">
            <div>
              <dt>Début de la campagne</dt>
              <dd>{slot.startLabel}</dd>
            </div>
            <div>
              <dt>Fin de la campagne</dt>
              <dd>{slot.endLabel}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <SectionTitle icon="☰" title="Ce qui est inclus" />
          <ul className="v2-check-list">
            <li>Mise en avant sur la page d’accueil</li>
            <li>Page dédiée à votre projet</li>
            <li>Accès au tableau de bord des retours de test</li>
            <li>Rapport final avec les enseignements clés</li>
          </ul>
        </Card>
        <Card>
          <SectionTitle icon="◇" title="Détail du paiement" />
          <div className="v2-total"><span>{account.offerLabel}</span><b>{account.offerPrice} €</b></div>
          <div className="v2-total"><strong>Total à payer</strong><strong>{account.offerPrice} €</strong></div>
        </Card>
        <p className="v2-info">Votre créneau sera confirmé après validation du paiement.</p>
        {payMode && !payMode.livemode ? (
          <p className="v2-info" role="status">Paiement de test Stripe. Aucune carte réelle n’est débitée.</p>
        ) : null}
        {error ? <p className="v2-error" role="alert">{error}</p> : null}
        <Button type="button" disabled={busy} onClick={confirm}>
          {busy ? "Redirection…" : `Payer ${account.offerPrice} € avec Stripe`}
          {busy ? null : <span aria-hidden="true"> ↗</span>}
        </Button>
        <p className="v2-helper"><span aria-hidden="true">🔒 </span>Paiement sécurisé sur la page Stripe.</p>
      </main>
    </PageShell>
  );
}

export function ConfirmationScreen(props) {
  return clerkKey ? <ConfirmationAuthed {...props} /> : <ConfirmationBody {...props} getToken={null} />;
}

function ConfirmationAuthed(props) {
  const { getToken } = useAuth();
  return <ConfirmationBody {...props} getToken={getToken} />;
}

function ConfirmationBody({ navigate, pageRef, getToken }) {
  const [account, setAccount] = useState(readAccount);
  const slot = campaignWindow(account);
  const [receipt, setReceipt] = useState(false);
  const [ready, setReady] = useState(hasPaidCampaign);
  const [payMode, setPayMode] = useState(null);
  useEffect(() => {
    paymentMode().then(setPayMode).catch(() => setPayMode({ available: false, livemode: false }));
  }, []);
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId || !getToken) {
      if (!hasPaidCampaign()) navigate("payment", {}, true);
      return;
    }
    confirmCheckout(getToken, sessionId).then((result) => {
      if (!result.paid) {
        navigate("payment", {}, true);
        return;
      }
      const next = {
        ...readAccount(),
        campaignPaid: true,
        campaignId: result.campaignId,
        offerLabel: result.offerLabel || readAccount().offerLabel,
        offerPrice: result.offerPrice || readAccount().offerPrice,
        offerDate: result.offerDate || readAccount().offerDate,
      };
      writeAccount(next);
      setAccount(next);
      setReady(true);
      window.history.replaceState({}, "", "/?ecran=confirmation");
    }).catch(() => navigate("payment", {}, true));
  }, [getToken, navigate]);
  if (!ready) {
    return (
      <PageShell pageRef={pageRef}>
        <main className="v2-stack v2-confirmation">
          <Header mark="app" />
          <p className="v2-muted">Confirmation du paiement…</p>
        </main>
      </PageShell>
    );
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack v2-confirmation">
        <Header mark="app" />
        <div className="v2-success" aria-hidden="true"><i /><span>✓</span></div>
        <div>
          <h1>Paiement <span className="v2-accent">confirmé</span></h1>
          <p className="v2-muted">{payMode && !payMode.livemode ? "Paiement de test confirmé. Aucune carte réelle n’a été débitée." : "Merci pour votre confiance !"}</p>
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
              <dd>{account.offerPrice} € payés</dd>
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
            <SectionTitle title="Reçu" />
            <p className="v2-review-copy">{account.projectName || "Votre projet"} · {account.offerLabel} · {account.offerPrice} € payés · {slot.range}</p>
          </Card>
        ) : null}
      </main>
    </PageShell>
  );
}

export function ResultsScreen({ navigate, pageRef }) {
  const paid = hasPaidCampaign();
  const account = readAccount();
  const real = paid;
  const ended = paid ? slotEnded(account) : true;
  const campaignId = paid ? (account.campaignId || "") : "";
  const [tab, setTab] = useState("campaigns");
  const [filter, setFilter] = useState("all");
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    if (!campaignId) return;
    listReviews(campaignId).then(setReviews).catch(() => setReviews([]));
  }, [campaignId]);
  const stats = reviewStats(reviews);
  const visible = paid && (filter === "all" || (filter === "done" && ended) || (filter === "live" && !ended));
  const logo = account.projectLogo;
  const site = account.projectLink;
  const name = account.projectName;
  const pitch = account.projectPitch;
  const tags = account.tags?.length ? account.tags : account.category ? [account.category] : [];
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
                  <div className="v2-identity">
                    <a className="v2-project-logo" href={site || undefined} target="_blank" rel="noreferrer" aria-label={`Ouvrir le site de ${name}`}>
                      {logo ? <img src={logo} alt={`Logo ${name}`} /> : <span aria-hidden="true">Logo</span>}
                    </a>
                    <div>
                      <h2>{name}</h2>
                      <p>{pitch}</p>
                      {real ? null : <p className="v2-result-fictif">Exemple fictif</p>}
                      <Tags items={tags} />
                    </div>
                  </div>
                  <div className="v2-result-meta">
                    <span className="v2-status-ok">{ended ? "✓ Terminée" : "En cours"}</span>
                    <p>{account.offerLabel || "Campagne"} · {formattedDate(account.offerDate)}</p>
                  </div>
                </div>
                <div className="v2-result-stats v2-result-stats--3">
                  <div><span aria-hidden="true">▤</span><strong>{stats.total}</strong><span>avis soumis</span></div>
                  <div><span aria-hidden="true">★</span><strong>{stats.design ?? "—"}</strong><span>Design</span></div>
                  <div><span aria-hidden="true">◎</span><strong>{stats.journey ?? "—"}</strong><span>Parcours utilisateur</span></div>
                </div>
                <p className="v2-info"><strong>Principal point d’amélioration</strong><br />{stats.quotes[0] ? `« ${stats.quotes[0]} »` : "Aucun avis pour le moment."}</p>
                <Button type="button" onClick={() => navigate("report")}>Ouvrir le rapport <span aria-hidden="true">→</span></Button>
                <div className="v2-result-links">
                  <button type="button" onClick={() => setReviewsOpen((open) => !open)}>Lire tous les avis →</button>
                  <button type="button" onClick={() => downloadFile(`${name || "campagne"}-rapport.txt`, reportText({ ...account, projectName: name }, reviews))}>Télécharger le rapport</button>
                </div>
                {reviewsOpen ? (
                  <ul className="v2-local-reviews">
                    {stats.quotes.length ? stats.quotes.map((quote, index) => (
                      <li key={`${quote}-${index}`}>« {quote} »{reviews[index]?.author ? ` — ${reviews[index].author}` : ""}</li>
                    )) : <li>Aucun avis publié pour cette campagne.</li>}
                  </ul>
                ) : null}
              </Card>
            ) : (
              <Card><p className="v2-description">{paid ? "Aucune campagne ne correspond à ce filtre." : "Aucune campagne enregistrée sur cet appareil."}</p></Card>
            )}
          </>
        )}
      </main>
      <EntrepreneurNav active="results" onNavigate={navigate} />
    </PageShell>
  );
}

export function ReportScreen({ navigate, back, pageRef }) {
  const paid = hasPaidCampaign();
  const account = readAccount();
  const campaignId = paid ? (account.campaignId || "") : "";
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    if (!campaignId) return;
    listReviews(campaignId).then(setReviews).catch(() => setReviews([]));
  }, [campaignId]);
  const stats = reviewStats(reviews);
  const priorities = stats.priorities;
  const loved = stats.quotes[0] || "Aucun avis pour le moment.";
  if (!paid) {
    return (
      <PageShell pageRef={pageRef}>
        <main className="v2-stack">
          <BackButton onClick={back} />
          <Header />
          <Card>
            <SectionTitle title="Aucun rapport" description="Le rapport détaillé s’affiche après le paiement d’une campagne." />
            <Button type="button" onClick={() => navigate("offer")}>Faire tester mon service <span aria-hidden="true">→</span></Button>
          </Card>
        </main>
      </PageShell>
    );
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack">
        <BackButton onClick={back} />
        <Header />
        <Card className="v2-report-identity">
          <ProjectSummary account={account} />
          <p className="v2-demo-badge">{slotEnded(account) ? "Terminée" : "En cours"}</p>
        </Card>
        <Card>
          <SectionTitle title="Vue d’ensemble" description="Des testeurs réels, des retours utiles" />
          <div className="v2-result-stats">
            <div><strong>{stats.total}</strong><span>avis soumis</span></div>
            <div><strong>{stats.batteryCount}</strong><span>réponses batterie</span></div>
            <div><strong>{stats.design ?? "—"}</strong><span>Note moyenne Design</span></div>
            <div><strong>{stats.journey ?? "—"}</strong><span>Note moyenne Parcours</span></div>
          </div>
        </Card>
        <Card>
          <SectionTitle icon="◎" title="3 corrections prioritaires" description="Les principaux points à améliorer" />
          {priorities.length ? (
            <ol className="v2-priority-list">
              {priorities.map((item, index) => (
                <li key={item.id}>
                  <div>
                    <b>{index + 1}</b>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.testers} testeurs distincts l’ont signalé · Écran : {item.screen}</small>
                      <button type="button" className="v2-inline-link" onClick={() => navigate("report-detail", { reportId: item.id, from: "report", campaignId: item.campaignId || campaignId })}>
                        Voir détails et preuves →
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="v2-description">Aucun signalement pour le moment.</p>
          )}
        </Card>
        <Card>
          <SectionTitle icon="♥" title="Points appréciés" description="Un retour récurrent dans les avis" />
          <q className="v2-loved">{loved}</q>
        </Card>
        <Card>
          <SectionTitle icon="▥" title={`Batterie : ${stats.batteryCount} réponse${stats.batteryCount > 1 ? "s" : ""}`} description="Comment les testeurs ont évalué l’impact sur la batterie" />
          <ul className="v2-bars">
            {stats.battery.map((item) => (
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
          <button type="button" onClick={() => downloadFile(`${account.projectName || "campagne"}-rapport.txt`, reportText(account, reviews))}>Télécharger le rapport</button>
          <button type="button" onClick={() => downloadFile(`${account.projectName || "campagne"}-rapport.csv`, reportCsv(reviews), "text/csv;charset=utf-8")}>Exporter CSV</button>
        </div>
        {reviewsOpen ? (
          <Card>
            <ul className="v2-local-reviews">
              {stats.quotes.length ? stats.quotes.map((quote, index) => (
                <li key={`${quote}-${index}`}>« {quote} »{reviews[index]?.author ? ` — ${reviews[index].author}` : ""}</li>
              )) : <li>Aucun avis publié pour cette campagne.</li>}
            </ul>
          </Card>
        ) : null}
      </main>
    </PageShell>
  );
}
