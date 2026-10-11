import { createHmac } from "node:crypto";
import { get, put } from "@vercel/blob";

const access = "private";
const pathname = "mail/prefs.json";

function emptyPrefs() {
  return {
    subscribers: {},
    closingSent: {},
    closingRecipients: {},
    campaignSent: {},
    campaignRecipients: {},
    pendingCampaigns: [],
    rankingSent: "",
    rankingRecipients: {},
  };
}

function secret() {
  return process.env.MAIL_UNSUBSCRIBE_SECRET || process.env.GMAIL_APP_PASSWORD || process.env.BLOB_READ_WRITE_TOKEN || "gemelo-mail";
}

export function mailToken(userId) {
  return createHmac("sha256", secret()).update(String(userId)).digest("hex").slice(0, 32);
}

export function tokenMatches(userId, token) {
  return Boolean(userId && token && mailToken(userId) === String(token));
}

async function readJson() {
  try {
    const result = await get(pathname, { access, useCache: false });
    if (!result || result.statusCode !== 200) return emptyPrefs();
    const text = await new Response(result.stream).text();
    return { ...emptyPrefs(), ...JSON.parse(text) };
  } catch {
    return emptyPrefs();
  }
}

async function writeJson(data) {
  await put(pathname, JSON.stringify(data), {
    access,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return data;
}

export async function readMailPrefs() {
  return readJson();
}

export async function upsertSubscriber(userId, patch) {
  const data = await readJson();
  const current = data.subscribers[userId] || {
    email: "",
    name: "",
    campaigns: true,
    ranking: true,
    closing: true,
    welcomeSent: "",
    unsubscribedAt: "",
  };
  data.subscribers[userId] = { ...current, ...patch };
  await writeJson(data);
  return data.subscribers[userId];
}

export async function findSubscriberByToken(token) {
  const data = await readJson();
  for (const [userId, entry] of Object.entries(data.subscribers)) {
    if (tokenMatches(userId, token)) return { userId, ...entry };
  }
  return null;
}

export function listRecipients(data, key) {
  return Object.entries(data.subscribers || {})
    .filter(([, entry]) => entry.email && !entry.unsubscribedAt && entry[key] !== false)
    .map(([userId, entry]) => ({ userId, ...entry, token: mailToken(userId) }));
}

export async function markWelcomeSent(userId, email, name) {
  return upsertSubscriber(userId, { email, name, welcomeSent: new Date().toISOString() });
}

export async function markClosingSent(campaignId) {
  const data = await readJson();
  data.closingSent[campaignId] = new Date().toISOString();
  await writeJson(data);
}

export async function markRankingSent(week) {
  const data = await readJson();
  data.rankingSent = week;
  await writeJson(data);
}

export async function writePendingCampaign(campaignId) {
  const data = await readJson();
  if (campaignId) data.pendingCampaigns = [...new Set([...(data.pendingCampaigns || []), campaignId])];
  await writeJson(data);
  return data;
}

export async function writeMailState(patch) {
  const data = await readJson();
  await writeJson({ ...data, ...patch });
}
