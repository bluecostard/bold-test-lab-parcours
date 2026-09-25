import { useState } from "react";
import { readAccount, writeAccount } from "../screens/account.js";
import { BackButton, Button, Field, PageShell } from "./primitives.jsx";

const pages = {
  cgv: {
    title: "CGV",
    body: [
      "Les campagnes payantes sont proposées par créneau : 19 €, 39 €, 55 €, 65 €, 49 €, 109 € ou 149 € selon la durée.",
      "Le paiement Stripe n’est pas branché. Le bouton de paiement reste une simulation.",
      "Aucune offre ne garantit un nombre de tests ou d’avis positifs.",
    ],
  },
  cgu: {
    title: "CGU",
    body: [
      "Gemelo sert à tester une campagne entrepreneur, puis à publier un avis sur cette campagne uniquement.",
      "Un testeur ne peut pas aimer son propre avis. Les likes augmentent les points du classement des 30 derniers jours.",
      "Répondre à une question facultative ne modifie ni l’avis ni les points.",
    ],
  },
  donnees: {
    title: "Traitement des données",
    body: [
      "Le texte d’avis, la photo, le projet et l’offre choisie restent enregistrés dans ce navigateur.",
      "La connexion Clerk, lorsqu’elle est configurée, transmet le nom et l’e-mail au service Clerk.",
      "Aucun paiement réel n’est transmis.",
    ],
  },
};

const menuItems = [
  { id: "cgv", label: "CGV" },
  { id: "cgu", label: "CGU" },
  { id: "donnees", label: "Traitement des données" },
  { id: "contact", label: "Contact" },
];

export function SettingsScreen({ back, pageRef }) {
  const [page, setPage] = useState("menu");
  const [sent, setSent] = useState(false);
  const account = readAccount();

  function goMenu() {
    setPage("menu");
    setSent(false);
  }

  if (page === "contact") {
    return (
      <PageShell pageRef={pageRef}>
        <main className="v2-stack v2-settings">
          <BackButton onClick={goMenu} />
          <h1>Contact</h1>
          <form
            className="v2-contact-form"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              writeAccount({
                ...readAccount(),
                contactName: String(data.get("name") || "").trim(),
                contactEmail: String(data.get("email") || "").trim(),
                contactMessage: String(data.get("message") || "").trim(),
              });
              setSent(true);
            }}
          >
            <Field label="Nom">
              <input name="name" defaultValue={account.contactName || ""} required />
            </Field>
            <Field label="E-mail">
              <input name="email" type="email" defaultValue={account.contactEmail || ""} required />
            </Field>
            <Field label="Message">
              <textarea name="message" rows={5} defaultValue={account.contactMessage || ""} required />
            </Field>
            <Button type="submit">Envoyer</Button>
            {sent ? <p className="v2-helper" role="status">Message enregistré sur cet appareil.</p> : null}
          </form>
        </main>
      </PageShell>
    );
  }

  if (pages[page]) {
    return (
      <PageShell pageRef={pageRef}>
        <main className="v2-stack v2-legal">
          <BackButton onClick={goMenu} />
          <h1>{pages[page].title}</h1>
          {pages[page].body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell pageRef={pageRef}>
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
      </main>
    </PageShell>
  );
}
