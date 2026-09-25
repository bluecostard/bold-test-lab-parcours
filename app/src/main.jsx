import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { frFR } from "@clerk/localizations";
import { App } from "./App.jsx";
import { AppV2 } from "./v2/AppV2.jsx";
import "./styles.css";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const RootApp = new URLSearchParams(window.location.search).get("v1") === "1" ? App : AppV2;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {clerkKey ? (
      <ClerkProvider publishableKey={clerkKey} localization={frFR} afterSignOutUrl="/">
        <RootApp />
      </ClerkProvider>
    ) : (
      <RootApp />
    )}
  </StrictMode>
);
