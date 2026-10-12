import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { useCampaignCatalog } from "./catalog.js";
import { ShellWithNav } from "./chrome.jsx";
import { BackButton, Button, SectionTitle } from "./primitives.jsx";
import { fetchConversation, fetchMessagingInbox, sendDirectMessage } from "./messagesApi.js";
import { listMyQuestions } from "./questionsApi.js";
import { hasPaidCampaign } from "./state.js";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const DEMO_THREADS = [
  {
    id: "demo-bedhop",
    name: "Bed Hop",
    preview: "Une question sur le créneau 11 h – 17 h.",
    logo: "/visuels/logo-bedhop-tight.png",
    when: "",
  },
  {
    id: "demo-alexandre",
    name: "Alexandre",
    preview: "Je peux préciser l’écran Autour de toi.",
    logo: "",
    when: "",
  },
];

function formatWhen(value) {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (sameDay) {
      return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);
    }
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
  } catch {
    return "";
  }
}

function PeerAvatar({ name, logo }) {
  const initial = String(name || "?").trim().charAt(0).toUpperCase() || "?";
  if (logo) {
    return <img className="v2-avatar" src={logo} alt="" />;
  }
  return (
    <span className="v2-avatar v2-avatar--mark" aria-hidden="true">
      {initial}
    </span>
  );
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
  const [inboxReady, setInboxReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(!getToken);
  const [conversations, setConversations] = useState([]);
  const [peers, setPeers] = useState([]);
  const [inboxError, setInboxError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionsReady, setQuestionsReady] = useState(!getToken);
  const [active, setActive] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [threadError, setThreadError] = useState("");

  const localPaid = hasPaidCampaign();
  const showLocked = inboxReady ? !unlocked : !localPaid;

  useEffect(() => {
    let cancelled = false;
    if (!getToken || !user?.id) {
      setInboxReady(true);
      setUnlocked(false);
      setNeedsAuth(true);
      setConversations([]);
      setPeers([]);
      setInboxError("");
      return undefined;
    }
    setInboxReady(false);
    fetchMessagingInbox(getToken)
      .then((data) => {
        if (cancelled) return;
        setUnlocked(Boolean(data.unlocked));
        setNeedsAuth(Boolean(data.needsAuth));
        setConversations(Array.isArray(data.conversations) ? data.conversations : []);
        setPeers(Array.isArray(data.peers) ? data.peers : []);
        setInboxError(data.error || "");
      })
      .catch(() => {
        if (cancelled) return;
        setUnlocked(false);
        setNeedsAuth(false);
        setConversations([]);
        setPeers([]);
        setInboxError("Messages indisponibles.");
      })
      .finally(() => {
        if (!cancelled) setInboxReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [getToken, user?.id]);

  useEffect(() => {
    let cancelled = false;
    if (!getToken || !user?.id) {
      setQuestions([]);
      setQuestionsReady(true);
      return undefined;
    }
    setQuestionsReady(false);
    listMyQuestions(getToken)
      .then((items) => {
        if (!cancelled) setQuestions(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setQuestionsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [getToken, user?.id]);

  function openQuestion(item) {
    const mine = item.authorId && user?.id === item.authorId;
    if (mine && !item.answer) {
      navigate("optional-question", { campaignId: item.campaignId, reportId: item.reviewId });
      return;
    }
    navigate("review-published", { campaignId: item.campaignId, reportId: item.reviewId });
  }

  async function openConversation(conversation) {
    if (!unlocked || !getToken) return;
    setThreadError("");
    setDraft("");
    setActive(conversation);
    if (!conversation?.id || (conversation.messages && conversation.messages.length)) return;
    try {
      const fresh = await fetchConversation(getToken, conversation.id);
      setActive(fresh);
    } catch (error) {
      setThreadError(error?.message || "Conversation introuvable.");
    }
  }

  function startWithPeer(peer) {
    if (!unlocked || !peer?.userId) return;
    const existing = conversations.find((item) => item.peerId === peer.userId);
    if (existing) {
      openConversation(existing);
      return;
    }
    setThreadError("");
    setDraft("");
    setActive({
      id: "",
      peerId: peer.userId,
      peer: {
        userId: peer.userId,
        name: peer.name || "Campagne",
        logo: peer.logo || "",
        pitch: peer.pitch || "",
      },
      lastPreview: "",
      updatedAt: "",
      messages: [],
    });
  }

  async function submitMessage(event) {
    event.preventDefault();
    if (!unlocked || !getToken || !active?.peerId || sending) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setThreadError("");
    try {
      const conversation = await sendDirectMessage(getToken, { peerId: active.peerId, text });
      setActive(conversation);
      setDraft("");
      setConversations((current) => {
        const others = current.filter((item) => item.id !== conversation.id && item.peerId !== conversation.peerId);
        return [conversation, ...others];
      });
    } catch (error) {
      setThreadError(error?.message || "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  if (active) {
    const peerName = active.peer?.name || "Conversation";
    return (
      <ShellWithNav active="messages" navigate={navigate} openDrawer={openDrawer} pageRef={pageRef}>
        <main className="v2-stack v2-thread">
          <div className="v2-thread-head">
            <BackButton
              onClick={() => {
                setActive(null);
                setDraft("");
                setThreadError("");
              }}
            >
              Messages
            </BackButton>
            <h1>{peerName}</h1>
          </div>
          <ul className="v2-bubbles" aria-live="polite">
            {(active.messages || []).length ? (
              active.messages.map((message) => (
                <li key={message.id} className={message.mine ? "is-me" : undefined}>
                  {message.text}
                </li>
              ))
            ) : (
              <li className="v2-bubbles-empty">Écrivez le premier message à {peerName}.</li>
            )}
          </ul>
          {threadError ? <p className="v2-helper" role="alert">{threadError}</p> : null}
          <form className="v2-composer" onSubmit={submitMessage}>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Écrire un message"
              aria-label="Écrire un message"
              disabled={sending || !unlocked}
              autoComplete="off"
            />
            <Button type="submit" disabled={sending || !draft.trim() || !unlocked}>
              Envoyer
            </Button>
          </form>
        </main>
      </ShellWithNav>
    );
  }

  const listRows = showLocked
    ? DEMO_THREADS
    : conversations.map((item) => ({
        id: item.id,
        name: item.peer?.name || "Campagne",
        preview: item.lastPreview || "Nouvelle conversation",
        logo: item.peer?.logo || "",
        when: formatWhen(item.updatedAt),
        conversation: item,
      }));

  const startPeers = unlocked
    ? peers.filter((peer) => !conversations.some((item) => item.peerId === peer.userId))
    : [];

  return (
    <ShellWithNav active="messages" navigate={navigate} openDrawer={openDrawer} pageRef={pageRef}>
      <main className="v2-stack">
        <h1>Messages</h1>

        {!user || needsAuth ? (
          <>
            <p className="v2-description">Connectez-vous pour écrire aux autres propriétaires de campagnes payantes.</p>
            <Button type="button" onClick={() => navigate("login", { from: "messages" })}>
              Se connecter
            </Button>
          </>
        ) : null}

        {!inboxReady && user ? <p className="v2-muted">Chargement…</p> : null}
        {inboxError && user && !needsAuth ? <p className="v2-helper" role="alert">{inboxError}</p> : null}

        {unlocked && !showLocked && !conversations.length ? (
          <p className="v2-description">
            Aucune conversation pour l’instant. Écrivez à un autre propriétaire de campagne payante ci-dessous.
          </p>
        ) : null}

        <div className={showLocked ? "v2-inbox is-locked" : "v2-inbox"}>
          <ul>
            {listRows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  disabled={showLocked}
                  onClick={() => {
                    if (!showLocked && row.conversation) openConversation(row.conversation);
                  }}
                >
                  <PeerAvatar name={row.name} logo={row.logo} />
                  <p>
                    <strong>
                      {row.name}
                      {row.when ? ` · ${row.when}` : ""}
                    </strong>
                    <small>{row.preview}</small>
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {showLocked ? (
          <div className="v2-lock-bar">
            <strong>Disponible après une campagne</strong>
            <p>Une campagne payante déverrouille la messagerie entre propriétaires.</p>
            <Button type="button" onClick={() => navigate("offer")}>
              Voir les offres <span aria-hidden="true">→</span>
            </Button>
          </div>
        ) : null}

        {unlocked && startPeers.length ? (
          <section className="v2-peers" aria-label="Autres propriétaires">
            <SectionTitle
              title="Écrire à un propriétaire"
              description="Autres campagnes payantes avec lesquelles démarrer une conversation."
            />
            <div className="v2-inbox">
              <ul>
                {startPeers.map((peer) => (
                  <li key={peer.userId}>
                    <button type="button" onClick={() => startWithPeer(peer)}>
                      <PeerAvatar name={peer.name} logo={peer.logo} />
                      <p>
                        <strong>{peer.name || "Campagne"}</strong>
                        <small>{peer.pitch || "Démarrer une conversation"}</small>
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {user && !needsAuth ? (
          <section className="v2-questions-inbox" aria-label="Questions sur avis">
            <SectionTitle
              title="Questions sur avis"
              description="Questions d’un entrepreneur liées à vos avis publiés."
            />
            {!questionsReady ? (
              <p className="v2-muted">Chargement…</p>
            ) : questions.length ? (
              <div className="v2-inbox">
                <ul>
                  {questions.map((item) => {
                    const campaign = catalog.find((entry) => entry.id === item.campaignId);
                    const name = campaign?.name || (item.campaignId === "bed-hop" ? "Bed Hop" : "Campagne");
                    const waiting = item.authorId === user.id && !item.answer;
                    return (
                      <li key={`${item.reviewId}-${item.sentAt}`}>
                        <button type="button" onClick={() => openQuestion(item)}>
                          <PeerAvatar name={name} logo={campaign?.logo || ""} />
                          <p>
                            <strong>
                              {name}
                              {formatWhen(item.sentAt) ? ` · ${formatWhen(item.sentAt)}` : ""}
                            </strong>
                            <small>{waiting ? "Une question vous attend" : item.text}</small>
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="v2-description">Aucune question sur vos avis pour le moment.</p>
            )}
          </section>
        ) : null}
      </main>
    </ShellWithNav>
  );
}
