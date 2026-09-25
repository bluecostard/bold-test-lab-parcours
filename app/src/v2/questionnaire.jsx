import { useEffect, useState } from "react";
import { BackButton, Button, Card, Field, Header, PageShell, ProjectIdentity, SectionTitle, Tags } from "./primitives.jsx";
import { readV2State, updateV2State } from "./state.js";

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

export function ReportFormScreen({ campaign, navigate, back, pageRef }) {
  const saved = draftOf(campaign.id);
  const [hadBug, setHadBug] = useState(saved.hadBug ?? "Oui");
  const [screen, setScreen] = useState(saved.screen || "");
  const [bugText, setBugText] = useState(saved.bugText || "");
  const [repro, setRepro] = useState(saved.repro || "");
  const [expectedObserved, setExpectedObserved] = useState(saved.expectedObserved || "");
  const [photoName, setPhotoName] = useState(saved.photoName || "");
  const [photoUrl, setPhotoUrl] = useState(saved.photoUrl || "");
  const [videoName, setVideoName] = useState(saved.videoName || "");
  const [battery, setBattery] = useState(saved.battery || "");
  const [designScore, setDesignScore] = useState(saved.designScore || 0);
  const [designWhy, setDesignWhy] = useState(saved.designWhy || "");
  const [journeyScore, setJourneyScore] = useState(saved.journeyScore || 0);
  const [journeyWhy, setJourneyWhy] = useState(saved.journeyWhy || "");
  const [error, setError] = useState("");

  useEffect(() => {
    saveDraft(campaign.id, { hadBug, screen, bugText, repro, expectedObserved, photoName, photoUrl, videoName, battery, designScore, designWhy, journeyScore, journeyWhy });
  }, [battery, bugText, campaign.id, designScore, designWhy, expectedObserved, hadBug, journeyScore, journeyWhy, photoName, photoUrl, repro, screen, videoName]);

  function pickFile(event, kind) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (kind === "photo") {
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onload = () => setPhotoUrl(String(reader.result));
      reader.readAsDataURL(file);
    } else setVideoName(file.name);
  }

  function complete() {
    if (hadBug === "Oui" && (!screen || bugText.trim().length < 8 || repro.trim().length < 8 || expectedObserved.trim().length < 8)) {
      return setError("Complétez les champs du bug avant de continuer.");
    }
    if (campaign.kind === "app" && !battery) return setError("Indiquez la consommation de batterie.");
    if (!designScore || !journeyScore) return setError("Donnez une note Design et une note Parcours.");
    setError("");
    navigate("report-check", { campaignId: campaign.id });
  }

  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack v2-form-wide">
        <Header />
        <BackButton onClick={back} />
        <div>
          <h1>Compte rendu de test — {campaign.name}</h1>
          <p className="v2-muted">Étape 2 sur 3 · Problèmes et expérience</p>
          <div className="v2-progress" aria-hidden="true"><i /><i /><b /></div>
        </div>
        <Card>
          <SectionTitle icon="◎" title="Bug rencontré ?" description="Avez-vous rencontré un bug ou un comportement anormal pendant votre test ?" />
          <fieldset className="v2-choice"><legend className="v2-sr">Bug rencontré</legend>{["Oui", "Non"].map((option) => <label key={option}><input type="radio" name="bug" checked={hadBug === option} onChange={() => setHadBug(option)} /> {option}</label>)}</fieldset>
        </Card>
        {hadBug === "Oui" ? (
          <>
            <label className="v2-field"><span>Sur quel écran ? *</span><select value={screen} onChange={(event) => setScreen(event.target.value)}><option value="">Choisir</option>{(campaign.appScreens || []).map((item) => <option key={item}>{item}</option>)}</select></label>
            <Field label="Décrivez précisément le bug *"><textarea rows={4} maxLength={500} value={bugText} onChange={(event) => setBugText(event.target.value)} /></Field>
            <p className="v2-count">{bugText.length} / 500</p>
            <Field label="Comment le reproduire ? *"><textarea rows={4} maxLength={500} value={repro} onChange={(event) => setRepro(event.target.value)} placeholder={"1. …\n2. …"} /></Field>
            <p className="v2-count">{repro.length} / 500</p>
            <Field label="Résultat attendu / résultat obtenu *"><textarea rows={4} maxLength={500} value={expectedObserved} onChange={(event) => setExpectedObserved(event.target.value)} /></Field>
            <p className="v2-count">{expectedObserved.length} / 500</p>
          </>
        ) : null}
        <div className="v2-upload-grid v2-upload-grid--wide">
          <label className="v2-upload">{photoUrl ? <img src={photoUrl} alt="" /> : <span aria-hidden="true">▣</span>}<strong>Ajouter une capture</strong><small>PNG, JPG (max 10 Mo)</small><input type="file" accept="image/*" onChange={(event) => pickFile(event, "photo")} /></label>
          <label className="v2-upload"><span aria-hidden="true">▶</span><strong>Ajouter une vidéo</strong><small>{videoName || "MP4, MOV (max 100 Mo)"}</small><input type="file" accept="video/*" onChange={(event) => pickFile(event, "video")} /></label>
        </div>
        {campaign.kind === "app" ? (
          <Card>
            <SectionTitle icon="🔋" title="Batterie" description="L’application consomme-t-elle beaucoup de batterie ?" action={<span className="v2-wait-chip">Question uniquement pour les applications mobiles</span>} />
            <fieldset className="v2-choice v2-choice--wrap"><legend className="v2-sr">Batterie</legend>{batteryOptions.map((option) => <label key={option}><input type="radio" name="battery" checked={battery === option} onChange={() => setBattery(option)} /> {option}</label>)}</fieldset>
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
        <Button type="button" onClick={complete}>Continuer <span aria-hidden="true">→</span></Button>
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

export function ReportCheckScreen({ campaign, navigate, back, pageRef }) {
  const review = readV2State().reviewDrafts[campaign.id] || {};
  const [report, setReport] = useState(() => draftOf(campaign.id));
  const parts = splitExpected(report.expectedObserved || "");
  const [expectedFill, setExpectedFill] = useState(parts.expected);
  const noBug = report.hadBug === "Non";
  const items = noBug
    ? [
      { ok: true, label: "Écran concerné", detail: "Sans objet" },
      { ok: true, label: "Étapes pour reproduire", detail: "Sans objet" },
      { ok: true, label: "Résultat obtenu", detail: "Sans objet" },
      { ok: true, label: "Résultat attendu", detail: "Sans objet" },
    ]
    : [
      { ok: Boolean(report.screen), label: "Écran concerné", detail: report.screen || "À compléter", field: "screen" },
      { ok: Boolean(report.repro?.trim()), label: "Étapes pour reproduire", detail: report.repro?.trim() ? "3 étapes décrites" : "À compléter", field: "repro" },
      { ok: Boolean(parts.observed || report.expectedObserved), label: "Résultat obtenu", detail: parts.observed || report.expectedObserved || "À compléter", field: "observed" },
      { ok: Boolean(expectedFill.trim()), label: "Résultat attendu", detail: expectedFill.trim() || "À compléter", field: "expected" },
    ];
  const firstGap = items.find((item) => !item.ok);
  const ready = items.every((item) => item.ok);

  function persistExpected(value) {
    setExpectedFill(value);
    const next = { ...report, expectedObserved: `Attendu : ${value}\nObtenu : ${parts.observed || report.expectedObserved || ""}` };
    setReport(next);
    saveDraft(campaign.id, next);
  }

  function publish() {
    if (!ready) return;
    updateV2State((state) => ({
      ...state,
      publishedReviews: {
        ...state.publishedReviews,
        [campaign.id]: { ...review, ...report, expectedFill, author: "Vous", publishedAt: new Date().toISOString(), likes: 0 },
      },
    }));
    navigate("review-published", { campaignId: campaign.id }, true);
  }

  return (
    <PageShell pageRef={pageRef}>
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
          {!noBug ? <p className="v2-muted">Écran concerné · {report.screen || "—"}</p> : null}
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
          {firstGap?.field === "expected" ? (
            <Field label="Que deviez-vous voir après avoir appuyé ? *">
              <textarea rows={3} maxLength={500} value={expectedFill} onChange={(event) => persistExpected(event.target.value)} />
            </Field>
          ) : null}
        </Card>
        <div className="v2-upload-grid v2-upload-grid--wide">
          <div className="v2-upload">{report.photoUrl || review.photoUrl ? <img src={report.photoUrl || review.photoUrl} alt="" /> : <span>Capture</span>}</div>
          <label className="v2-upload is-dashed"><span aria-hidden="true">▶</span><strong>Ajouter une vidéo</strong><small>Optionnel</small><input type="file" accept="video/*" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const next = { ...report, videoName: file.name }; setReport(next); saveDraft(campaign.id, next); }} /></label>
        </div>
        <p className="v2-info">Un compte rendu complet aide l’entrepreneur même si vous ne revenez pas répondre plus tard.</p>
        <Button type="button" disabled={!ready} onClick={publish}>Compléter et publier</Button>
        <Button type="button" variant="outline" onClick={() => navigate("campaign", { campaignId: campaign.id })}>Enregistrer le brouillon</Button>
      </main>
    </PageShell>
  );
}
