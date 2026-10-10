import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { useCampaignCatalog } from "./catalog.js";
import { ShellWithNav } from "./chrome.jsx";
import { Button } from "./primitives.jsx";
import { listMyQuestions } from "./questionsApi.js";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function formatWhen(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(value));
  } catch {
    return "";
  }
}

export function MessagesScreen(props) {
  return clerkKey ? <MessagesAuthed {...props} /> : <MessagesBody {...props} getToken={null} user={null} />;
}

function MessagesAuthed(props) {
  const { getToken } = useAuth();
  const { user } = useUser();
  return <MessagesBody {...props} getToken={getToken} user={user} />;
}

function MessagesBody({ navigate, pageRef, openDrawer, getToken, user }) {
  const catalog = useCampaignCatalog();
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(!getToken);
  useEffect(() => {
    if (!getToken || !user?.id) {
      setItems([]);
      setReady(true);
      return;
    }
    listMyQuestions(getToken).then(setItems).catch(() => setItems([])).finally(() => setReady(true));
  }, [getToken, user?.id]);

  function open(item) {
    const mine = item.authorId && user?.id === item.authorId;
    if (mine && !item.answer) {
      navigate("optional-question", { campaignId: item.campaignId, reportId: item.reviewId });
      return;
    }
    navigate("review-published", { campaignId: item.campaignId, reportId: item.reviewId });
  }

  return (
    <ShellWithNav active="messages" navigate={navigate} openDrawer={openDrawer} pageRef={pageRef}>
      <main className="v2-stack">
        <h1>Messages</h1>
        {!user ? (
          <>
            <p className="v2-description">Connectez-vous pour voir les questions liées à vos avis.</p>
            <Button type="button" onClick={() => navigate("login", { from: "messages" })}>Se connecter</Button>
          </>
        ) : !ready ? (
          <p className="v2-muted">Chargement…</p>
        ) : items.length ? (
          <div className="v2-inbox">
            <ul>
              {items.map((item) => {
                const campaign = catalog.find((entry) => entry.id === item.campaignId);
                const name = campaign?.name || (item.campaignId === "bed-hop" ? "Bed Hop" : "Campagne");
                const waiting = item.authorId === user.id && !item.answer;
                return (
                  <li key={`${item.reviewId}-${item.sentAt}`}>
                    <button type="button" onClick={() => open(item)}>
                      <span className="v2-avatar" aria-hidden="true">{name.charAt(0)}</span>
                      <p>
                        <strong>{name}{formatWhen(item.sentAt) ? ` · ${formatWhen(item.sentAt)}` : ""}</strong>
                        <small>{waiting ? "Une question vous attend" : item.text}</small>
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="v2-description">Aucun message pour le moment. Les questions d’un entrepreneur sur vos avis s’afficheront ici.</p>
        )}
      </main>
    </ShellWithNav>
  );
}
