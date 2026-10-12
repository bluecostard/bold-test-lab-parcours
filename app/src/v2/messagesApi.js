async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function authHeader(getToken) {
  if (!getToken) return {};
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchMessagingInbox(getToken) {
  const response = await fetch("/api/messages", {
    headers: { ...(await authHeader(getToken)) },
  });
  const data = await readJson(response);
  if (response.status === 401) {
    return { unlocked: false, conversations: [], peers: [], needsAuth: true };
  }
  if (!response.ok) {
    return { unlocked: false, conversations: [], peers: [], error: data.error || "Messages indisponibles." };
  }
  return {
    unlocked: Boolean(data.unlocked),
    conversations: Array.isArray(data.conversations) ? data.conversations : [],
    peers: Array.isArray(data.peers) ? data.peers : [],
    needsAuth: false,
  };
}

export async function fetchConversation(getToken, conversationId) {
  const response = await fetch(`/api/messages?conversationId=${encodeURIComponent(conversationId)}`, {
    headers: { ...(await authHeader(getToken)) },
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Conversation introuvable.");
  return data.conversation;
}

export async function sendDirectMessage(getToken, { peerId, text }) {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader(getToken)) },
    body: JSON.stringify({ peerId, text }),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Envoi impossible.");
  return data.conversation;
}
