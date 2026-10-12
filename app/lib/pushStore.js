import { get, put } from "@vercel/blob";

const access = "private";
const pathname = "push/devices.json";

function empty() {
  return { devices: {} };
}

async function readJson() {
  try {
    const result = await get(pathname, { access, useCache: false });
    if (!result || result.statusCode !== 200) return empty();
    const text = await new Response(result.stream).text();
    return { ...empty(), ...JSON.parse(text) };
  } catch {
    return empty();
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

export async function upsertPushDevice(userId, { token, platform = "ios" }) {
  const cleanToken = String(token || "").replace(/[^0-9a-fA-F]/g, "");
  if (!userId || cleanToken.length < 32) throw new Error("Jeton push invalide.");
  const data = await readJson();
  data.devices[userId] = {
    token: cleanToken,
    platform: platform === "android" ? "android" : "ios",
    updatedAt: new Date().toISOString(),
  };
  await writeJson(data);
  return data.devices[userId];
}

export async function removePushDevice(userId) {
  const data = await readJson();
  if (!data.devices[userId]) return false;
  delete data.devices[userId];
  await writeJson(data);
  return true;
}

export async function listPushDevicesForUsers(userIds) {
  const wanted = new Set((userIds || []).filter(Boolean));
  if (!wanted.size) return [];
  const data = await readJson();
  return Object.entries(data.devices || {})
    .filter(([userId]) => wanted.has(userId))
    .map(([userId, device]) => ({ userId, ...device }));
}
