import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { browseProjects } from "./data.js";
import { useCampaignCatalog } from "./catalog.js";
import { setStorageScope } from "./state.js";
import { SideDrawer } from "./chrome.jsx";
import { Button, PageShell } from "./primitives.jsx";
import { confirmAge, hasConfirmedAge } from "./age.js";
import { ExploreScreen } from "./explore.jsx";
import { MessagesScreen } from "./messages.jsx";
import { ReportCheckScreen, ReportFormScreen } from "./questionnaire.jsx";
import {
  CampaignScreen,
  CommunityScreen,
  DiscoverScreen,
  LoginScreen,
  OptionalQuestionScreen,
  ProfileScreen,
  PublishedReviewScreen,
  RankingScreen,
  ReviewFormScreen,
  TesterProjectScreen,
} from "./screens.jsx";
import { ReportDetailScreen } from "./report-detail.jsx";
import { SettingsScreen } from "./settings.jsx";
import {
  ConfirmationScreen,
  EntrepreneurFormScreen,
  OfferScreen,
  PaymentScreen,
  ReportScreen,
  ResultsScreen,
} from "./entrepreneur.jsx";
import { SmokeScreen } from "./smoke.jsx";
import "./v2.css";

const swipeIgnore = "input, textarea, .v2-screenshot-rail, .v2-project-rail, .v2-screenshot-viewer, .v2-pitch-viewer, .v2-drawer";
const homePlace = { screen: "discover", campaignId: null, reportId: null, from: null };
const topScroll = { scrollY: 0, railLeft: 0 };
const EDGE_PX = 48;
const SWIPE_DX = 56;

function isClerkAuthHash() {
  return /^#\/(verify|sign-up|sign-in|factor|continue|sso-callback|oauth)/i.test(window.location.hash);
}

function MissingScreen({ navigate }) {
  return (
    <PageShell>
      <main className="v2-stack">
        <h1>Page introuvable</h1>
        <p className="v2-muted">Cette adresse n’existe pas dans Gemelo.</p>
        <Button type="button" onClick={() => navigate("discover")}>Retour à l’accueil</Button>
        <p><a className="v2-inline-link" href="/introuvable/">Ouvrir la page publique</a></p>
      </main>
    </PageShell>
  );
}

function AgeGate({ onConfirm }) {
  const [ok, setOk] = useState(false);
  return (
    <PageShell>
      <main className="v2-stack v2-age">
        <h1>16 ans et plus</h1>
        <p className="v2-muted">Gemelo publie des avis, des photos et des vidéos. Le service est réservé aux personnes de 16 ans et plus.</p>
        <p className="v2-muted">Clerk dépose un cookie de connexion. Gemelo n’utilise pas de publicité tierce.</p>
        <label className="v2-consent">
          <input type="checkbox" checked={ok} onChange={(event) => setOk(event.target.checked)} />
          J’ai au moins 16 ans
        </label>
        <Button type="button" disabled={!ok} onClick={onConfirm}>Continuer</Button>
        <p><a className="v2-inline-link" href="/confidentialite/">Confidentialité</a></p>
      </main>
    </PageShell>
  );
}

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ClerkStorageScope({ children }) {
  const { isLoaded, user } = useUser();
  const scope = isLoaded ? (user?.id || "guest") : "pending";
  if (scope !== "pending") setStorageScope(scope);
  if (scope === "pending") {
    return (
      <PageShell>
        <main className="v2-stack">
          <p className="v2-muted">Chargement…</p>
        </main>
      </PageShell>
    );
  }
  return <div key={scope} style={{ display: "contents" }}>{children}</div>;
}

function placeOnly(entry) {
  if (!entry) return homePlace;
  return {
    screen: entry.screen,
    campaignId: entry.campaignId ?? null,
    reportId: entry.reportId ?? null,
    from: entry.from ?? null,
  };
}

function captureScroll() {
  const rail = document.querySelector(".v2-project-rail");
  return {
    scrollY: window.scrollY,
    railLeft: rail ? rail.scrollLeft : 0,
  };
}

function restoreScroll(position = topScroll) {
  window.scrollTo(0, position.scrollY || 0);
  const rail = document.querySelector(".v2-project-rail");
  if (rail) rail.scrollLeft = position.railLeft || 0;
}

