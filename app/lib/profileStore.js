import { get, put } from "@vercel/blob";

const access = "private";

function profilePath(userId) {
  return `profiles/${String(userId).replace(/[^a-zA-Z0-9_-]/g, "")}.json`;
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

export async function readProfileRecord(userId) {
  if (!userId) return null;
  return readJson(profilePath(userId));
}

export async function saveProfileRecord(userId, patch) {
  const current = (await readProfileRecord(userId)) || { userId };
  const next = {
    ...current,
    ...patch,
    userId,
    updatedAt: new Date().toISOString(),
  };
  await put(profilePath(userId), JSON.stringify(next), {
    access,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return next;
}

export function profileBlobPath(userId) {
  return profilePath(userId);
}
