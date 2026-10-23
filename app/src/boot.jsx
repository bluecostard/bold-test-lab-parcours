import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { frFR } from "@clerk/localizations/fr-FR";
import "./styles.css";

if (new URLSearchParams(window.location.search).get("ecran") === "besoin") {
  window.location.replace(`${window.location.origin}/besoin/`);
}

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const search = new URLSearchParams(window.location.search);
const useV1 = search.get("v1") === "1";
const isNativeApp = search.get("app") === "1";
const loginPath = isNativeApp ? "/?app=1&ecran=login" : "/?ecran=login";
const clerkOrigins = [...new Set([
  window.location.origin,
  "https://gemelo.online",
  "https://www.gemelo.online",
  "https://accounts.gemelo.online",
  "https://clerk.gemelo.online",
])];

/** App v1 rarement utilisée — hors du chemin critique v2. */
const RootApp = lazy(() => (
  useV1
    ? import("./App.jsx").then((m) => ({ default: m.App }))
    : import("./v2/AppV2.jsx").then((m) => ({ default: m.AppV2 }))
));

if ("serviceWorker" in navigator) {
  const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register);
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      {/* fallback null : le splash HTML (#boot-splash) reste visible */}
      <Suspense fallback={null}>
        {clerkKey ? (
          <ClerkProvider
            publishableKey={clerkKey}
            localization={frFR}
            signInUrl={loginPath}
            signUpUrl={loginPath}
            signInFallbackRedirectUrl={loginPath}
            signUpFallbackRedirectUrl={loginPath}
            afterSignOutUrl={loginPath}
            allowedRedirectOrigins={clerkOrigins}
          >
            <RootApp />
          </ClerkProvider>
        ) : (
          <RootApp />
        )}
      </Suspense>
    </StrictMode>
  );
}
