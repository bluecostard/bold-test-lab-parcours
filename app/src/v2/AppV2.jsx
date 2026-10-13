import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { browseProjects } from "./data.js";
import { useCampaignCatalog } from "./catalog.js";
import { syncAccountFromServer } from "./accountSync.js";
import { startNativePush } from "./pushNative.js";
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
  TesterPublicScreen,
} from "./screens.jsx";
import { ReportDetailScreen } from "./report-detail.jsx";
import { SettingsScreen } from "./settings.jsx";
import {
  ConfirmationScreen,
  EntrepreneurFormScreen,
  OfferScreen,
  PaymentScreen,
  ProjectEditScreen,
  ReportScreen,
  ResultsScreen,
} from "./entrepreneur.jsx";
import { SmokeScreen } from "./smoke.jsx";
import "./v2.css";

const swipeIgnore = "input, textarea, .v2-screenshot-rail, .v2-project-rail, .v2-screenshot-viewer, .v2-pitch-viewer, .v2-drawer-root, .v2-drawer";
const homePlace = { screen: "discover", campaignId: null, reportId: null, from: null, authorId: null, authorName: null, projectId: null };
const topScroll = { scrollY: 0, railLeft: 0 };
/** Zone de démarrage du geste (bord gauche écran, style iOS). */
const EDGE_PX = 28;
/** Seuil de commit en px (sinon annulation + ressort). */
const COMMIT_DX = 96;
/** Seuil relatif à la largeur du viewport. */
const COMMIT_RATIO = 0.32;
/** Vitesse minimale (px/ms) pour commit anticipé. */
const COMMIT_VELOCITY = 0.55;

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
  const { getToken } = useAuth();
  const [ready, setReady] = useState(false);
  const scope = isLoaded ? (user?.id || "guest") : "pending";

  useEffect(() => {
    if (!isLoaded) return undefined;
    setStorageScope(scope);
    let cancelled = false;
    setReady(false);
    (async () => {
      if (user?.id && getToken) {
        try {
          await syncAccountFromServer(getToken);
        } catch {
          /* local vide si serveur indisponible — l’UI reste utilisable */
        }
        startNativePush(getToken).catch(() => {});
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, scope, user?.id]);

  if (scope === "pending" || !ready) {
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
    authorId: entry.authorId ?? null,
    authorName: entry.authorName ?? null,
    projectId: entry.projectId ?? null,
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
    if (requested === "profile" || requested === "confirmation" || requested === "offer" || requested === "payment" || requested === "besoin" || requested === "login") {
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
  const canBackRef = useRef(() => false);
  const pendingScroll = useRef(topScroll);
  const placeRef = useRef(place);
  const drawerRef = useRef(false);
  /**
   * Compteur de popstate à ignorer : on appelle history.back() après un retour JS
   * pour aligner la pile navigateur, sans rejouer applyBack (sinon → Accueil en 1 geste).
   */
  const ignorePopCount = useRef(0);
  placeRef.current = place;
  drawerRef.current = drawer;

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
    const current = placeRef.current;
    const next = {
      screen,
      campaignId: "campaignId" in params ? params.campaignId : current.campaignId,
      reportId: "reportId" in params ? params.reportId : current.reportId,
      from: "from" in params ? params.from : current.from,
      authorId: "authorId" in params ? params.authorId : null,
      authorName: "authorName" in params ? params.authorName : null,
      projectId: "projectId" in params ? params.projectId : (screen === "browse" ? (params.campaignId ?? current.projectId) : null),
    };
    const moved = current.screen !== next.screen
      || current.campaignId !== next.campaignId
      || current.reportId !== next.reportId
      || current.authorId !== next.authorId
      || current.authorName !== next.authorName
      || current.projectId !== next.projectId;
    const saved = captureScroll();
    if (!replace && moved) {
      history.current.push({ ...current, ...saved });
      try {
        window.history.pushState({ gemelo: true, screen }, "");
      } catch {
        /* ignore */
      }
    } else if (replace) {
      try {
        window.history.replaceState({ gemelo: true, screen }, "");
      } catch {
        /* ignore */
      }
    }
    show(next, topScroll);
  }

  function canGoBack() {
    return Boolean(interceptBack.current || drawerRef.current || history.current.length);
  }
  canBackRef.current = canGoBack;

  function applyBack() {
    if (interceptBack.current?.()) return true;
    if (drawerRef.current) {
      setDrawer(false);
      return true;
    }
    const previous = history.current.pop();
    if (!previous) return false;
    show(placeOnly(previous), { scrollY: previous.scrollY || 0, railLeft: previous.railLeft || 0 });
    return true;
  }

  /** Un seul cran dans la pile app ; aligne le navigateur sans second applyBack. */
  function back() {
    if (interceptBack.current?.()) return;
    if (drawerRef.current) {
      setDrawer(false);
      return;
    }
    if (!history.current.length) return;
    const ok = applyBack();
    if (!ok) return;
    try {
      if (window.history.state?.gemelo) {
        ignorePopCount.current += 1;
        window.history.back();
      } else {
        window.history.replaceState({ gemelo: true, screen: placeRef.current.screen }, "");
      }
    } catch {
      ignorePopCount.current = Math.max(0, ignorePopCount.current - 1);
    }
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
    function stayInApp() {
      try {
        window.history.pushState({ gemelo: true, screen: placeRef.current.screen }, "");
      } catch {
        /* ignore */
      }
    }
    function onPop() {
      if (ignorePopCount.current > 0) {
        ignorePopCount.current -= 1;
        return;
      }
      if (interceptBack.current?.()) {
        stayInApp();
        return;
      }
      if (drawerRef.current) {
        setDrawer(false);
        stayInApp();
        return;
      }
      if (placeRef.current.screen === "login" || isClerkAuthHash()) {
        stayInApp();
        return;
      }
      if (!history.current.length) {
        stayInApp();
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
      "project-edit": {},
      confirmation: {},
      payment: {},
      besoin: {},
      settings: {},
      messages: {},
      ranking: {},
      login: {},
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
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let tracking = false;
    let dragging = false;
    let committed = false;
    let pageEl = null;
    let dimEl = null;
    const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const startOpts = { capture: true, passive: true };
    const moveOpts = { capture: true, passive: false };

    function loc(event) {
      return event.changedTouches?.[0] || event.touches?.[0] || event;
    }
    function fromLeft(event) {
      return loc(event).clientX <= EDGE_PX;
    }
    function blocked(event) {
      const node = event.target;
      return Boolean(node && node.closest && node.closest(swipeIgnore));
    }
    function resolvePage() {
      return pageRef.current || document.querySelector(".v2-page");
    }
    function ensureDim() {
      if (dimEl?.isConnected) return dimEl;
      dimEl = document.createElement("div");
      dimEl.className = "v2-back-dim";
      dimEl.setAttribute("aria-hidden", "true");
      document.body.prepend(dimEl);
      return dimEl;
    }
    function clearDragStyles(el) {
      if (!el) return;
      el.classList.remove("is-swiping-back", "is-back-animating");
      el.style.transform = "";
      el.style.transition = "";
    }
    function setDrag(dx) {
      if (!pageEl) return;
      const x = Math.max(0, dx);
      pageEl.style.transform = `translate3d(${x}px,0,0)`;
      const dim = ensureDim();
      const progress = Math.min(1, x / Math.max(window.innerWidth * COMMIT_RATIO, COMMIT_DX));
      dim.style.opacity = String(0.18 + progress * 0.22);
    }
    function stopMove() {
      document.removeEventListener("pointermove", move, moveOpts);
    }
    function shouldCommit(dx) {
      const width = window.innerWidth || 1;
      if (dx >= COMMIT_DX) return true;
      if (dx >= width * COMMIT_RATIO) return true;
      if (dx >= 48 && velocity >= COMMIT_VELOCITY) return true;
      return false;
    }
    function resetGesture() {
      tracking = false;
      dragging = false;
      committed = false;
      pageEl = null;
    }
    function finishCancel() {
      if (!pageEl) {
        resetGesture();
        return;
      }
      const el = pageEl;
      if (reduceMotion()) {
        clearDragStyles(el);
        if (dimEl) {
          dimEl.style.opacity = "0";
          dimEl.remove();
          dimEl = null;
        }
        resetGesture();
        return;
      }
      el.classList.add("is-back-animating");
      el.style.transform = "translate3d(0,0,0)";
      if (dimEl) {
        dimEl.style.transition = "opacity 0.2s ease-out";
        dimEl.style.opacity = "0";
      }
      let done = false;
      const endAnim = () => {
        if (done) return;
        done = true;
        el.removeEventListener("transitionend", endAnim);
        clearDragStyles(el);
        if (dimEl) {
          dimEl.style.transition = "";
          dimEl.remove();
          dimEl = null;
        }
        resetGesture();
      };
      el.addEventListener("transitionend", endAnim);
      window.setTimeout(endAnim, 280);
    }
    function finishCommit() {
      if (committed) return;
      committed = true;
      stopMove();
      const el = pageEl;
      const runBack = () => {
        clearDragStyles(el);
        if (dimEl) {
          dimEl.remove();
          dimEl = null;
        }
        resetGesture();
        backRef.current();
      };
      if (!el || reduceMotion()) {
        runBack();
        return;
      }
      const width = window.innerWidth;
      el.classList.add("is-back-animating");
      el.style.transform = `translate3d(${width}px,0,0)`;
      if (dimEl) {
        dimEl.style.transition = "opacity 0.22s ease-out";
        dimEl.style.opacity = "0";
      }
      let done = false;
      const endAnim = () => {
        if (done) return;
        done = true;
        el.removeEventListener("transitionend", endAnim);
        runBack();
      };
      el.addEventListener("transitionend", endAnim);
      window.setTimeout(endAnim, 300);
    }
    function begin(event) {
      if (tracking || committed) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (!fromLeft(event) || blocked(event)) return;
      if (!canBackRef.current()) return;
      const point = loc(event);
      startX = point.clientX;
      startY = point.clientY;
      lastX = point.clientX;
      lastT = performance.now();
      velocity = 0;
      tracking = true;
      dragging = false;
      committed = false;
      pageEl = resolvePage();
      document.addEventListener("pointermove", move, moveOpts);
    }
    function move(event) {
      if (!tracking || committed) return;
      const point = loc(event);
      const dx = point.clientX - startX;
      const dy = point.clientY - startY;
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      velocity = (point.clientX - lastX) / dt;
      lastX = point.clientX;
      lastT = now;

      if (!dragging) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
          tracking = false;
          stopMove();
          return;
        }
        if (dx > 10 && Math.abs(dx) > Math.abs(dy) * 1.1) {
          dragging = true;
          if (pageEl) pageEl.classList.add("is-swiping-back");
          ensureDim();
        } else {
          return;
        }
      }
      if (event.cancelable) event.preventDefault();
      setDrag(dx);
    }
    function end(event) {
      stopMove();
      if (!tracking || committed) {
        tracking = false;
        return;
      }
      if (!dragging) {
        tracking = false;
        return;
      }
      const point = loc(event);
      const dx = Math.max(0, point.clientX - startX);
      if (shouldCommit(dx) && canBackRef.current()) finishCommit();
      else finishCancel();
    }
    function cancel() {
      stopMove();
      if (committed) return;
      if (dragging) finishCancel();
      else {
        tracking = false;
        dragging = false;
        clearDragStyles(pageEl);
        pageEl = null;
      }
    }

    /* Pointer seul : éviter touch + pointer (double commit → Accueil). */
    document.addEventListener("pointerdown", begin, startOpts);
    document.addEventListener("pointerup", end, startOpts);
    document.addEventListener("pointercancel", cancel, startOpts);
    return () => {
      stopMove();
      document.removeEventListener("pointerdown", begin, startOpts);
      document.removeEventListener("pointerup", end, startOpts);
      document.removeEventListener("pointercancel", cancel, startOpts);
      if (dimEl) dimEl.remove();
      clearDragStyles(pageEl);
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
    if (place.screen === "review-published") {
      const reviewCampaign = campaign || {
        id: place.campaignId,
        name: "Campagne",
        tags: [],
        logo: "",
        cover: "",
        screenshots: [],
        archived: true,
      };
      return place.campaignId
        ? <PublishedReviewScreen {...props} campaign={reviewCampaign} reportId={place.reportId} />
        : <DiscoverScreen {...props} />;
    }
    if (place.screen === "optional-question") return campaign ? <OptionalQuestionScreen {...props} campaign={campaign} reportId={place.reportId} /> : <DiscoverScreen {...props} />;
    if (place.screen === "community") return <CommunityScreen {...props} />;
    if (place.screen === "explore") return <ExploreScreen {...props} />;
    if (place.screen === "messages") return <MessagesScreen {...props} />;
    if (place.screen === "ranking") return <RankingScreen {...props} />;
    if (place.screen === "tester-profile") {
      return (
        <TesterPublicScreen
          {...props}
          authorId={place.authorId}
          authorName={place.authorName}
          projectId={place.projectId}
        />
      );
    }
    if (place.screen === "profile") return <ProfileScreen {...props} />;
    if (place.screen === "settings") return <SettingsScreen {...props} />;
    if (place.screen === "project-edit") return <ProjectEditScreen {...props} />;
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
