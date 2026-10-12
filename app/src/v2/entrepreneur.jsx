import { useAuth, useUser } from "@clerk/react";
import { useEffect, useRef, useState } from "react";
import { readAccount, writeAccount } from "../screens/account.js";
import { slotAvailable } from "../../lib/availability.js";
import { apply, addDays, demoOfferDays, formattedDate, isIsoDate, localToday, slotEnded } from "./booking.js";
import { useCampaignCatalog } from "./catalog.js";
import { confirmAppleCheckout, confirmCheckout, paymentMode, requestCampaignConfirmMail, startAppleCheckout, startCheckout } from "./checkoutApi.js";
import { finishAppleProduct, isNativeIos, purchaseAppleProduct } from "./nativePay.js";
import { formatOfferPrice, formatStoredOfferPrice, offers } from "./data.js";
import {
  forgetBlobFile,
  isHostedMedia,
  prepareImageFile,
  previewUrl,
  rememberBlobFile,
  snapshotFiles,
  uploadMedia,
} from "./mediaApi.js";
import { mapSocials, SOCIAL_NETWORKS } from "../../lib/campaignDraft.js";
import { publishCampaign } from "./campaignsApi.js";
import { listReviews } from "./reviewsApi.js";
import { hasPaidCampaign } from "./state.js";
import { BackButton, Button, Card, EntrepreneurNav, Field, Header, PageShell, SectionTitle, Tags } from "./primitives.jsx";

const categories = ["Alimentation", "Bien-être", "Écoresponsable", "Maison", "Nature", "Santé", "Technologie", "Voyage"];
const networks = SOCIAL_NETWORKS;
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const emptySocial = () => ({ platform: "", url: "" });
const emptyInstruction = () => ({ title: "", text: "" });
const MAX_TAGS = 6;

function initialTags(account) {
  const fromTags = Array.isArray(account.tags)
    ? account.tags.filter((tag) => categories.includes(tag))
    : [];
  if (fromTags.length) return fromTags.slice(0, MAX_TAGS);
  return account.category && categories.includes(account.category) ? [account.category] : [];
}

function buildProductLinks(account) {
  const name = account.projectName || "";
  const website = (account.projectLink || "").trim();
  const appStore = (account.projectAppStore || "").trim();
  const playStore = (account.projectPlayStore || "").trim();
  const links = [];
  if (appStore) links.push({ label: "App Store", detail: "Ouvrir sur l’App Store", href: appStore, icon: "●" });
  if (playStore) links.push({ label: "Google Play", detail: "Ouvrir sur Google Play", href: playStore, icon: "▶" });
  if (website) {
    links.push({
      label: "Visiter le site",
      detail: name ? `Découvrir ${name} sur le web` : "Découvrir sur le web",
      href: website,
      icon: "◎",
    });
  }
  return links;
}

function validUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
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
    `Offre : ${account.offerLabel || "—"} · ${account.offerPrice != null ? formatStoredOfferPrice(account.offerPrice, isNativeIos()) : "—"}`,
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
  const paid = hasPaidCampaign();
  const [name, setName] = useState(saved.projectName || "");
  const [pitch, setPitch] = useState(saved.projectPitch || "");
  const [link, setLink] = useState(saved.projectLink || "");
  const [appStore, setAppStore] = useState(saved.projectAppStore || "");
  const [playStore, setPlayStore] = useState(saved.projectPlayStore || "");
  const [tags, setTags] = useState(() => initialTags(saved));
  const [logo, setLogo] = useState(saved.projectLogo || "");
  const [screens, setScreens] = useState(saved.projectScreens || []);
  const [socials, setSocials] = useState(saved.projectSocials?.length ? saved.projectSocials : [emptySocial()]);
  const [instructions, setInstructions] = useState(saved.projectInstructions?.length ? saved.projectInstructions : [emptyInstruction()]);
  const [errors, setErrors] = useState({});
  const [storageError, setStorageError] = useState("");
  const [imageError, setImageError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const logoInput = useRef(null);
  const screenInput = useRef(null);

  function toggleTag(tag) {
    setTags((current) => {
      if (current.includes(tag)) return current.filter((item) => item !== tag);
      if (current.length >= MAX_TAGS) return current;
      return [...current, tag];
    });
  }

  async function chooseLogo(event) {
    // Copier avant value="" : sinon la FileList live devient vide sur iPhone.
    const picked = Array.from(event.target.files || []);
    event.target.value = "";
    let file;
    try {
      file = (await snapshotFiles(picked))[0];
    } catch {
      setImageError("Impossible de lire cette photo. Réessayez.");
      return;
    }
    if (!file) return;
    setImageError("");
    let local = "";
    try {
      // HEIC iPhone : une seule passe JPEG (aperçu = fichier envoyé).
      const jpeg = await prepareImageFile(file, "logo");
      local = previewUrl(jpeg);
      rememberBlobFile(local, jpeg);
      setLogo(local);
      if (getToken) {
        const uploaded = await uploadMedia(getToken, jpeg, "logo", { prepared: true });
        forgetBlobFile(local);
        URL.revokeObjectURL(local);
        setLogo(uploaded.url);
      }
    } catch (error) {
      if (local) {
        forgetBlobFile(local);
        URL.revokeObjectURL(local);
        setLogo("");
      }
      setImageError(error.message || "Impossible d’ajouter ce logo. Essayez un JPG ou un PNG.");
    }
  }
  async function chooseScreens(event) {
    const picked = Array.from(event.target.files || []);
    event.target.value = "";
    let files;
    try {
      files = await snapshotFiles(picked);
    } catch {
      setImageError("Impossible de lire les photos sélectionnées. Réessayez.");
      return;
    }
    if (!files.length) return;
    if (screens.length + files.length > 6) {
      setImageError("Vous pouvez conserver jusqu’à 6 captures.");
      return;
    }
    setImageError("");
    const failures = [];
    for (const file of files) {
      let local = "";
      try {
        const jpeg = await prepareImageFile(file, "screenshot");
        local = previewUrl(jpeg);
        rememberBlobFile(local, jpeg);
        setScreens((current) => [...current, local]);
        if (getToken) {
          const uploaded = await uploadMedia(getToken, jpeg, "screenshot", { prepared: true });
          forgetBlobFile(local);
          URL.revokeObjectURL(local);
          setScreens((current) => current.map((src) => (src === local ? uploaded.url : src)));
        }
      } catch (error) {
        if (local) {
          forgetBlobFile(local);
          URL.revokeObjectURL(local);
          setScreens((current) => current.filter((src) => src !== local));
        }
        failures.push(error.message || "capture refusée");
      }
    }
    if (failures.length) {
      const detail = failures[0];
      setImageError(
        failures.length === files.length
          ? detail || "Impossible d’ajouter ces captures. Essayez un JPG ou un PNG."
          : `${files.length - failures.length} ajoutée(s), ${failures.length} refusée(s) : ${detail}`,
      );
    }
  }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    const next = {};
    if (!name.trim()) next.name = "Le nom est obligatoire.";
    if (!pitch.trim()) next.pitch = "La description est obligatoire.";
    if (link.trim() && !validUrl(link.trim())) next.link = "Saisissez une URL complète valide.";
    if (appStore.trim() && !validUrl(appStore.trim())) next.appStore = "Saisissez une URL App Store valide.";
    if (playStore.trim() && !validUrl(playStore.trim())) next.playStore = "Saisissez une URL Google Play valide.";
    if (!tags.length) next.tags = "Choisissez au moins une catégorie.";
    else if (tags.length > MAX_TAGS) next.tags = `Maximum ${MAX_TAGS} catégories.`;
    if (socials.length > 6) next.socials = "Vous pouvez indiquer jusqu’à 6 réseaux.";
    const filledSocials = socials.filter((social) => social.platform || social.url.trim());
    if (!filledSocials.length) next.socials = "Ajoutez au moins 1 réseau avec un lien valide.";
    const selected = socials.map((social) => social.platform).filter(Boolean);
    if (new Set(selected).size !== selected.length) next.socials = "Chaque réseau doit être unique.";
    socials.forEach((social, index) => {
      const empty = !social.platform && !social.url.trim();
      if (empty) return;
      if (!social.platform) next[`social-platform-${index}`] = "Choisissez un réseau.";
      if (!validUrl(social.url)) next[`social-url-${index}`] = "URL complète invalide.";
    });
    if (!instructions.length) next.instructions = "Ajoutez au moins une consigne.";
    instructions.forEach((instruction, index) => {
      if (!instruction.title.trim()) next[`instruction-title-${index}`] = "Titre obligatoire.";
      if (!instruction.text.trim()) next[`instruction-text-${index}`] = "Texte obligatoire.";
    });
    if (logo && !isHostedMedia(logo)) next.logo = "Attendez la fin de l’envoi du logo (ou réessayez).";
    if (screens.some((src) => src && !isHostedMedia(src))) next.screens = "Attendez la fin de l’envoi des captures (ou réessayez).";
    setErrors(next);
    setStorageError("");
    setSaveStatus("");
    if (Object.keys(next).length) return;
    const nextTags = tags.slice(0, MAX_TAGS);
    try {
      writeAccount({
        ...readAccount(),
        projectName: name.trim(),
        projectPitch: pitch.trim(),
        projectLink: link.trim(),
        projectAppStore: appStore.trim(),
        projectPlayStore: playStore.trim(),
        tags: nextTags,
        category: nextTags[0] || "",
        projectLogo: logo,
        projectScreens: screens,
        projectSocials: socials
          .filter((item) => item.platform && validUrl(item.url))
          .map((item) => ({ platform: item.platform, url: item.url.trim() })),
        projectInstructions: instructions.map((item) => ({ title: item.title.trim(), text: item.text.trim() })),
        projectSteps: instructions.map((item) => item.text.trim()).join("\n\n"),
      });
      if (paid) {
        if (!getToken) {
          navigate("login", { from: "entrepreneur" });
          return;
        }
        setBusy(true);
        setSaveStatus("Mise à jour de la campagne…");
        const payload = campaignPayload(readAccount());
        payload.logo = isHostedMedia(payload.logo) ? payload.logo : "";
        payload.screenshots = (payload.screenshots || []).filter((src) => isHostedMedia(src));
        payload.cover = payload.screenshots[0] || payload.logo || "";
        await publishCampaign(getToken, payload);
        setSaveStatus("Modifications enregistrées.");
        navigate("results", {}, true);
        return;
      }
      navigate(readAccount().offerLabel ? "payment" : "offer");
    } catch (error) {
      if (error?.name === "QuotaExceededError" || error?.code === 22) {
        setStorageError("Stockage local saturé. Supprimez des captures ou choisissez des images plus légères.");
      } else if (paid) {
        setStorageError(error?.message || "Impossible de mettre à jour la campagne en ligne.");
      } else {
        setStorageError("Impossible d’enregistrer la campagne sur cet appareil.");
      }
    } finally {
      setBusy(false);
      setSaveStatus("");
    }
  }

  const ctaLabel = paid
    ? "Enregistrer les modifications"
    : readAccount().offerLabel
      ? "Enregistrer et payer"
      : "Enregistrer et choisir une offre";

  return (
    <PageShell pageRef={pageRef}>
      <form className="v2-stack v2-business-form" onSubmit={save} noValidate>
        <BackButton onClick={back} />
        <div>
          <h1>Créer ou modifier <span className="v2-accent">ma campagne</span></h1>
          <p className="v2-muted">
            {paid
              ? "Ajustez photos, liens et consignes. Votre créneau est déjà payé — aucun nouveau paiement."
              : "Ces informations composent la page visible par les testeurs."}
          </p>
        </div>
        <Card>
          <SectionTitle title="Identité du projet" />
          <Field label="Nom du projet" error={errors.name}>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Description" error={errors.pitch}>
            <textarea rows={3} value={pitch} onChange={(event) => setPitch(event.target.value)} />
          </Field>
          <div className="v2-field">
            <span>Catégories ({tags.length}/{MAX_TAGS})</span>
            <div className="v2-pills v2-pills--wrap" role="group" aria-label="Catégories du projet">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={tags.includes(item) ? "is-on" : ""}
                  aria-pressed={tags.includes(item)}
                  disabled={!tags.includes(item) && tags.length >= MAX_TAGS}
                  onClick={() => toggleTag(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            {errors.tags ? <small role="alert">{errors.tags}</small> : null}
          </div>
        </Card>
        <Card>
          <SectionTitle
            icon="↗"
            title="Accéder au produit"
            description="Les testeurs ouvrent votre produit depuis ces liens (comme sur la page campagne)."
          />
          <Field label="Site web" error={errors.link}>
            <input type="url" placeholder="https://" value={link} onChange={(event) => setLink(event.target.value)} />
          </Field>
          <Field label="App Store" error={errors.appStore}>
            <input type="url" placeholder="https://apps.apple.com/…" value={appStore} onChange={(event) => setAppStore(event.target.value)} />
          </Field>
          <Field label="Google Play" error={errors.playStore}>
            <input type="url" placeholder="https://play.google.com/…" value={playStore} onChange={(event) => setPlayStore(event.target.value)} />
          </Field>
        </Card>
        <Card><SectionTitle title="Visuels" description="Logo entier et jusqu’à 6 captures. JPG, PNG, WebP ou photo iPhone." /><div className="v2-logo-editor">{logo ? <img src={logo} alt="Aperçu du logo" /> : <span className="v2-logo-placeholder">Logo</span>}<div><Button type="button" variant="outline" onClick={() => logoInput.current?.click()}>{logo ? "Remplacer" : "Ajouter un logo"}</Button>{logo ? <button type="button" className="v2-text-button" onClick={() => setLogo("")}>Supprimer</button> : null}</div></div><input ref={logoInput} className="v2-hidden-input" type="file" accept="image/*,.heic,.heif" onChange={chooseLogo} /><div className="v2-capture-list">{screens.map((src, index) => <figure key={`${src.slice(-24)}-${index}`}><img src={src} alt={`Capture ${index + 1}`} /><button type="button" onClick={() => setScreens((current) => current.filter((_, position) => position !== index))} aria-label={`Supprimer la capture ${index + 1}`}>×</button></figure>)}</div><Button type="button" variant="outline" disabled={screens.length >= 6} onClick={() => screenInput.current?.click()}>Ajouter des captures ({screens.length}/6)</Button><input ref={screenInput} className="v2-hidden-input" type="file" accept="image/*,.heic,.heif" multiple onChange={chooseScreens} />{imageError ? <p className="v2-error" role="alert">{imageError}</p> : null}{errors.logo ? <p className="v2-error" role="alert">{errors.logo}</p> : null}{errors.screens ? <p className="v2-error" role="alert">{errors.screens}</p> : null}</Card>
        <Card><SectionTitle title="Réseaux sociaux" description="Au moins 1 réseau avec une URL réelle ; les autres sont facultatifs (max. 6)." /><div className="v2-repeat-list">{socials.map((social, index) => <fieldset key={index}><legend>Réseau {index + 1}</legend><label className="v2-field"><span>Plateforme</span><select value={social.platform} onChange={(event) => setSocials((current) => current.map((item, position) => position === index ? { ...item, platform: event.target.value } : item))}><option value="">Choisir</option>{networks.map((network) => <option key={network} disabled={socials.some((item, position) => position !== index && item.platform === network)}>{network}</option>)}</select>{errors[`social-platform-${index}`] ? <small>{errors[`social-platform-${index}`]}</small> : null}</label><Field label="URL" error={errors[`social-url-${index}`]}><input type="url" placeholder="https://" value={social.url} onChange={(event) => setSocials((current) => current.map((item, position) => position === index ? { ...item, url: event.target.value } : item))} /></Field><button type="button" className="v2-text-button" onClick={() => setSocials((current) => current.filter((_, position) => position !== index))}>Supprimer</button></fieldset>)}</div>{errors.socials ? <p className="v2-error" role="alert">{errors.socials}</p> : null}<Button type="button" variant="outline" disabled={socials.length >= 6} onClick={() => setSocials((current) => [...current, emptySocial()])}>Ajouter un réseau</Button></Card>
        <Card><SectionTitle title="Consignes" description="Chaque consigne contient un titre et un texte." /><div className="v2-repeat-list">{instructions.map((instruction, index) => <fieldset key={index}><legend>Consigne {index + 1}</legend><Field label="Titre" error={errors[`instruction-title-${index}`]}><input value={instruction.title} onChange={(event) => setInstructions((current) => current.map((item, position) => position === index ? { ...item, title: event.target.value } : item))} /></Field><Field label="Texte" error={errors[`instruction-text-${index}`]}><textarea rows={3} value={instruction.text} onChange={(event) => setInstructions((current) => current.map((item, position) => position === index ? { ...item, text: event.target.value } : item))} /></Field><button type="button" className="v2-text-button" onClick={() => setInstructions((current) => current.filter((_, position) => position !== index))}>Supprimer</button></fieldset>)}</div>{errors.instructions ? <p className="v2-error">{errors.instructions}</p> : null}<Button type="button" variant="outline" onClick={() => setInstructions((current) => [...current, emptyInstruction()])}>Ajouter une consigne</Button></Card>
        {storageError ? <p className="v2-info" role="alert">{storageError}</p> : null}
        {saveStatus ? <p className="v2-helper" role="status">{saveStatus}</p> : null}
        <Button type="submit" disabled={busy}>
          {busy ? (saveStatus || "Enregistrement…") : ctaLabel}
          {busy ? null : <span aria-hidden="true"> →</span>}
        </Button>
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
  const savedDate = isIsoDate(account.offerDate) && account.offerDate >= today ? account.offerDate : "";
  const [date, setDate] = useState(savedDate || firstOpen);
  const [pickOther, setPickOther] = useState(() => Boolean(savedDate && !days.some((day) => day.value === savedDate)));
  const customSelected = pickOther && isIsoDate(date) && !days.some((day) => day.value === date);
  const chosenAvailable = slotAvailable(date, offerLabel, catalog, ignoreId, today);
  const dateInputValue = isIsoDate(date) ? date : "";
  function choose(index) {
    const offer = offers[index];
    setSelectedIndex(index);
    apply({ offer });
  }
  function chooseDate(value, fromList = false) {
    if (!isIsoDate(value)) return;
    setDate(value);
    apply({ date: value });
    if (fromList) setPickOther(false);
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack">
        <BackButton onClick={back} /><div><h1>Choisir <span className="v2-accent">une offre</span></h1><p className="v2-muted">Voyez les tarifs, choisissez un créneau, puis décrivez votre projet.</p></div><ProjectSummary account={account} />
        <Card><SectionTitle icon="◷" title="1. Choisir une offre" description="Sélectionnez un créneau disponible." /><div className="v2-offer-list" role="radiogroup" aria-label="Offres de campagne">{offers.map((offer, index) => <button key={offer.label} type="button" role="radio" aria-checked={selectedIndex === index} className={selectedIndex === index ? "is-selected" : ""} onClick={() => choose(index)}><span><strong>{offer.label}</strong><small>{offer.range}</small></span><b>{formatOfferPrice(offer, isNativeIos())}</b><i aria-hidden="true" /></button>)}</div></Card>
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
                onClick={() => chooseDate(day.value, true)}
              >
                <span>{day.label}</span>
                <em className={day.available ? "is-open" : "is-full"}>{day.available ? "Disponible" : "Complet"}</em>
              </button>
            ))}
          </div>
          {pickOther ? (
            <>
              <Field label="Indiquez le jour souhaité">
                <input
                  type="date"
                  min={today}
                  value={dateInputValue}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (!isIsoDate(next)) return;
                    setPickOther(true);
                    chooseDate(next);
                  }}
                />
              </Field>
              {customSelected ? (
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
        <Card className="v2-offer-summary"><ProjectSummary account={account} /><p><strong>{selected?.label || "Offre à choisir"}</strong> · {selected ? formatOfferPrice(selected, isNativeIos()) : "—"}<br />{formattedDate(date)}{date ? ` · ${chosenAvailable ? "Disponible" : "Complet"}` : ""}</p><p className="v2-info">Vous pouvez modifier le jour, la période ou annuler jusqu’à 72 h avant le début, depuis votre compte.</p>{date && !chosenAvailable ? <p className="v2-info" role="status">Ce créneau est complet. Choisissez un autre jour.</p> : null}<Button type="button" disabled={!selected || !date || !chosenAvailable} onClick={() => { apply({ date }); navigate(hasProjectDraft(account) ? "payment" : "entrepreneur"); }}>{hasProjectDraft(account) ? "Continuer vers le paiement" : "Continuer et décrire le projet"} <span aria-hidden="true">→</span></Button></Card>
      </main>
    </PageShell>
  );
}

function campaignPayload(account) {
  const tags = account.tags?.length ? account.tags : account.category ? [account.category] : [];
  return {
    name: account.projectName,
    pitch: account.projectPitch,
    description: account.projectPitch,
    tags,
    logo: account.projectLogo,
    cover: account.projectScreens?.[0] || account.projectLogo,
    screenshots: account.projectScreens || [],
    website: account.projectLink,
    appStore: account.projectAppStore || "",
    playStore: account.projectPlayStore || "",
    productLinks: buildProductLinks(account),
    socials: mapSocials(account.projectSocials || []),
    instructions: (account.projectInstructions || [])
      .map((item) => ({
        title: String(item?.title || "").trim(),
        detail: String(item?.text || item?.detail || "").trim(),
      }))
      .filter((item) => item.title || item.detail),
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
  const [status, setStatus] = useState("");
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
    setStatus("Préparation du paiement…");
    try {
      const next = readAccount();
      const payload = campaignPayload(next);
      // Ne jamais bloquer le paiement sur l’upload : seulement les URLs déjà hébergées.
      payload.logo = isHostedMedia(payload.logo) ? payload.logo : "";
      payload.screenshots = (payload.screenshots || []).filter((src) => isHostedMedia(src));
      payload.cover = payload.screenshots[0] || payload.logo || "";
      const common = {
        ...payload,
        offerLabel: next.offerLabel,
        offerRange: next.offerRange,
        offerPrice: next.offerPrice,
        offerDate: next.offerDate,
        email: user.primaryEmailAddress?.emailAddress || "",
      };
      if (isNativeIos()) {
        // Feuille native StoreKit (cadenas Apple), pas de redirection web.
        setStatus("Réservation du créneau…");
        const prepared = await startAppleCheckout(getToken, common);
        if (!prepared.productId) throw new Error("Offre Apple introuvable.");
        setStatus("Ouverture du paiement Apple…");
        const purchase = await purchaseAppleProduct(prepared.productId);
        setStatus("Confirmation du paiement…");
        const result = await confirmAppleCheckout(getToken, {
          bookingRef: prepared.bookingRef,
          productId: prepared.productId,
          transactionId: purchase.transactionId,
          jws: purchase.jws,
          payload: purchase.payload,
        });
        if (!result.paid) throw new Error("Achat Apple introuvable.");
        if (purchase.transactionId) await finishAppleProduct(purchase.transactionId);
        writeAccount({
          ...readAccount(),
          campaignPaid: true,
          campaignId: result.campaignId,
          offerLabel: result.offerLabel || next.offerLabel,
          offerPrice: result.offerPrice || next.offerPrice,
          offerDate: result.offerDate || next.offerDate,
        });
        try {
          await requestCampaignConfirmMail(getToken, common.email);
        } catch {
          /* l’écran confirmation retente */
        }
        navigate("confirmation", {}, true);
        return;
      }
      setStatus("Ouverture de Stripe…");
      const checkout = await startCheckout(getToken, common);
      if (!checkout.url) throw new Error("Impossible d’ouvrir Stripe.");
      window.location.href = checkout.url;
    } catch (payError) {
      setError(payError.message || "Impossible d’ouvrir le paiement.");
    } finally {
      setBusy(false);
      setStatus("");
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
          <div className="v2-total"><span>{account.offerLabel}</span><b>{formatStoredOfferPrice(account.offerPrice, isNativeIos())}</b></div>
          <div className="v2-total"><strong>Total à payer</strong><strong>{formatStoredOfferPrice(account.offerPrice, isNativeIos())}</strong></div>
        </Card>
        <p className="v2-info">Votre créneau sera confirmé après validation du paiement.</p>
        {payMode && !payMode.livemode && !isNativeIos() ? (
          <p className="v2-info" role="status">Paiement de test Stripe. Aucune carte réelle n’est débitée.</p>
        ) : null}
        {status ? <p className="v2-helper" role="status">{status}</p> : null}
        {error ? <p className="v2-error" role="alert">{error}</p> : null}
        <Button type="button" disabled={busy} onClick={confirm}>
          {busy ? (status || "Paiement…") : isNativeIos() ? `Payer ${formatStoredOfferPrice(account.offerPrice, true)}` : `Payer ${account.offerPrice} € avec Stripe`}
          {busy || isNativeIos() ? null : <span aria-hidden="true"> ↗</span>}
        </Button>
        <p className="v2-helper"><span aria-hidden="true">🔒 </span>{isNativeIos() ? "Sur iPhone, Apple affiche sa propre fenêtre de paiement (pas de redirection web)." : "Paiement sécurisé sur la page Stripe."}</p>
      </main>
    </PageShell>
  );
}

export function ConfirmationScreen(props) {
  return clerkKey ? <ConfirmationAuthed {...props} /> : <ConfirmationBody {...props} getToken={null} email="" />;
}

function ConfirmationAuthed(props) {
  const { getToken } = useAuth();
  const { user } = useUser();
  return (
    <ConfirmationBody
      {...props}
      getToken={getToken}
      email={user?.primaryEmailAddress?.emailAddress || ""}
    />
  );
}

function ConfirmationBody({ navigate, pageRef, getToken, email = "" }) {
  const [account, setAccount] = useState(readAccount);
  const slot = campaignWindow(account);
  const [receipt, setReceipt] = useState(false);
  const [ready, setReady] = useState(hasPaidCampaign);
  const [payMode, setPayMode] = useState(null);
  const [mailStatus, setMailStatus] = useState("");
  const [mailBusy, setMailBusy] = useState(false);
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
  async function sendConfirmMail() {
    if (!getToken || mailBusy) return;
    setMailBusy(true);
    setMailStatus("Envoi de l’e-mail de confirmation…");
    try {
      const result = await requestCampaignConfirmMail(getToken, email, true);
      setMailStatus(
        result.sent
          ? `Confirmation envoyée${email ? ` à ${email}` : ""}. Vérifiez aussi les indésirables.`
          : "E-mail déjà traité. Vérifiez vos indésirables, ou réessayez dans une minute.",
      );
    } catch (error) {
      setMailStatus(error.message || "Envoi impossible pour le moment.");
    } finally {
      setMailBusy(false);
    }
  }
  useEffect(() => {
    if (!ready || !getToken) return;
    sendConfirmMail();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- un envoi au chargement de la confirmation
  }, [ready, getToken, email]);
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
              <dd>{formatStoredOfferPrice(account.offerPrice, isNativeIos())} payés</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <SectionTitle icon="▦" title="Campagne programmée" />
          <ul className="v2-check-list">
            <li>Nous vérifierons les liens et les consignes avant sa mise en ligne.</li>
            <li>Retrouvez votre campagne et vos résultats dans votre espace.</li>
          </ul>
          {mailStatus ? <p className="v2-helper" role="status">{mailStatus}</p> : null}
          <Button type="button" onClick={() => navigate("results", {}, true)}>Voir ma campagne <span aria-hidden="true">→</span></Button>
          <Button type="button" variant="outline" onClick={() => setReceipt(true)}>Voir mon reçu</Button>
          <Button type="button" variant="outline" disabled={mailBusy} onClick={sendConfirmMail}>
            {mailBusy ? "Envoi…" : "Renvoyer l’e-mail de confirmation"}
          </Button>
        </Card>
        {receipt ? (
          <Card>
            <SectionTitle title="Reçu" />
            <p className="v2-review-copy">{account.projectName || "Votre projet"} · {account.offerLabel} · {formatStoredOfferPrice(account.offerPrice, isNativeIos())} payés · {slot.range}</p>
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