export function AppV2() {
  const [ageOk, setAgeOk] = useState(hasConfirmedAge);
  const [place, setPlace] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("ecran");
    if (requested === "profile" || requested === "confirmation" || requested === "offer" || requested === "payment" || requested === "besoin") {
      return { ...homePlace, screen: requested };
    }
    if (isClerkAuthHash()) return { ...homePlace, screen: "login" };
    return homePlace;
  });
  const [drawer, setDrawer] = useState(false);
  const history = useRef([]);
  const pageRef = useRef(null);
  const interceptBack = useRef(null);
  const backRef = useRef(() => {});
  const pendingScroll = useRef(topScroll);
  const placeRef = useRef(place);
  placeRef.current = place;

  function show(next, scroll = topScroll) {
    pendingScroll.current = scroll;
    setPlace(next);
    setDrawer(false);
  }

  function navigate(screen, params = {}, replace = false) {
    if (screen === "discover") {
      history.current = [];
      show(homePlace);
      try {
        window.history.replaceState({ gemelo: true, screen: "discover" }, "");
      } catch {
        /* ignore */
      }
      return;
    }
    const saved = captureScroll();
    let pushed = false;
    setPlace((current) => {
      const next = {
        screen,
        campaignId: "campaignId" in params ? params.campaignId : current.campaignId,
        reportId: "reportId" in params ? params.reportId : current.reportId,
        from: "from" in params ? params.from : current.from,
      };
      const moved = current.screen !== next.screen || current.campaignId !== next.campaignId || current.reportId !== next.reportId;
      if (!replace && moved) {
        history.current.push({ ...current, ...saved });
        pushed = true;
      }
      return next;
    });
    try {
      if (replace) window.history.replaceState({ gemelo: true, screen }, "");
      else if (pushed) window.history.pushState({ gemelo: true, screen }, "");
    } catch {
      /* ignore */
    }
    pendingScroll.current = topScroll;
    setDrawer(false);
  }

  function applyBack() {
    if (interceptBack.current?.()) return true;
    const previous = history.current.pop();
    show(placeOnly(previous), previous ? { scrollY: previous.scrollY || 0, railLeft: previous.railLeft || 0 } : topScroll);
    return Boolean(previous);
  }

  function back() {
    if (interceptBack.current?.()) return;
    // Préférer history.back pour le geste iOS natif (allowsBackForwardNavigationGestures).
    if (history.current.length && window.history.length > 1) {
      window.history.back();
      return;
    }
    applyBack();
  }
  backRef.current = back;

  useLayoutEffect(() => {
    const position = pendingScroll.current;
    restoreScroll(position);
    const frame = requestAnimationFrame(() => {
      restoreScroll(position);
      requestAnimationFrame(() => restoreScroll(position));
    });
    return () => cancelAnimationFrame(frame);
  }, [place]);

  useEffect(() => {
    function keepLoginForClerk() {
      if (!isClerkAuthHash()) return;
      setPlace((current) => (current.screen === "login" ? current : { ...homePlace, screen: "login" }));
    }
    window.addEventListener("hashchange", keepLoginForClerk);
    keepLoginForClerk();
    return () => window.removeEventListener("hashchange", keepLoginForClerk);
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    try {
      window.history.replaceState({ gemelo: true, screen: placeRef.current.screen }, "");
    } catch {
      /* ignore */
    }
    function onPop() {
      // Annuler le back navigateur uniquement si un overlay (galerie…) l’intercepte.
      if (interceptBack.current?.()) {
        try {
          window.history.pushState({ gemelo: true }, "");
        } catch {
          /* ignore */
        }
        return;
      }
      if (placeRef.current.screen === "login" || isClerkAuthHash()) {
        try {
          window.history.pushState({ gemelo: true }, "");
        } catch {
          /* ignore */
        }
        return;
      }
      applyBack();
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("ecran");
    const deepLinks = {
      "report-detail": { reportId: "slot-clarity", from: "report", campaignId: "bed-hop" },
      "optional-question": { campaignId: "bed-hop" },
      review: { campaignId: "bed-hop" },
      results: {},
      offer: {},
      report: { campaignId: "bed-hop" },
      "report-check": { campaignId: "bed-hop" },
      profile: {},
      confirmation: {},
      payment: {},
      besoin: {},
      settings: {},
      messages: {},
      ranking: {},
      "review-published": { campaignId: "bed-hop", reportId: new URLSearchParams(window.location.search).get("avis") || null },
      discover: {},
      explore: {},
      community: {},
      campaign: { campaignId: "bed-hop" },
    };
    if (!requested) return;
    if (deepLinks[requested]) navigate(requested, deepLinks[requested], true);
    else navigate("missing", {}, true);
  }, []);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let fired = false;
    const startOpts = { capture: true, passive: true };
    const moveOpts = { capture: true, passive: false };
    function loc(event) {
      return event.changedTouches?.[0] || event.touches?.[0] || event;
    }
    /** Bord gauche de l’écran (pas de la colonne .v2-page centrée). */
    function fromLeft(event) {
      return loc(event).clientX <= EDGE_PX;
    }
    function blocked(event) {
      const node = event.target;
      return Boolean(node && node.closest && node.closest(swipeIgnore));
    }
    function isBack(dx, dy) {
      return dx >= SWIPE_DX && dx >= Math.abs(dy) * 1.15;
    }
    function stopMove() {
      document.removeEventListener("touchmove", move, moveOpts);
      document.removeEventListener("pointermove", move, moveOpts);
    }
    function fireBack() {
      if (fired) return;
      fired = true;
      tracking = false;
      stopMove();
      backRef.current();
    }
    function begin(event) {
      if (tracking) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (!fromLeft(event) || blocked(event)) return;
      const point = loc(event);
      startX = point.clientX;
      startY = point.clientY;
      tracking = true;
      fired = false;
      document.addEventListener("touchmove", move, moveOpts);
      document.addEventListener("pointermove", move, moveOpts);
    }
    function move(event) {
      if (!tracking || fired) return;
      const point = loc(event);
      const dx = point.clientX - startX;
      const dy = point.clientY - startY;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
        tracking = false;
        stopMove();
        return;
      }
      if (dx > 8 && Math.abs(dx) > Math.abs(dy) && event.cancelable) event.preventDefault();
      if (isBack(dx, dy)) fireBack();
    }
    function end(event) {
      stopMove();
      if (!tracking || fired) {
        tracking = false;
        return;
      }
      tracking = false;
      const point = loc(event);
      if (isBack(point.clientX - startX, point.clientY - startY)) fireBack();
    }
    function cancel() {
      tracking = false;
      fired = false;
      stopMove();
    }
    document.addEventListener("touchstart", begin, startOpts);
    document.addEventListener("touchend", end, startOpts);
    document.addEventListener("touchcancel", cancel, startOpts);
    document.addEventListener("pointerdown", begin, startOpts);
    document.addEventListener("pointerup", end, startOpts);
    document.addEventListener("pointercancel", cancel, startOpts);
    return () => {
      stopMove();
      document.removeEventListener("touchstart", begin, startOpts);
      document.removeEventListener("touchend", end, startOpts);
      document.removeEventListener("touchcancel", cancel, startOpts);
      document.removeEventListener("pointerdown", begin, startOpts);
      document.removeEventListener("pointerup", end, startOpts);
      document.removeEventListener("pointercancel", cancel, startOpts);
    };
  }, []);

  const catalog = useCampaignCatalog();
  const campaign = catalog.find((item) => item.id === place.campaignId);
  const testerProject = browseProjects.find((item) => item.id === place.campaignId);
  const props = { navigate, back, pageRef, interceptBack, openDrawer: () => setDrawer(true) };
  const screen = (() => {
    if (place.screen === "browse") return testerProject ? <TesterProjectScreen {...props} project={testerProject} /> : <DiscoverScreen {...props} />;
    if (place.screen === "campaign") return campaign ? <CampaignScreen {...props} campaign={campaign} /> : <DiscoverScreen {...props} />;
    if (place.screen === "review") return campaign ? <ReviewFormScreen {...props} campaign={campaign} /> : <DiscoverScreen {...props} />;
    if (place.screen === "report-form") return campaign ? <ReportFormScreen {...props} campaign={campaign} /> : <DiscoverScreen {...props} />;
    if (place.screen === "report-check") return campaign ? <ReportCheckScreen {...props} campaign={campaign} /> : <DiscoverScreen {...props} />;
    if (place.screen === "login") return <LoginScreen {...props} from={place.from} campaignId={place.campaignId} />;
    if (place.screen === "review-published") return campaign ? <PublishedReviewScreen {...props} campaign={campaign} reportId={place.reportId} /> : <DiscoverScreen {...props} />;
    if (place.screen === "optional-question") return campaign ? <OptionalQuestionScreen {...props} campaign={campaign} reportId={place.reportId} /> : <DiscoverScreen {...props} />;
    if (place.screen === "community") return <CommunityScreen {...props} />;
    if (place.screen === "explore") return <ExploreScreen {...props} />;
    if (place.screen === "messages") return <MessagesScreen {...props} />;
    if (place.screen === "ranking") return <RankingScreen {...props} />;
    if (place.screen === "profile") return <ProfileScreen {...props} />;
    if (place.screen === "settings") return <SettingsScreen {...props} />;
    if (place.screen === "entrepreneur") return <EntrepreneurFormScreen {...props} />;
    if (place.screen === "offer") return <OfferScreen {...props} />;
    if (place.screen === "payment") return <PaymentScreen {...props} />;
    if (place.screen === "confirmation") return <ConfirmationScreen {...props} />;
    if (place.screen === "results") return <ResultsScreen {...props} />;
    if (place.screen === "report") return <ReportScreen {...props} />;
    if (place.screen === "report-detail") return <ReportDetailScreen {...props} campaign={campaign} campaignId={place.campaignId} reportId={place.reportId} from={place.from} />;
    if (place.screen === "besoin") return <SmokeScreen {...props} />;
    if (place.screen === "missing") return <MissingScreen {...props} />;
    return <DiscoverScreen {...props} />;
  })();

  if (!ageOk && !isClerkAuthHash()) {
    return (
      <AgeGate onConfirm={() => {
        confirmAge();
        setAgeOk(true);
      }} />
    );
  }

  const tree = (
    <>
      {screen}
      {place.screen === "besoin" ? null : <SideDrawer open={drawer} onClose={() => setDrawer(false)} navigate={navigate} />}
    </>
  );
  return clerkKey ? <ClerkStorageScope>{tree}</ClerkStorageScope> : tree;
}
