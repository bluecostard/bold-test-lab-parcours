import { useState } from "react";
import { campaigns, demoReports } from "./data.js";
import { BackButton, Button, Card, PageShell, ProjectIdentity, Tags } from "./primitives.jsx";
import { readV2State, updateV2State } from "./state.js";

export function ReportDetailScreen({ navigate, pageRef, reportId, from }) {
  const campaign = campaigns[0];
  const report = demoReports.find((item) => item.id === reportId) || demoReports[0];
  const sent = readV2State().sentQuestions[campaign.id];
  const [question, setQuestion] = useState(sent?.reportId === report.id ? sent.text : report.defaultQuestion);
  const [sentOk, setSentOk] = useState(sent?.reportId === report.id);
  function goBack() {
    navigate(from === "results" ? "results" : "report", {}, true);
  }
  function sendQuestion() {
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
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack">
        <div className="v2-page-title">
          <BackButton onClick={goBack}>{""}</BackButton>
          <div>
            <h1>Détail du signalement</h1>
            <p className="v2-muted">Campagne payante · {campaign.name}</p>
          </div>
        </div>
        <Card>
          <ProjectIdentity campaign={campaign} linked />
          <Tags items={campaign.tags} />
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
            <strong>{report.testers} signalements de testeurs indépendants</strong>
          </Card>
          <Card>
            <span aria-hidden="true">▂</span>
            <strong>Même problème confirmé sur plusieurs appareils</strong>
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
