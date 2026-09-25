import { useState } from "react";
import { Button } from "./primitives.jsx";
import { hasPaidCampaign, readV2State, updateV2State } from "./state.js";
import { ShellWithNav } from "./chrome.jsx";

const seeds = [
  { id: "bed-hop", name: "Bed Hop", preview: "Une question sur le créneau 11 h – 17 h.", logo: "/visuels/logo-bedhop-tight.png", initial: "" },
  { id: "alexandre", name: "Alexandre", preview: "Je peux préciser l’écran Autour de toi.", logo: "", initial: "A" },
];

export function MessagesScreen({ navigate, pageRef, openDrawer }) {
  const unlocked = hasPaidCampaign();
  const [openId, setOpenId] = useState(null);
  const [text, setText] = useState("");
  const [state, setState] = useState(readV2State);
  const thread = openId ? (state.messageThreads[openId] || [{ from: "them", text: seeds.find((item) => item.id === openId)?.preview }]) : [];
  const peer = seeds.find((item) => item.id === openId);

  function send() {
    if (!text.trim() || !openId) return;
    const next = updateV2State((current) => ({
      ...current,
      messageThreads: {
        ...current.messageThreads,
        [openId]: [...(current.messageThreads[openId] || thread), { from: "me", text: text.trim() }],
      },
    }));
    setState(next);
    setText("");
  }

  if (unlocked && openId && peer) {
    return (
      <ShellWithNav active="messages" navigate={navigate} openDrawer={openDrawer} pageRef={pageRef} header={false}>
        <main className="v2-stack v2-thread">
          <button type="button" className="v2-back" onClick={() => setOpenId(null)}><span aria-hidden="true">←</span> {peer.name}</button>
          <ul className="v2-bubbles">
            {thread.map((message, index) => <li key={`${message.text}-${index}`} className={message.from === "me" ? "is-me" : ""}>{message.text}</li>)}
          </ul>
          <label className="v2-search">
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Écrire un message" onKeyDown={(event) => { if (event.key === "Enter") send(); }} />
          </label>
        </main>
      </ShellWithNav>
    );
  }

  return (
    <ShellWithNav active="messages" navigate={navigate} openDrawer={openDrawer} pageRef={pageRef}>
      <main className="v2-stack">
        <h1>Messages</h1>
        <div className={unlocked ? "v2-inbox" : "v2-inbox is-locked"}>
          <ul>
            {seeds.map((item) => (
              <li key={item.id}>
                <button type="button" disabled={!unlocked} onClick={() => unlocked && setOpenId(item.id)}>
                  {item.logo ? <img src={item.logo} alt="" /> : <span className="v2-avatar">{item.initial}</span>}
                  <span><strong>{item.name}</strong><small>{item.preview}</small></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {unlocked ? null : (
          <div className="v2-lock-bar">
            <strong>Disponible après une campagne</strong>
            <p>Une campagne payante (simulée) déverrouille les messages.</p>
            <Button type="button" onClick={() => navigate("offer")}>Voir les offres <span aria-hidden="true">→</span></Button>
          </div>
        )}
      </main>
    </ShellWithNav>
  );
}
