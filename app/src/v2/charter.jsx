import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import {
  CHARTER_ACCEPTANCE_LABEL,
  CHARTER_DATA_NOTICE,
  CHARTER_TEST_REMINDER,
  CHARTER_VERSION,
} from "../../lib/charterMeta.js";
import { charterPdfHref, fetchCharterStatus, signCharter } from "./charterApi.js";
import { BackButton, Button, Card, FlowHeader, PageShell, SectionTitle } from "./primitives.jsx";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function emailVerified(user) {
  const status = user?.primaryEmailAddress?.verification?.status;
  if (status === "verified") return true;
  return Boolean(user?.emailAddresses?.some((item) => item?.verification?.status === "verified"));
}

/** Bandeau rappel dans chaque écran de test réservé. */
export function TestReserveReminder() {
  return (
    <p className="v2-info v2-charter-reminder" role="note">
      {CHARTER_TEST_REMINDER}
    </p>
  );
}

/**
 * Vérifie connexion + e-mail vérifié + charte avant un accès réservé.
 * À n’appeler que sous ClerkProvider (composant *Authed).
 */
export function useReservedAccess({ navigate, campaignId, from }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [status, setStatus] = useState({ loading: true, signed: false, error: "" });

  useEffect(() => {
    if (!isLoaded) return undefined;
    if (!isSignedIn) {
      setStatus({ loading: false, signed: false, error: "" });
      return undefined;
    }
    if (!emailVerified(user)) {
      setStatus({ loading: false, signed: false, error: "verify-email" });
      return undefined;
    }
    let cancelled = false;
    setStatus((current) => ({ ...current, loading: true }));
    fetchCharterStatus(getToken)
      .then((data) => {
        if (cancelled) return;
        setStatus({ loading: false, signed: Boolean(data.signed), error: "" });
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus({ loading: false, signed: false, error: error.message || "Erreur." });
      });
    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, user]);

  function requestAccess(nextFrom) {
    const targetFrom = nextFrom || from;
    if (!isLoaded) return false;
    if (!isSignedIn) {
      navigate("login", { campaignId, from: targetFrom || "charter" });
      return false;
    }
    if (!emailVerified(user)) {
      navigate("charter", { campaignId, from: targetFrom });
      return false;
    }
    if (status.loading) return false;
    if (!status.signed) {
      navigate("charter", { campaignId, from: targetFrom });
      return false;
    }
    return true;
  }

  return {
    loading: status.loading || !isLoaded,
    signed: status.signed,
    signedIn: Boolean(isSignedIn),
    emailOk: emailVerified(user),
    error: status.error,
    requestAccess,
    refresh: () => fetchCharterStatus(getToken).then((data) => {
      setStatus({ loading: false, signed: Boolean(data.signed), error: "" });
      return data;
    }),
  };
}

