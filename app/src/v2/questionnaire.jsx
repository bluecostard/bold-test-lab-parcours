import { useAuth, useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { BackButton, Button, Card, Field, FlowHeader, PageShell, ProjectIdentity, SectionTitle, Tags } from "./primitives.jsx";
import { forgetFile, hostPending, isHostedMedia, rememberFile, uploadMedia } from "./mediaApi.js";
import { publishReview } from "./reviewsApi.js";
import { readProfile, readPublicPseudo, readV2State, updateV2State } from "./state.js";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const batteryOptions = ["Non", "Un peu", "Beaucoup", "Je ne sais pas"];

function draftOf(campaignId) {
  return readV2State().reportDrafts[campaignId] || {};
}

function saveDraft(campaignId, patch) {
  updateV2State((state) => ({
    ...state,
    reportDrafts: { ...state.reportDrafts, [campaignId]: { ...draftOf(campaignId), ...patch } },
  }));
}

function splitExpected(value) {
  if (!value) return { expected: "", observed: "" };
  const match = value.match(/attendu\s*:\s*([\s\S]*?)(?:obtenu\s*:|$)/i);
  const obtained = value.match(/obtenu\s*:\s*([\s\S]*)$/i);
  if (match || obtained) {
    return { expected: (match?.[1] || "").trim(), observed: (obtained?.[1] || "").trim() };
  }
  return { expected: "", observed: value.trim() };
}

function deriveExpectedObserved(expected, observed) {
  if (!expected.trim() && !observed.trim()) return "";
  return `Attendu : ${expected.trim()}\nObtenu : ${observed.trim()}`;
}

export function ReportFormScreen(props) {
  return clerkKey ? <ReportFormClerk {...props} /> : <ReportFormBody {...props} signedIn />;
}

function ReportFormClerk(props) {
  const { isSignedIn } = useUser();
  return <ReportFormBody {...props} signedIn={Boolean(isSignedIn)} />;
}

function ReportFormBody({ campaign, navigate, back, pageRef, signedIn, openDrawer }) {
  const saved = draftOf(campaign.id);
  const split = splitExpected(saved.expectedObserved || "");
  const [hadBug, setHadBug] = useState(saved.hadBug ?? "Oui");
  const [screen, setScreen] = useState(saved.screen || "");
  const [bugText, setBugText] = useState(saved.bugText || "");
  const [repro, setRepro] = useState(saved.repro || "");
  const [observed, setObserved] = useState(saved.observed || split.observed);
  const [expected, setExpected] = useState(saved.expected || split.expected);
  const [battery, setBattery] = useState(saved.battery || "");
  const [designScore, setDesignScore] = useState(saved.designScore || 0);
  const [designWhy, setDesignWhy] = useState(saved.designWhy || "");
  const [journeyScore, setJourneyScore] = useState(saved.journeyScore || 0);
  const [journeyWhy, setJourneyWhy] = useState(saved.journeyWhy || "");
  const [error, setError] = useState("");

  useEffect(() => {
    saveDraft(campaign.id, {
      hadBug,
      screen,
      bugText,
      repro,
      observed,
      expected,
      expectedObserved: deriveExpectedObserved(expected, observed),
      battery,
      designScore,
      designWhy,
      journeyScore,
      journeyWhy,
    });
  }, [battery, bugText, campaign.id, designScore, designWhy, expected, hadBug, journeyScore, journeyWhy, observed, repro, screen]);

  function validate() {
    if (hadBug === "Oui" && (!screen || bugText.trim().length < 8 || repro.trim().length < 8 || observed.trim().length < 8 || expected.trim().length < 8)) {
      setError("Complétez les champs du problème avant de continuer.");
      return false;
    }
    if (campaign.kind === "app" && !battery) {
      setError("Indiquez la consommation de batterie.");
      return false;
    }
    if (!designScore || !journeyScore) {
      setError("Donnez une note Design et une note Parcours.");
      return false;
    }
    setError("");
    return true;
  }

  function continueReport() {
    if (!validate()) return;
    navigate("report-check", { campaignId: campaign.id });
  }

  return (
    <PageShell pageRef={pageRef}>
      <FlowHeader navigate={navigate} openDrawer={openDrawer} />
      <main className="v2-stack v2-form-wide">
        <BackButton onClick={back} />
        <Card>
          <SectionTitle icon="◎" title="Bug rencontré ?" description="Avez-vous rencontré un bug ou un comportement anormal pendant votre test ?" />
          <fieldset className="v2-choice"><legend className="v2-sr">Bug rencontré</legend>{["Oui", "Non"].map((option) => <label key={option}><input type="radio" name="bug" checked={hadBug === option} onChange={() => setHadBug(option)} /> {option}</label>)}</fieldset>
        </Card>
        {hadBug === "Oui" ? (
          <>
            <label className="v2-field"><span>Sur quel écran ? *</span><select value={screen} onChange={(event) => setScreen(event.target.value)}><option value="">Choisir</option>{(campaign.appScreens || []).map((item) => <option key={item}>{item}</option>)}</select></label>
            <Field label="Décrivez précisément le bug *"><textarea rows={4} maxLength={500} value={bugText} onChange={(event) => setBugText(event.target.value)} /></Field>
            <p className="v2-count">{bugText.length} / 500</p>
            <Field label="Que faut-il faire pour revoir le problème ? *" hint="Les gestes, dans l’ordre.">
              <textarea rows={4} maxLength={500} value={repro} onChange={(event) => setRepro(event.target.value)} placeholder={"1. …\n2. …"} />
            </Field>
            <p className="v2-count">{repro.length} / 500</p>
            <Field label="Que se passe-t-il ? *"><textarea rows={4} maxLength={500} value={observed} onChange={(event) => setObserved(event.target.value)} /></Field>
            <p className="v2-count">{observed.length} / 500</p>
            <Field label="Que devrait-il se passer ? *"><textarea rows={4} maxLength={500} value={expected} onChange={(event) => setExpected(event.target.value)} /></Field>
            <p className="v2-count">{expected.length} / 500</p>
          </>
        ) : null}
        {campaign.kind === "app" ? (
          <Card className="v2-battery-card">
            <SectionTitle icon="🔋" title="Batterie" description="L’application consomme-t-elle beaucoup de batterie ?" />
            <p className="v2-wait-chip v2-wait-chip--block">Question uniquement pour les applications mobiles</p>
            <fieldset className="v2-choice v2-choice--grid"><legend className="v2-sr">Batterie</legend>{batteryOptions.map((option) => <label key={option}><input type="radio" name="battery" checked={battery === option} onChange={() => setBattery(option)} /> {option}</label>)}</fieldset>
          </Card>
        ) : null}
        <Card>
          <SectionTitle icon="★" title="Vos notes" description={`Donnez vos impressions globales sur votre expérience de ${campaign.name}.`} />
          <StarRow label="Design visuel" hint="L’esthétique, la clarté et la lisibilité." value={designScore} onChange={setDesignScore} />
          <Field label="Pourquoi cette note ? (optionnel)"><textarea rows={3} maxLength={500} value={designWhy} onChange={(event) => setDesignWhy(event.target.value)} /></Field>
          <StarRow label="Logique du parcours" hint="La facilité à se repérer, la fluidité." value={journeyScore} onChange={setJourneyScore} />
          <Field label="Pourquoi cette note ? (optionnel)"><textarea rows={3} maxLength={500} value={journeyWhy} onChange={(event) => setJourneyWhy(event.target.value)} /></Field>
        </Card>
        {error ? <p className="v2-error" role="alert">{error}</p> : null}
        <Button type="button" onClick={continueReport}>Continuer <span aria-hidden="true">→</span></Button>
        {/* 05 vient après ce bouton */}
      </main>
    </PageShell>
  );
}

function StarRow({ label, hint, value, onChange }) {
  return (
    <div className="v2-stars">
      <p><strong>{label}</strong><span>{hint}</span></p>
      <div role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button key={score} type="button" role="radio" aria-checked={value === score} className={score <= value ? "is-on" : ""} onClick={() => onChange(score)} aria-label={`${score} sur 5`}>★</button>
        ))}
      </div>
    </div>
  );
}

