import { readClerkUser } from "../lib/clerkAuth.js";
import {
  CHARTER_ACCEPTANCE_LABEL,
  CHARTER_DATA_NOTICE,
  CHARTER_DOCUMENT_HASH,
  CHARTER_PDF_PATH,
  CHARTER_VERSION,
} from "../lib/charterMeta.js";
import { hasValidCharter, readCharterSignature, saveCharterSignature } from "../lib/charterStore.js";
import { rateLimited, rateLimitReply } from "../lib/rateLimit.js";

function publicStatus(signed, record) {
  return {
    version: CHARTER_VERSION,
    documentHash: CHARTER_DOCUMENT_HASH,
    pdfPath: CHARTER_PDF_PATH,
    acceptanceLabel: CHARTER_ACCEPTANCE_LABEL,
    dataNotice: CHARTER_DATA_NOTICE,
    signed,
    signedAt: signed ? record?.signedAt || null : null,
    /** MVP : enregistrement serveur, pas une signature qualifiée. */
    qualifiedSignature: false,
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const user = await readClerkUser(req);
    if (!user) {
      return res.status(200).json({
        ...publicStatus(false, null),
        authenticated: false,
      });
    }
    try {
      const record = await readCharterSignature(user.id);
      const signed = await hasValidCharter(user.id);
      return res.status(200).json({
        ...publicStatus(signed, record),
        authenticated: true,
      });
    } catch (error) {
      console.log("charter-get", String(error?.message || error).slice(0, 180));
      return res.status(500).json({ error: "Statut de la charte indisponible." });
    }
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });

  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour signer la charte." });
  if (rateLimited(req, "charter-sign", 10, 60 * 60 * 1000, user.id)) return rateLimitReply(res);

  const body = req.body || {};
  const accepted = body.accepted === true;
  const version = typeof body.version === "string" ? body.version.trim() : "";
  const documentHash = typeof body.documentHash === "string" ? body.documentHash.trim().toLowerCase() : "";

  if (!accepted) {
    return res.status(400).json({ error: "Cochez la case pour accepter la charte." });
  }
  if (version !== CHARTER_VERSION) {
    return res.status(400).json({ error: "Version de charte incorrecte. Rechargez la page." });
  }
  if (documentHash !== CHARTER_DOCUMENT_HASH) {
    return res.status(400).json({ error: "Document de charte incorrect. Rechargez la page." });
  }

  try {
    if (await hasValidCharter(user.id)) {
      const existing = await readCharterSignature(user.id);
      return res.status(200).json({
        ...publicStatus(true, existing),
        authenticated: true,
        alreadySigned: true,
      });
    }

    const record = {
      userId: user.id,
      version: CHARTER_VERSION,
      documentHash: CHARTER_DOCUMENT_HASH,
      pdfPath: CHARTER_PDF_PATH,
      signedAt: new Date().toISOString(),
      method: "checkbox-mvp",
      qualifiedSignature: false,
      label: CHARTER_ACCEPTANCE_LABEL,
    };
    await saveCharterSignature(record);
    return res.status(201).json({
      ...publicStatus(true, record),
      authenticated: true,
      alreadySigned: false,
    });
  } catch (error) {
    console.log("charter-post", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Enregistrement de la signature impossible." });
  }
}
