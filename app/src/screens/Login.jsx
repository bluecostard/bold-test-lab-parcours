import { useEffect } from "react";
import { SignIn, useUser } from "@clerk/react";

export const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const appearance = {
  variables: {
    colorPrimary: "#d6ff4a",
    colorBackground: "#10243a",
    colorText: "#f4f7fb",
    colorInputBackground: "#07111c",
    colorInputText: "#f4f7fb",
    colorNeutral: "#d5e2ef",
    borderRadius: "16px",
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif",
  },
  elements: {
    card: { background: "#10243a", boxShadow: "none", width: "100%" },
    formButtonPrimary: { background: "#d6ff4a", color: "#142000", fontWeight: 800 },
    footerActionLink: { color: "#d6ff4a" },
    socialButtonsBlockButton: { background: "#07111c", color: "#f4f7fb", border: "0" },
    formFieldInput: { background: "#07111c", color: "#f4f7fb" },
    headerTitle: { color: "#ffffff" },
    headerSubtitle: { color: "#9aafc4" },
  },
};

function LoginShell({ onOpen, children }) {
  return (
    <section className="login">
      <button type="button" className="login-back" onClick={() => onOpen(6)}>
        Retour
      </button>
      <img className="login-logo" src="/logo-gemelo.png" alt="Gemelo" />
      {children}
    </section>
  );
}

function ClerkLogin({ onOpen }) {
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) onOpen(11);
  }, [isSignedIn, onOpen]);

  return (
    <LoginShell onOpen={onOpen}>
      <SignIn routing="hash" appearance={appearance} />
    </LoginShell>
  );
}

export function Login({ onOpen }) {
  if (!clerkKey) {
    return (
      <LoginShell onOpen={onOpen}>
        <p className="login-missing">La clé Clerk n’est pas encore enregistrée sur Gemelo.</p>
      </LoginShell>
    );
  }
  return <ClerkLogin onOpen={onOpen} />;
}