export function ReportCheckScreen(props) {
  return clerkKey ? <ReportCheckClerk {...props} /> : <ReportCheckBody {...props} signedIn />;
}

function ReportCheckClerk(props) {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  return <ReportCheckBody {...props} signedIn={Boolean(isSignedIn)} getToken={getToken} user={user} />;
}

function proofPhotos(review) {
  if (review.photos?.length) return review.photos.filter((photo) => photo.url);
  if (review.photoUrl) return [{ name: review.photoName || "capture", url: review.photoUrl }];
  return [];
}

function ReportCheckBody({ campaign, navigate, back, pageRef, signedIn, openDrawer, getToken, user }) {
  const review = readV2State().reviewDrafts[campaign.id] || {};
  const [report, setReport] = useState(() => draftOf(campaign.id));
  const [expectedFill, setExpectedFill] = useState(report.expected || splitExpected(report.expectedObserved || "").expected);
  const [observedFill, setObservedFill] = useState(report.observed || splitExpected(report.expectedObserved || "").observed);
  const [reproFill, setReproFill] = useState(report.repro || "");
  const [screenFill, setScreenFill] = useState(report.screen || "");
  const [videoName, setVideoName] = useState(report.videoName || review.videoName || "");
  const [videoUrl, setVideoUrl] = useState(isHostedMedia(report.videoUrl || review.videoUrl) ? (report.videoUrl || review.videoUrl) : "");
  const [videoBusy, setVideoBusy] = useState(false);
  const photos = proofPhotos(review);
  const [photoIndex, setPhotoIndex] = useState(0);
  const noBug = report.hadBug === "Non";
  const items = noBug
    ? [
      { ok: true, label: "Écran concerné", detail: "Sans objet" },
      { ok: true, label: "Étapes pour revoir le problème", detail: "Sans objet" },
      { ok: true, label: "Que se passe-t-il", detail: "Sans objet" },
      { ok: true, label: "Que devrait-il se passer", detail: "Sans objet" },
    ]
    : [
      { ok: Boolean(screenFill), label: "Écran concerné", detail: screenFill || "À compléter", field: "screen" },
      { ok: Boolean(reproFill.trim()), label: "Étapes pour revoir le problème", detail: reproFill.trim() || "À compléter", field: "repro" },
      { ok: Boolean(observedFill.trim()), label: "Que se passe-t-il", detail: observedFill.trim() || "À compléter", field: "observed" },
      { ok: Boolean(expectedFill.trim()), label: "Que devrait-il se passer", detail: expectedFill.trim() || "À compléter", field: "expected" },
    ];
  const firstGap = items.find((item) => !item.ok);
  const ready = items.every((item) => item.ok);
  const visiblePhoto = photos[Math.min(photoIndex, Math.max(0, photos.length - 1))];

  function persist(patch) {
    const next = {
      ...report,
      ...patch,
      expectedObserved: deriveExpectedObserved(patch.expected ?? expectedFill, patch.observed ?? observedFill),
    };
    setReport(next);
    saveDraft(campaign.id, next);
  }

  async function addVideo(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const key = `video-${file.size}-${Date.now()}`;
    rememberFile(key, file);
    setVideoName(file.name);
    setVideoBusy(true);
    persist({ videoName: file.name, videoKey: key });
    try {
      const uploaded = await uploadMedia(getToken, file, "video");
      forgetFile(key);
      setVideoName(uploaded.name);
      setVideoUrl(uploaded.url);
      persist({ videoName: uploaded.name, videoUrl: uploaded.url, videoKey: "" });
    } catch {
      persist({ videoName: file.name, videoKey: key });
    } finally {
      setVideoBusy(false);
    }
  }

  async function publish() {
    if (!ready) return;
    if (!signedIn) {
      navigate("login", { campaignId: campaign.id, from: "report-check" });
      return;
    }
    persist({ videoName, videoUrl });
    const hostedPhotos = [];
    for (const photo of photos) {
      try {
        const uploaded = await hostPending(getToken, photo, "image");
        if (uploaded?.url) hostedPhotos.push(uploaded);
      } catch {
        if (isHostedMedia(photo.url)) hostedPhotos.push({ name: photo.name, url: photo.url });
      }
    }
    let hostedVideo = isHostedMedia(videoUrl) ? videoUrl : "";
    let hostedVideoName = videoName;
    if (!hostedVideo && report.videoKey) {
      try {
        const uploaded = await hostPending(getToken, { key: report.videoKey, name: videoName }, "video");
        if (uploaded?.url) {
          hostedVideo = uploaded.url;
          hostedVideoName = uploaded.name;
        }
      } catch { /* la vidéo reste optionnelle */ }
    }
    const publishedAt = new Date().toISOString();
    const local = {
      ...review,
      ...draftOf(campaign.id),
      photos: hostedPhotos,
      photoUrl: hostedPhotos[0]?.url || "",
      screenshot: hostedPhotos[0]?.url || "",
      videoName: hostedVideoName,
      videoUrl: hostedVideo,
      author: "Vous",
      publishedAt,
      likes: 0,
    };
    updateV2State((state) => ({
      ...state,
      publishedReviews: {
        ...state.publishedReviews,
        [campaign.id]: local,
      },
    }));
    if (getToken) {
      try {
        const profile = readProfile();
        const saved = await publishReview(getToken, {
          campaignId: campaign.id,
          author: readPublicPseudo(user) || profile.name || "Testeur",
          photo: profile.avatar || "",
          title: "Mon retour d’expérience",
          text: review.text || report.bugText || "",
          body: review.text || report.bugText || "",
          photos: hostedPhotos,
          screenshot: hostedPhotos[0]?.url || "",
          videoUrl: hostedVideo,
          videoName: hostedVideoName,
          hadBug: report.hadBug || "",
          battery: report.battery || "",
          designScore: report.designScore || null,
          journeyScore: report.journeyScore || null,
          screen: report.screen || "",
          bugText: report.bugText || "",
        });
        navigate("review-published", { campaignId: campaign.id, reportId: saved.id }, true);
        return;
      } catch {
        /* l’avis reste aussi sur cet appareil */
      }
    }
    navigate("review-published", { campaignId: campaign.id, reportId: null }, true);
  }

  const gapField = {
    screen: (
      <label className="v2-field">
        <span>Sur quel écran ? *</span>
        <select value={screenFill} onChange={(event) => { setScreenFill(event.target.value); persist({ screen: event.target.value }); }}>
          <option value="">Choisir</option>
          {(campaign.appScreens || []).map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
    ),
    repro: (
      <Field label="Que faut-il faire pour revoir le problème ? *">
        <textarea rows={3} maxLength={500} value={reproFill} onChange={(event) => { setReproFill(event.target.value); persist({ repro: event.target.value }); }} />
      </Field>
    ),
    observed: (
      <Field label="Que se passe-t-il ? *">
        <textarea rows={3} maxLength={500} value={observedFill} onChange={(event) => { setObservedFill(event.target.value); persist({ observed: event.target.value }); }} />
      </Field>
    ),
    expected: (
      <Field label="Que devrait-il se passer ? *">
        <textarea rows={3} maxLength={500} value={expectedFill} onChange={(event) => { setExpectedFill(event.target.value); persist({ expected: event.target.value }); }} />
      </Field>
    ),
  };

  return (
    <PageShell pageRef={pageRef}>
      <FlowHeader navigate={navigate} openDrawer={openDrawer} />
      <main className="v2-stack v2-form-wide">
        <BackButton onClick={back} />
        <div>
          <h1>Vérifier mon <span className="v2-accent">compte rendu</span></h1>
          <p className="v2-muted">Avant publication</p>
        </div>
        <Card><ProjectIdentity campaign={campaign} /><Tags items={campaign.tags} /></Card>
        <Card>
          <SectionTitle icon="◎" title="Résumé du problème" action={<button type="button" className="v2-inline-link" onClick={() => navigate("report-form", { campaignId: campaign.id })}>✎ Modifier</button>} />
          <p className="v2-review-copy">{noBug ? "Aucun bug signalé" : report.bugText}</p>
          {!noBug ? <p className="v2-muted">Écran concerné · {screenFill || "—"}</p> : null}
        </Card>
        <Card>
          <SectionTitle icon="▤" title="Vérifier la complétude" description="Votre compte rendu doit contenir ces informations." />
          <ul className="v2-check-status">
            {items.map((item) => (
              <li key={item.label} className={item.ok ? "is-ok" : "is-gap"}>
                <b aria-hidden="true">{item.ok ? "✓" : "!"}</b>
                <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                <em>{item.ok ? "Complété" : "À compléter"}</em>
              </li>
            ))}
          </ul>
          {firstGap?.field ? gapField[firstGap.field] : null}
        </Card>
        <div className="v2-upload-grid v2-upload-grid--wide">
          <div className="v2-upload">
            {visiblePhoto ? (
              <button type="button" className="v2-phone-frame" aria-label="Voir la capture en grand" onClick={() => setPhotoIndex((index) => (index + 1) % Math.max(1, photos.length))}>
                <img src={visiblePhoto.url} alt="" />
              </button>
            ) : <span>Capture</span>}
          </div>
          <label className="v2-upload is-dashed">
            <span aria-hidden="true">▶</span>
            <strong>Ajouter une vidéo</strong>
            <small>{videoBusy ? "Envoi…" : videoName || "Optionnel"}</small>
            <input type="file" accept="video/*" onChange={addVideo} />
          </label>
        </div>
        <p className="v2-info">Un compte rendu complet aide l’entrepreneur même si vous ne revenez pas répondre plus tard.</p>
        <Button type="button" disabled={!ready || videoBusy} onClick={publish}>Compléter et publier</Button>
        <Button type="button" variant="outline" onClick={() => navigate("campaign", { campaignId: campaign.id })}>Enregistrer le brouillon</Button>
      </main>
    </PageShell>
  );
}
