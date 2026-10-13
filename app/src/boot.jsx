import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { frFR } from "@clerk/localizations";
import { App } from "./App.jsx";
import { AppV2 } from "./v2/AppV2.jsx";
import "./styles.css";

if (new URLSearchParams(window.location.search).get("ecran") === "besoin") {
  window.location.replace(`${window.location.origin}/besoin/`);
}

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const RootApp = new URLSearchParams(window.location.search).get("v1") === "1" ? App : AppV2;
const clerkOrigins = [...new Set([
  window.location.origin,
  "https://gemelo.online",
  "https://www.gemelo.online",
])];

if ("serviceWorker" in navigator) {
  const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register);
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      {clerkKey ? (
        <ClerkProvider
          publishableKey={clerkKey}
          localization={frFR}
          afterSignOutUrl="/?ecran=login"
          allowedRedirectOrigins={clerkOrigins}
        >
          <RootApp />
        </ClerkProvider>
      ) : (
        <RootApp />
      )}
    </StrictMode>
  );
}
