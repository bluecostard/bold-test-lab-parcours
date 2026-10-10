import { useState } from "react";
import { useClerk, useUser } from "@clerk/react";
import { readAccount, writeAccount } from "../screens/account.js";
import { hasConfirmedAge } from "./age.js";
import { legalPages } from "./legal.js";
import { clearGemeloStorage, readBlockedAuthors, readV2State, unblockAuthor } from "./state.js";
import { BackButton, Button, Field, FlowHeader, PageShell } from "./primitives.jsx";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function slim(value) {
  if (typeof value === "string" && value.startsWith("data:")) return "[média local]";
  if (Array.isArray(value)) return value.map(slim);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, slim(entry)]));
  }
  return value;
}

function exportLocalData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    ageConfirmed: hasConfirmedAge(),
    account: slim(readAccount()),
    state: slim(readV2State()),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "gemelo-mes-donnees.json";
  link.click();
  URL.revokeObjectURL(url);
}

const menuItems = [
  { id: "cgv", label: "Conditions générales" },
  { id: "cgu", label: "CGU" },
  { id: "donnees", label: "Confidentialité" },
  { id: "mentions", label: "Mentions légales" },
  { id: "regles", label: "Règles de la communauté" },
  { id: "contact", label: "Contact" },
];

function BlockedAuthorsCard() {
  const [list, setList] = useState(readBlockedAuthors);
  if (!list.length) return null;
  return (
    <div className="v2-delete-account">
      <h2>Auteurs bloqués</h2>
      <p>Leurs avis sont masqués sur cet appareil.</p>
      <ul className="v2-settings-links">
        {list.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              onClick={() => {
                unblockAuthor(person.id);
                setList(readBlockedAuthors());
              }}
            >
              Débloquer {person.name}
              <span aria-hidden="true">→</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeleteAccountCard({ navigate }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [step, setStep] = useState("idle");
  const [error, setError] = useState("");

  async function remove() {
    setError("");
    setStep("working");
    try {
      if (user) await user.delete();
    } catch (caught) {
      setStep("confirm");
      setError(caught?.errors?.[0]?.longMessage || caught?.message || "La suppression du compte Clerk a échoué.");
      return;
    }
    clearGemeloStorage();
    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      navigate("discover");
    }
  }

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="v2-delete-account">
      <h2>Supprimer mon compte</h2>
      <p>Efface les données locales de cet appareil et ferme le compte Clerk. Cette action est définitive. La même démarche est décrite sur <a className="v2-inline-link" href="/supprimer/">gemelo.online/supprimer/</a>.</p>
      {step === "idle" ? (
        <Button type="button" variant="outline" onClick={() => setStep("confirm")}>Supprimer mon compte</Button>
      ) : null}
      {step === "confirm" || step === "working" ? (
        <>
          <p className="v2-helper" role="status">Confirmez la suppression. Vous serez déconnecté.</p>
          <Button type="button" disabled={step === "working"} onClick={remove}>
            {step === "working" ? "Suppression…" : "Oui, supprimer définitivement"}
          </Button>
          <Button type="button" variant="outline" disabled={step === "working"} onClick={() => { setStep("idle"); setError(""); }}>
            Annuler
          </Button>
        </>
      ) : null}
      {error ? <p className="v2-helper" role="alert">{error}</p> : null}
    </div>
  );
}

export function SettingsScreen({ back, pageRef, navigate, openDrawer }) {
  const [page, setPage] = useState("menu");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactError, setContactError] = useState("");
  const account = readAccount();

  function goMenu() {
    setPage("menu");
    setSent(false);
    setSending(false);
    setContactError("");
  }

  if (page === "contact") {
    return (
      <PageShell pageRef={pageRef}>
        <FlowHeader navigate={navigate} openDrawer={openDrawer} />
        <main className="v2-stack v2-settings">
          <BackButton onClick={goMenu} />
          <h1>Contact</h1>
          <form
            className="v2-contact-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const name = String(data.get("name") || "").trim();
              const email = String(data.get("email") || "").trim();
              const message = String(data.get("message") || "").trim();
              writeAccount({
                ...readAccount(),
                contactName: name,
                contactEmail: email,
                contactMessage: message,
              });
              setSending(true);
              setContactError("");
              setSent(false);
              try {
                const response = await fetch("/api/contact", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name, email, message, website: data.get("website") || "" }),
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload.error || "Envoi impossible.");
                setSent(true);
              } catch (error) {
                setContactError(error.message || "Envoi impossible pour le moment.");
              } finally {
                setSending(false);
              }
            }}
          >
            <label className="v2-sr">
              Site web
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <Field label="Nom">
              <input name="name" defaultValue={account.contactName || ""} required />
            </Field>
            <Field label="E-mail">
              <input name="email" type="email" defaultValue={account.contactEmail || ""} required />
            </Field>
            <Field label="Message">
              <textarea name="message" rows={5} defaultValue={account.contactMessage || ""} required />
            </Field>
            <Button type="submit" disabled={sending}>{sending ? "Envoi…" : "Envoyer"}</Button>
            {sent ? <p className="v2-helper" role="status">Message envoyé.</p> : null}
            {contactError ? <p className="v2-helper" role="alert">{contactError}</p> : null}
            <p><a className="v2-inline-link" href="/contact/">Ouvrir la page publique</a></p>
          </form>
        </main>
      </PageShell>
    );
  }

  if (legalPages[page]) {
    const item = legalPages[page];
    return (
      <PageShell pageRef={pageRef}>
        <FlowHeader navigate={navigate} openDrawer={openDrawer} />
        <main className="v2-stack v2-legal">
          <BackButton onClick={goMenu} />
          <h1>{item.title}</h1>
          {item.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <p><a className="v2-inline-link" href={item.path}>Ouvrir la page publique</a></p>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell pageRef={pageRef}>
      <FlowHeader navigate={navigate} openDrawer={openDrawer} />
      <main className="v2-stack v2-settings">
        <BackButton onClick={back} />
        <h1>Réglages</h1>
        <ul className="v2-settings-links">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => setPage(item.id)}>
                {item.label}
                <span aria-hidden="true">→</span>
              </button>
            </li>
          ))}
        </ul>
        <BlockedAuthorsCard />
        <div className="v2-delete-account">
          <h2>Mes données</h2>
          <p>Téléchargez une copie des informations Gemelo enregistrées sur cet appareil.</p>
          <Button type="button" variant="outline" onClick={exportLocalData}>Télécharger mes données</Button>
        </div>
        {clerkKey ? <DeleteAccountCard navigate={navigate} /> : (
          <div className="v2-delete-account">
            <h2>Supprimer mon compte</h2>
            <p>Efface les données Gemelo enregistrées dans ce navigateur.</p>
            <Button type="button" variant="outline" onClick={() => { clearGemeloStorage(); navigate("discover"); }}>
              Effacer cet appareil
            </Button>
          </div>
        )}
      </main>
    </PageShell>
  );
}
