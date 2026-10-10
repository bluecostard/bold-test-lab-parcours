import { useAuth } from "@clerk/react";
import { useEffect, useState } from "react";
import { campaigns } from "./data.js";
import { askQuestion, readQuestion } from "./questionsApi.js";
import { getReview } from "./reviewsApi.js";
import { BackButton, Button, Card, PageShell, ProjectIdentity, Tags } from "./primitives.jsx";
import { readV2State, updateV2State } from "./state.js";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function ReportDetailScreen(props) {
  return clerkKey ? <ReportDetailAuthed {...props} /> : <ReportDetailBody {...props} getToken={null} />;
}

function ReportDetailAuthed(props) {
  const { getToken } = useAuth();
  return <ReportDetailBody {...props} getToken={getToken} />;
}

function liveReport(review, campaign) {
  const text = review.body || review.text || "";
  return {
    id: review.id,
    title: review.title || text.slice(0, 80) || "Avis de testeur",
    screen: "Parcours",
    testers: 1,
    steps: campaign.instructions?.length ? campaign.instructions : ["Ouvrez le produit.", "Suivez les consignes.", "Notez ce qui bloque."],
    expected: "Le parcours se comprend et les consignes suffisent.",
    observed: text || "Le testeur a signalé un point à améliorer.",
    photo: review.screenshot || review.photos?.[0]?.url || campaign.screenshots?.[0] || campaign.cover || campaign.logo,
    defaultQuestion: "Pouvez-vous préciser ce point ?",
    live: true,
  };
}

