import { get, list, put } from "@vercel/blob";

const access = "private";
const MAX_MESSAGES = 200;

function cleanId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

export function conversationIdFor(userA, userB) {
  const a = cleanId(userA);
  const b = cleanId(userB);
  if (!a || !b || a === b) return "";
  return [a, b].sort().join("__");
}

function conversationPath(conversationId) {
  return `conversations/${cleanId(conversationId)}.json`;
}

async function readJson(pathname) {
  const result = await get(pathname, { access, useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const text = await new Response(result.stream).text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeJson(pathname, value) {
  await put(pathname, JSON.stringify(value), {
    access,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function readConversation(conversationId) {
  const id = cleanId(conversationId);
  if (!id) return null;
  return readJson(conversationPath(id));
}

export async function listConversationsFor(userId) {
  const uid = cleanId(userId);
  if (!uid) return [];
  const listed = await list({ prefix: "conversations/", limit: 200 });
  const items = [];
  for (const blob of listed.blobs) {
    const conversation = await readJson(blob.pathname);
    if (!conversation?.id || !Array.isArray(conversation.participants)) continue;
    if (!conversation.participants.includes(uid)) continue;
    items.push(conversation);
  }
  items.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  return items;
}

export async function appendMessage({ fromId, toId, text }) {
  const id = conversationIdFor(fromId, toId);
  if (!id) throw new Error("Correspondant invalide.");
  const now = new Date().toISOString();
  const current = (await readConversation(id)) || {
    id,
    participants: [cleanId(fromId), cleanId(toId)].sort(),
    messages: [],
    createdAt: now,
  };
  const message = {
    id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    fromId: cleanId(fromId),
    text: String(text || "").trim().slice(0, 500),
    sentAt: now,
  };
  if (!message.text) throw new Error("Écrivez un message.");
  const messages = [...(Array.isArray(current.messages) ? current.messages : []), message].slice(-MAX_MESSAGES);
  const next = {
    ...current,
    id,
    participants: [cleanId(fromId), cleanId(toId)].sort(),
    messages,
    lastPreview: message.text,
    updatedAt: now,
  };
  await writeJson(conversationPath(id), next);
  return next;
}
