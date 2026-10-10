import { useEffect, useState } from "react";
import { offers } from "./data.js";
import { Button, Card, Field, PageShell } from "./primitives.jsx";

const STORAGE_KEY = "gemelo-smoke-v1";

function persistLead({ email, offer, price }) {
  const at = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, offer, price, date: at }));
  } catch {
    /* quota / mode privé */
  }
  const url = import.meta.env.VITE_SMOKE_FORM_URL;
  if (!url) return;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, offer, price, at }),
  }).catch(() => {});
}

export function SmokeScreen({ navigate, pageRef, interceptBack }) {
  const [step, setStep] = useState("offers");
  const [selected, setSelected] = useState(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!interceptBack) return undefined;
    interceptBack.current = () => {
      if (step !== "offers") {
        setStep("offers");
        return true;
      }
      return false;
    };
    return () => {
      interceptBack.current = null;
    };
  }, [interceptBack, step]);

  function chooseOffer(offer) {
    setSelected(offer);
    setStep("email");
  }

  function submit(event) {
    event.preventDefault();
    const value = email.trim();
    if (!value || !selected) return;
    persistLead({ email: value, offer: selected.label, price: selected.price });
    setStep("thanks");
  }

  function enterGemelo() {
    const url = new URL(window.location.href);
    if (url.searchParams.get("ecran") === "besoin") {
      url.searchParams.delete("ecran");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
    navigate("discover");
  }

  return (
    <PageShell pageRef={pageRef}>
      <section className="v2-login">
        <img className="v2-login-logo" src="/logo-gemelo.png" alt="Gemelo" />
        {step === "offers" ? (
          <>
            <div className="v2-login-copy">
              <h1>Avant de lancer, voyez si on le veut</h1>
              <p className="v2-muted">Gemelo montre votre service à de vrais testeurs. Choisissez un créneau. Aucun nombre de réponses n’est garanti.</p>
            </div>
            <div className="v2-offer-list" role="radiogroup" aria-label="Offres de campagne">
              {offers.map((offer) => (
                <button key={offer.label} type="button" role="radio" aria-checked="false" onClick={() => chooseOffer(offer)}>
                  <span>
                    <strong>{offer.label}</strong>
                    <small>{offer.range}</small>
                  </span>
                  <b>{offer.price} €</b>
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <Card className="v2-login-reset">
            {step === "thanks" ? (
              <>
                <h1>C’est noté.</h1>
                <button type="button" className="v2-text-button" onClick={enterGemelo}>Entrer dans Gemelo</button>
              </>
            ) : (
              <>
                <h1>Vous nous avez pris trop tôt</h1>
                <p className="v2-muted">Laissez votre e-mail. On vous écrit quand ce créneau ouvre.</p>
                {selected ? (
                  <div className="v2-offer-list" role="radiogroup" aria-label="Offre choisie">
                    <button type="button" role="radio" aria-checked="true" className="is-selected">
                      <span>
                        <strong>{selected.label}</strong>
                        <small>{selected.range}</small>
                      </span>
                      <b>{selected.price} €</b>
                      <i aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
                <form className="v2-smoke-form" onSubmit={submit}>
                  <Field label="Adresse e-mail">
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
                  </Field>
                  <Button type="submit">Prévenez-moi</Button>
                </form>
              </>
            )}
          </Card>
        )}
      </section>
    </PageShell>
  );
}
