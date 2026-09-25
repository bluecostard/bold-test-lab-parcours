import { useState } from "react";
import { campaigns, testerProjects } from "./data.js";
import { ShellWithNav } from "./chrome.jsx";

const cells = [
  { id: campaigns[0].id, name: campaigns[0].name, image: campaigns[0].cover, kind: "campaign", wide: true },
  ...testerProjects.map((project) => ({ id: project.id, name: project.name, image: project.cover, kind: "tester", wide: false })),
];

export function ExploreScreen({ navigate, pageRef, openDrawer }) {
  const [query, setQuery] = useState("");
  const visible = cells.filter((cell) => cell.name.toLowerCase().includes(query.trim().toLowerCase()));
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
        {visible.length ? (
          <div className="v2-mosaic">
            {visible.map((cell) => (
              <button key={cell.id} type="button" className={cell.wide ? "is-wide" : ""} onClick={() => open(cell)}>
                <img src={cell.image} alt="" />
                <b>{cell.kind === "campaign" ? "Campagne" : "Communauté"}</b>
                <span className="v2-sr">{cell.name}</span>
              </button>
            ))}
          </div>
        ) : <p className="v2-description">Aucun projet</p>}
      </main>
    </ShellWithNav>
  );
}
