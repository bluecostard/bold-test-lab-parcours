import { handleUpload } from "@vercel/blob/client";
import { readClerkUser } from "../lib/clerkAuth.js";

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const videoTypes = ["video/mp4", "video/quicktime", "video/webm"];

function payloadKind(clientPayload) {
  try {
    const parsed = JSON.parse(clientPayload || "{}");
    return parsed.kind === "video" ? "video" : "image";
  } catch {
    return "image";
  }
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function asFetchRequest(req, body) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "gemelo.online";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const headers = new Headers();
  if (req.headers.authorization) headers.set("authorization", req.headers.authorization);
  headers.set("content-type", "application/json");
  return new Request(`${proto}://${host}/api/upload`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour envoyer un fichier." });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: "Stockage images indisponible (BLOB_READ_WRITE_TOKEN manquant)." });
  }

  const body = readBody(req);
  try {
    const json = await handleUpload({
      body,
      request: asFetchRequest(req, body),
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const kind = payloadKind(clientPayload);
        return {
          allowedContentTypes: kind === "video" ? videoTypes : imageTypes,
          maximumSizeInBytes: kind === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id, kind }),
          // Forcé pour les callbacks hors détection auto (Vite + Capacitor).
          callbackUrl: "https://gemelo.online/api/upload",
        };
      },
      onUploadCompleted: async () => {},
    });
    return res.status(200).json(json);
  } catch (error) {
    const message = String(error?.message || error).slice(0, 200);
    console.log("upload", message);
    return res.status(400).json({ error: `Envoi impossible : ${message}` });
  }
}
