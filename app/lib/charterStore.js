import { get, put } from "@vercel/blob";
import { CHARTER_DOCUMENT_HASH, CHARTER_VERSION } from "./charterMeta.js";

const access = "private";

function charterPath(userId) {
  return `charters/${String(userId).replace(/[^a-zA-Z0-9_-]/g, "")}.json`;
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

export async function readCharterSignature(userId) {
  if (!userId) return null;
  return readJson(charterPath(userId));
}

/** True si l’utilisateur a signé la version courante avec le hash attendu. */
export async function hasValidCharter(userId) {
  const record = await readCharterSignature(userId);
  if (!record?.signedAt || !record.userId) return false;
  if (record.version !== CHARTER_VERSION) return false;
  if (record.documentHash !== CHARTER_DOCUMENT_HASH) return false;
  return true;
}

export async function saveCharterSignature(record) {
  await put(charterPath(record.userId), JSON.stringify(record), {
    access,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return record;
}

export function charterBlobPath(userId) {
  return charterPath(userId);
}
