import { useEffect, useRef, useState } from "react";
import { Home, products } from "./screens/Home.jsx";
import { Detail } from "./screens/Detail.jsx";
import { Maquettes } from "./screens/Maquettes.jsx";
import { Login } from "./screens/Login.jsx";
import { CampaignPage } from "./screens/CampaignPage.jsx";
import { Settings } from "./screens/Settings.jsx";

export function App() {
  const [screen, setScreen] = useState(1);
  const [detailName, setDetailName] = useState(null);
  const [campaignName, setCampaignName] = useState(products[0].name);
  const history = useRef([]);
  const place = useRef({ screen: 1, detailName: null, campaignName: products[0].name });
  const appRef = useRef(null);

  function remember(nextPlace) {
    const current = place.current;
    if (current.screen === nextPlace.screen && current.detailName === nextPlace.detailName) return;
    const previous = history.current[history.current.length - 1];
    if (previous && previous.screen === nextPlace.screen && previous.detailName === nextPlace.detailName) {
      history.current.pop();
    } else {
      history.current.push(current);
    }
    place.current = nextPlace;
  }

  function open(next, name) {
    const nextDetail = next === "detail" ? name : place.current.detailName;
    const nextCampaign = typeof name === "string" && products.some((item) => item.name === name) ? name : place.current.campaignName;
    remember({ screen: next, detailName: nextDetail, campaignName: nextCampaign });
    if (next === "detail") setDetailName(name);
    setCampaignName(nextCampaign);
    setScreen(next);
  }

  function back() {
    const previous = history.current.pop();
    if (!previous) return;
    place.current = previous;
    setDetailName(previous.detailName);
    setCampaignName(previous.campaignName);
    setScreen(previous.screen);
  }

  useEffect(() => {
    const root = appRef.current;
    if (!root) return undefined;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    function start(event) {
      const edge = event.clientX - root.getBoundingClientRect().left;
      if (edge > 28) return;
      if (event.target.closest("input, textarea")) return;
      tracking = true;
      startX = event.clientX;
      startY = event.clientY;
      try { root.setPointerCapture(event.pointerId); } catch { /* le glissement reste suivi sans capture */ }
    }

    function end(event) {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (dx > 72 && Math.abs(dx) > Math.abs(dy) * 1.3) back();
    }

    function cancel() {
      tracking = false;
    }

    root.addEventListener("pointerdown", start);
    root.addEventListener("pointerup", end);
    root.addEventListener("pointercancel", cancel);
    return () => {
      root.removeEventListener("pointerdown", start);
      root.removeEventListener("pointerup", end);
      root.removeEventListener("pointercancel", cancel);
    };
  }, []);

  return (
    <div className="app" ref={appRef}>
      {screen === 1 ? <Home onOpen={open} /> : null}
      {screen === "detail" ? <Detail name={detailName} onOpen={open} /> : null}
      {screen === "login" ? <Login onOpen={open} /> : null}
      {screen === "campagne" ? <CampaignPage onOpen={open} /> : null}
      {screen === "reglages" ? <Settings onOpen={open} /> : null}
      {typeof screen === "number" && screen > 1 ? <Maquettes screen={screen} onOpen={open} campaignName={campaignName} /> : null}
    </div>
  );
}
