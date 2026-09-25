import { useEffect, useRef, useState } from "react";
import { campaigns, testerProjects } from "./data.js";
import { SideDrawer } from "./chrome.jsx";
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
import "./v2.css";

export function AppV2() {
  const [place, setPlace] = useState({ screen: "discover", campaignId: null, reportId: null, from: null });
  const [drawer, setDrawer] = useState(false);
  const history = useRef([]);
  const pageRef = useRef(null);

  function navigate(screen, params = {}, replace = false) {
    setPlace((current) => {
      const next = {
        screen,
        campaignId: params.campaignId ?? current.campaignId,
        reportId: params.reportId ?? current.reportId,
        from: params.from ?? current.from,
      };
      if (!replace && (current.screen !== next.screen || current.campaignId !== next.campaignId)) history.current.push(current);
      return next;
    });
    setDrawer(false);
    window.scrollTo(0, 0);
  }

  function back() {
    const previous = history.current.pop();
    navigate(previous?.screen || "discover", previous || {}, true);
  }

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("ecran");
    if (requested === "report-detail") navigate("report-detail", { reportId: "slot-clarity", from: "report", campaignId: "bed-hop" }, true);
    if (requested === "optional-question") navigate("optional-question", { campaignId: "bed-hop" }, true);
    if (requested === "review") navigate("review", { campaignId: "bed-hop" }, true);
    if (requested === "report") navigate("report", { campaignId: "bed-hop" }, true);
  }, []);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;
    let startX = 0;
    let startY = 0;
    let tracking = false;
    function pointerDown(event) {
      if (event.clientX - root.getBoundingClientRect().left > 24 || event.target.closest("input, textarea, .v2-screenshot-rail, .v2-drawer")) return;
      startX = event.clientX;
      startY = event.clientY;
      tracking = true;
    }
    function pointerUp(event) {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (dx > 70 && Math.abs(dx) > Math.abs(dy) * 1.35) back();
    }
    function pointerCancel() {
      tracking = false;
    }
    root.addEventListener("pointerdown", pointerDown);
    root.addEventListener("pointerup", pointerUp);
    root.addEventListener("pointercancel", pointerCancel);
    return () => {
      root.removeEventListener("pointerdown", pointerDown);
      root.removeEventListener("pointerup", pointerUp);
      root.removeEventListener("pointercancel", pointerCancel);
    };
  }, [place]);

  const campaign = campaigns.find((item) => item.id === place.campaignId);
  const testerProject = testerProjects.find((item) => item.id === place.campaignId);
  const props = { navigate, back, pageRef, openDrawer: () => setDrawer(true) };
  const screen = (() => {
    if (place.screen === "browse") return testerProject ? <TesterProjectScreen {...props} project={testerProject} /> : <DiscoverScreen {...props} />;
    if (place.screen === "campaign") return campaign ? <CampaignScreen {...props} campaign={campaign} /> : <DiscoverScreen {...props} />;
    if (place.screen === "review") return campaign ? <ReviewFormScreen {...props} campaign={campaign} /> : <DiscoverScreen {...props} />;
    if (place.screen === "report-form") return campaign ? <ReportFormScreen {...props} campaign={campaign} /> : <DiscoverScreen {...props} />;
    if (place.screen === "report-check") return campaign ? <ReportCheckScreen {...props} campaign={campaign} /> : <DiscoverScreen {...props} />;
    if (place.screen === "review-published") return campaign ? <PublishedReviewScreen {...props} campaign={campaign} /> : <DiscoverScreen {...props} />;
    if (place.screen === "optional-question") return campaign ? <OptionalQuestionScreen {...props} campaign={campaign} /> : <DiscoverScreen {...props} />;
    if (place.screen === "community") return <CommunityScreen {...props} />;
    if (place.screen === "explore") return <ExploreScreen {...props} />;
    if (place.screen === "messages") return <MessagesScreen {...props} />;
    if (place.screen === "ranking") return <RankingScreen {...props} />;
    if (place.screen === "profile") return <ProfileScreen {...props} />;
    if (place.screen === "login") return <LoginScreen {...props} />;
    if (place.screen === "settings") return <SettingsScreen {...props} />;
    if (place.screen === "entrepreneur") return <EntrepreneurFormScreen {...props} />;
    if (place.screen === "offer") return <OfferScreen {...props} />;
    if (place.screen === "payment") return <PaymentScreen {...props} />;
    if (place.screen === "confirmation") return <ConfirmationScreen {...props} />;
    if (place.screen === "results") return <ResultsScreen {...props} />;
    if (place.screen === "report") return <ReportScreen {...props} />;
    if (place.screen === "report-detail") return <ReportDetailScreen {...props} reportId={place.reportId} from={place.from} />;
    return <DiscoverScreen {...props} />;
  })();

  return (
    <>
      {screen}
      <SideDrawer open={drawer} onClose={() => setDrawer(false)} navigate={navigate} />
    </>
  );
}
