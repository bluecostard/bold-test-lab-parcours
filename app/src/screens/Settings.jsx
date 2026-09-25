import { useState } from "react";
import { useClerk, useUser } from "@clerk/react";
import { Menu } from "./Menu.jsx";
import { clerkKey } from "./Login.jsx";
import { readAccount, writeAccount } from "./account.js";

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
      "Gemelo sert à tester des applis, des sites et des services, puis à publier un avis.",
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

function SettingsBody({ onOpen, signedIn, onLogout }) {
  const [page, setPage] = useState("menu");
  const [sent, setSent] = useState(false);
  const account = readAccount();

  if (page === "contact") {
    return (
      <section className="flow">
        <button type="button" className="login-back" onClick={() => setPage("menu")}>Retour</button>
        <h1>Contact</h1>
        <form
          className="flow-form"
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
          <label>
            Nom
            <input name="name" defaultValue={account.contactName || ""} required />
          </label>
          <label>
            E-mail
            <input name="email" type="email" defaultValue={account.contactEmail || ""} required />
          </label>
          <label>
            Message
            <textarea name="message" defaultValue={account.contactMessage || ""} required />
          </label>
          <button type="submit" className="home-cta">Envoyer</button>
          {sent ? <p>Message enregistré sur cet appareil.</p> : null}
        </form>
        <Menu screen={11} onOpen={onOpen} />
      </section>
    );
  }

  if (pages[page]) {
    return (
      <section className="flow">
        <button type="button" className="login-back" onClick={() => setPage("menu")}>Retour</button>
        <h1>{pages[page].title}</h1>
        {pages[page].body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <Menu screen={11} onOpen={onOpen} />
      </section>
    );
  }

  return (
    <section className="flow">
      <button type="button" className="login-back" onClick={() => onOpen(11)}>Retour</button>
      <h1>Réglages</h1>
      <ul className="flow-links">
        <li><button type="button" onClick={() => setPage("cgv")}>CGV</button></li>
        <li><button type="button" onClick={() => setPage("cgu")}>CGU</button></li>
        <li><button type="button" onClick={() => setPage("donnees")}>Traitement des données</button></li>
        <li><button type="button" onClick={() => setPage("contact")}>Contact</button></li>
        <li>
          <button type="button" onClick={() => (signedIn ? onLogout() : onOpen("login"))}>
            {signedIn ? "Déconnexion" : "Connexion"}
          </button>
        </li>
      </ul>
      <Menu screen={11} onOpen={onOpen} />
    </section>
  );
}

function ClerkSettings(props) {
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();
  return <SettingsBody {...props} signedIn={!!isSignedIn} onLogout={() => signOut().then(() => props.onOpen(1))} />;
}

export function Settings(props) {
  if (!clerkKey) {
    const signedIn = Boolean(readAccount().user);
    return (
      <SettingsBody
        {...props}
        signedIn={signedIn}
        onLogout={() => {
          writeAccount({ ...readAccount(), user: null });
          props.onOpen(1);
        }}
      />
    );
  }
  return <ClerkSettings {...props} />;
}