function CharterBody({ navigate, back, pageRef, openDrawer, campaignId, from }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [alreadySigned, setAlreadySigned] = useState(false);
  const verified = emailVerified(user);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !verified) return undefined;
    let cancelled = false;
    fetchCharterStatus(getToken)
      .then((data) => {
        if (cancelled) return;
        if (data.signed) setAlreadySigned(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, verified]);

  function continueAfterSign() {
    if (from === "review" && campaignId) navigate("review", { campaignId }, true);
    else if (from === "report-form" && campaignId) navigate("report-form", { campaignId }, true);
    else if (from === "report-check" && campaignId) navigate("report-check", { campaignId }, true);
    else if (campaignId) navigate("campaign", { campaignId }, true);
    else navigate("discover", {}, true);
  }

  async function onSign() {
    if (!accepted) {
      setError("Cochez la case pour accepter la charte.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signCharter(getToken);
      setAlreadySigned(true);
      continueAfterSign();
    } catch (err) {
      setError(err.message || "Signature impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoaded) {
    return (
      <PageShell pageRef={pageRef}>
        <FlowHeader navigate={navigate} openDrawer={openDrawer} />
        <main className="v2-stack">
          <p className="v2-muted">Chargement…</p>
        </main>
      </PageShell>
    );
  }

  if (!isSignedIn) {
    return (
      <PageShell pageRef={pageRef}>
        <FlowHeader navigate={navigate} openDrawer={openDrawer} />
        <main className="v2-stack v2-charter">
          <BackButton onClick={back} />
          <h1>Charte des testeurs</h1>
          <p className="v2-muted">Connectez-vous avec un e-mail vérifié pour lire et signer la charte, puis accéder aux tests réservés.</p>
          <Button type="button" onClick={() => navigate("login", { campaignId, from: "charter" })}>
            Se connecter <span aria-hidden="true">→</span>
          </Button>
          <p className="v2-helper">Sans signature, les informations publiques restent consultables.</p>
        </main>
      </PageShell>
    );
  }

  if (!verified) {
    return (
      <PageShell pageRef={pageRef}>
        <FlowHeader navigate={navigate} openDrawer={openDrawer} />
        <main className="v2-stack v2-charter">
          <BackButton onClick={back} />
          <h1>Vérifiez votre e-mail</h1>
          <p className="v2-muted">
            Un e-mail vérifié est requis avant de signer la charte. Ouvrez le message Clerk envoyé à{" "}
            <strong>{user?.primaryEmailAddress?.emailAddress || "votre adresse"}</strong>, puis revenez ici.
          </p>
          <Button type="button" onClick={() => window.location.reload()}>J’ai vérifié mon e-mail</Button>
          <p className="v2-helper">Sans signature, les informations publiques restent consultables.</p>
        </main>
      </PageShell>
    );
  }

  if (alreadySigned) {
    return (
      <PageShell pageRef={pageRef}>
        <FlowHeader navigate={navigate} openDrawer={openDrawer} />
        <main className="v2-stack v2-charter">
          <BackButton onClick={back} />
          <h1>Charte signée</h1>
          <p className="v2-muted">Vous avez déjà accepté la charte version {CHARTER_VERSION}. Les tests réservés vous sont accessibles.</p>
          <TestReserveReminder />
          <Button type="button" onClick={continueAfterSign}>Continuer <span aria-hidden="true">→</span></Button>
          <p><a className="v2-inline-link" href={charterPdfHref()} target="_blank" rel="noreferrer">Télécharger la charte (PDF)</a></p>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell pageRef={pageRef}>
      <FlowHeader navigate={navigate} openDrawer={openDrawer} />
      <main className="v2-stack v2-charter">
        <BackButton onClick={back} />
        <h1>Charte des testeurs</h1>
        <p className="v2-muted">Version {CHARTER_VERSION}. Lisez le document, puis acceptez pour accéder aux tests réservés.</p>

        <Card>
          <SectionTitle title="Document" description="Texte intégral téléchargeable." />
          <p>
            <a className="v2-inline-link" href={charterPdfHref()} download target="_blank" rel="noreferrer">
              Télécharger la charte PDF (v{CHARTER_VERSION})
            </a>
          </p>
          <p className="v2-helper">
            <a className="v2-inline-link" href="/confidentialite/" target="_blank" rel="noreferrer">Notice de protection des données</a>
          </p>
        </Card>

        <Card>
          <SectionTitle title="Protection des données" description="Ce qui est enregistré lors de la signature." />
          <p className="v2-muted">{CHARTER_DATA_NOTICE}</p>
        </Card>

        <label className="v2-consent">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => {
              setAccepted(event.target.checked);
              setError("");
            }}
          />
          <span>{CHARTER_ACCEPTANCE_LABEL}</span>
        </label>

        <Button type="button" disabled={!accepted || busy} onClick={onSign}>
          {busy ? "Enregistrement…" : "Signer et accéder aux tests"} <span aria-hidden="true">→</span>
        </Button>
        {error ? <p className="v2-error" role="alert">{error}</p> : null}
        <p className="v2-helper">
          En refusant, vous pouvez consulter les infos publiques. Les liens de test, avis et médias réservés restent bloqués.
        </p>
      </main>
    </PageShell>
  );
}

function CharterLocal({ navigate, back, pageRef, openDrawer, campaignId, from }) {
  return (
    <PageShell pageRef={pageRef}>
      <FlowHeader navigate={navigate} openDrawer={openDrawer} />
      <main className="v2-stack v2-charter">
        <BackButton onClick={back} />
        <h1>Charte des testeurs</h1>
        <p className="v2-muted">Configurez Clerk pour activer la signature serveur de la charte.</p>
        <p><a className="v2-inline-link" href={charterPdfHref()} target="_blank" rel="noreferrer">Télécharger la charte (PDF)</a></p>
        <Button type="button" onClick={() => (campaignId ? navigate("campaign", { campaignId }) : navigate("discover"))}>
          Continuer
        </Button>
      </main>
    </PageShell>
  );
}

export function CharterScreen(props) {
  if (!clerkKey) return <CharterLocal {...props} />;
  return <CharterBody {...props} />;
}
