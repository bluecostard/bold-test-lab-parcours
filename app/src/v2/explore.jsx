import { useState } from "react";
import { useCampaignCatalog } from "./catalog.js";
import { exploreWeb } from "./data.js";
import { ShellWithNav } from "./chrome.jsx";

const CATEGORIES = ["Tous", "Application", "Site", "Campagne"];

function shuffle(list) {
  const next = [...list];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function cellTags(cell) {
  return cell.tags || [];
}

function matchesQuery(cell, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [cell.name, cell.badge, ...cellTags(cell)].join(" ").toLowerCase().includes(needle);
}

function matchesCategory(cell, category) {
  if (category === "Tous") return true;
  if (category === "Campagne") return cell.kind === "campaign" || cell.badge === "Campagne";
  return cellTags(cell).includes(category);
}

function MosaicCell({ cell, onOpen }) {
  const [src, setSrc] = useState(cell.image);
  return (
    <button type="button" className={cell.wide ? "is-wide" : ""} onClick={() => onOpen(cell)}>
      <img src={src} alt="" onError={() => { if (src !== cell.fallback) setSrc(cell.fallback); }} />
      <b>{cell.badge}</b>
      <em>{cell.name}</em>
    </button>
  );
}

export function ExploreScreen({ navigate, pageRef, openDrawer }) {
  const catalog = useCampaignCatalog();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [web] = useState(() => shuffle(exploreWeb).map((cell, index) => ({ ...cell, wide: index % 8 === 4 })));
  const cells = [
    ...catalog.filter((item) => item.live !== false).map((campaign, index) => ({
      id: campaign.id,
      name: campaign.name,
      image: campaign.cover || campaign.logo,
      fallback: campaign.logo || "/icon-app.png",
      kind: "campaign",
      badge: "Campagne",
      tags: campaign.tags,
      wide: index === 0,
    })),
    ...web,
  ];
  const visible = cells.filter((cell) => matchesQuery(cell, query) && matchesCategory(cell, category));
  function open(cell) {
    if (cell.kind === "campaign") navigate("campaign", { campaignId: cell.id });
    else navigate("browse", { campaignId: cell.id });
  }
  return (
    <ShellWithNav active="explore" navigate={navigate} openDrawer={openDrawer} pageRef={pageRef}>
      <main className="v2-stack">
        <label className="v2-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Chercher un projet" />
        </label>
        <div className="v2-pills" role="group" aria-label="Catégorie">
          {CATEGORIES.map((item) => (
            <button key={item} type="button" className={category === item ? "is-on" : ""} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        {visible.length ? (
          <div className="v2-mosaic">
            {visible.map((cell) => <MosaicCell key={cell.id} cell={cell} onOpen={open} />)}
          </div>
        ) : <p className="v2-description">Aucun projet</p>}
      </main>
    </ShellWithNav>
  );
}
