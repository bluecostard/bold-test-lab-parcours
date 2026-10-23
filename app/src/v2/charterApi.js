import {
  CHARTER_DOCUMENT_HASH,
  CHARTER_PDF_PATH,
  CHARTER_VERSION,
} from "../../lib/charterMeta.js";

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function fetchCharterStatus(getToken) {
  const headers = {};
  if (getToken) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch("/api/charter", { headers });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Statut de la charte indisponible.");
  return data;
}

export async function signCharter(getToken) {
  if (!getToken) throw new Error("Connectez-vous pour signer la charte.");
  const token = await getToken();
  if (!token) throw new Error("Connectez-vous pour signer la charte.");
  const response = await fetch("/api/charter", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      accepted: true,
      version: CHARTER_VERSION,
      documentHash: CHARTER_DOCUMENT_HASH,
    }),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Signature impossible.");
  return data;
}

export function charterPdfHref() {
  return CHARTER_PDF_PATH;
}

export { CHARTER_VERSION, CHARTER_DOCUMENT_HASH };