export function ReportDetailBody({ navigate, pageRef, reportId, from, campaign: passed, campaignId, getToken }) {
  const campaign = passed && passed.id
    ? passed
    : campaigns.find((item) => item.id === campaignId) || {
      id: campaignId || "bed-hop",
      name: "Campagne",
      tags: [],
      logo: "/icon-app.png",
      website: "",
    };
  const [live, setLive] = useState(null);
  const [remoteQuestion, setRemoteQuestion] = useState(null);
  const [loaded, setLoaded] = useState(!reportId);
  useEffect(() => {
    if (!campaign.id || !reportId) return;
    Promise.all([
      getReview(campaign.id, reportId).then((review) => {
        setLive(review ? liveReport(review, campaign) : null);
      }).catch(() => setLive(null)),
      readQuestion(reportId).then(setRemoteQuestion).catch(() => setRemoteQuestion(null)),
    ]).finally(() => setLoaded(true));
  }, [campaign.id, reportId]);
  const report = live;
  const sent = readV2State().sentQuestions[campaign.id];
  const already = remoteQuestion || (report && sent?.reportId === report.id ? sent : null);
  const [question, setQuestion] = useState(already?.text || report?.defaultQuestion || "");
  const [sentOk, setSentOk] = useState(Boolean(already?.text));
  useEffect(() => {
    if (!already?.text) return;
    setQuestion(already.text);
    setSentOk(true);
  }, [already?.text]);
  function goBack() {
    navigate(from === "results" ? "results" : "report", {}, true);
  }
  async function sendQuestion() {
    const text = question.trim();
    if (!text) return;
    updateV2State((state) => ({
      ...state,
      sentQuestions: {
        ...state.sentQuestions,
        [campaign.id]: { text, sentAt: new Date().toISOString(), reportId: report.id, bugTitle: report.title },
      },
    }));
    setSentOk(true);
    if (getToken && report.live) {
      try {
        const saved = await askQuestion(getToken, {
          campaignId: campaign.id,
          reviewId: report.id,
          text,
          bugTitle: report.title,
        });
        setRemoteQuestion(saved);
      } catch {
        /* la question reste aussi sur cet appareil */
      }
    }
  }
  const answer = remoteQuestion?.answer;
  if (!loaded || !report) {
    return (
      <PageShell pageRef={pageRef}>
        <main className="v2-stack">
          <BackButton onClick={goBack} />
          <Card>
            <p className="v2-description">{loaded ? "Ce rapport est introuvable." : "Chargement…"}</p>
          </Card>
        </main>
      </PageShell>
    );
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack">
        <div className="v2-page-title">
          <BackButton onClick={goBack}>{""}</BackButton>
          <div>
            <h1>Détail du signalement</h1>
            <p className="v2-muted">{report.live ? "Campagne" : "Campagne payante"} · {campaign.name}</p>
          </div>
        </div>
        <Card>
          <ProjectIdentity campaign={campaign} linked />
          <Tags items={campaign.tags || []} />
        </Card>
        <Card className="v2-issue-head">
          <span className="v2-section-icon" aria-hidden="true">◎</span>
          <div>
            <h2>{report.title}</h2>
            <p>Écran {report.screen}</p>
          </div>
          <span className="v2-wait-chip">À vérifier</span>
        </Card>
        <div className="v2-issue-stats">
          <Card>
            <span aria-hidden="true">☰</span>
            <strong>{report.testers} signalement{report.testers > 1 ? "s" : ""} de testeur{report.testers > 1 ? "s" : ""} indépendant{report.testers > 1 ? "s" : ""}</strong>
          </Card>
          <Card>
            <span aria-hidden="true">▂</span>
            <strong>{report.live ? "Avis publié par un testeur connecté" : "Même problème confirmé sur plusieurs appareils"}</strong>
          </Card>
        </div>
        <Card>
          <h2 className="v2-block-title">Étapes pour reproduire</h2>
          <ol className="v2-steps">
            {report.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </Card>
        <div className="v2-outcome">
          <Card>
            <p className="v2-outcome-label is-ok">Résultat attendu</p>
            <p>{report.expected}</p>
          </Card>
          <Card>
            <p className="v2-outcome-label is-bad">Résultat observé</p>
            <p>{report.observed}</p>
          </Card>
        </div>
        <Card className="v2-proofs" id="preuves">
          <div className="v2-section-title">
            <div><h2>Preuves jointes</h2></div>
            <button type="button" className="v2-inline-link" onClick={() => document.getElementById("preuves")?.scrollIntoView({ behavior: "smooth", block: "start" })}>2 fichiers ›</button>
          </div>
          <div className="v2-proof-grid">
            <div className="v2-proof-frame">
              <img src={report.photo} alt={`Capture de l’écran ${report.screen}`} />
            </div>
            <div className="v2-proof-frame v2-proof-frame--video" aria-label="Vidéo non fournie">
              <span aria-hidden="true">▶</span>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="v2-block-title">Question facultative au testeur</h2>
          <label className="v2-field">
            <span className="v2-sr">Question au testeur</span>
            <textarea rows={3} maxLength={500} value={question} onChange={(event) => { setQuestion(event.target.value); setSentOk(false); }} />
          </label>
          <p className="v2-count">{question.length} / 500</p>
          <Button type="button" onClick={sendQuestion}>Envoyer la question <span aria-hidden="true">→</span></Button>
          {sentOk ? <p role="status" className="v2-helper">Question envoyée. Le testeur la verra sur son avis.</p> : null}
          {answer?.status === "skipped" ? <p className="v2-info">Réponse du testeur : Précision non obtenue.</p> : null}
          {answer?.status === "answered" ? <p className="v2-info">Réponse du testeur : {answer.choice}{answer.detail ? ` — ${answer.detail}` : ""}</p> : null}
          <p className="v2-helper">Le testeur peut répondre s’il le souhaite. Votre rapport restera disponible sans réponse.</p>
        </Card>
        <button type="button" className="v2-link-row v2-link-row--card" onClick={() => navigate("offer")}>
          <span aria-hidden="true">◎</span>
          <span>
            <strong>Lancer un test ciblé de ce problème</strong>
            <small>Obtenez plus de retours de testeurs sur ce point précis.</small>
          </span>
          <b aria-hidden="true">›</b>
        </button>
      </main>
    </PageShell>
  );
}
