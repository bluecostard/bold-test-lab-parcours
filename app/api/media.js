import { list, put } from "@vercel/blob";
import { readClerkUser } from "../lib/clerkAuth.js";
import { publicMediaUrl } from "../lib/mediaUrl.js";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxBytes = 4 * 1024 * 1024;

function cleanName(value) {
  return String(value || "image.jpg").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || "image.jpg";
}

function blobError(error) {
  return String(error?.message || error || "erreur Blob").slice(0, 200);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const user = await readClerkUser(req);
    if (!user) return res.status(401).json({ error: "Connectez-vous." });
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(503).json({ ok: false, error: "BLOB_READ_WRITE_TOKEN manquant sur Vercel." });
    }
    try {
      await list({ limit: 1, token: process.env.BLOB_READ_WRITE_TOKEN });
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(503).json({ ok: false, error: blobError(error) });
    }
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour envoyer un fichier." });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("media-put", "missing-BLOB_READ_WRITE_TOKEN");
    return res.status(503).json({ error: "Stockage images indisponible (BLOB_READ_WRITE_TOKEN manquant)." });
  }

  const body = req.body || {};
  const contentType = String(body.contentType || "image/jpeg").toLowerCase();
  if (!imageTypes.has(contentType)) {
    return res.status(400).json({ error: "Choisissez une image JPG, PNG, WebP ou GIF." });
  }
  const data = String(body.data || "").replace(/\s/g, "");
  if (!data) return res.status(400).json({ error: "Fichier manquant." });

  let buffer;
  try {
    buffer = Buffer.from(data, "base64");
  } catch {
    return res.status(400).json({ error: "Fichier illisible." });
  }
  if (!buffer.length) return res.status(400).json({ error: "Fichier manquant." });
  if (buffer.length > maxBytes) {
    return res.status(400).json({ error: "L’image est trop lourde. Essayez une photo plus légère." });
  }

  try {
    const blob = await put(`media/image/${user.id.slice(0, 12)}-${cleanName(body.name)}`, buffer, {
      access: "private",
      contentType,
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const proxied = publicMediaUrl(blob.url) || (blob.url ? `/api/img?u=${encodeURIComponent(blob.url)}` : "");
    if (!proxied) {
      return res.status(500).json({ error: "URL d’image impossible à publier." });
    }
    return res.status(200).json({
      url: proxied,
      blobUrl: blob.url,
      name: cleanName(body.name),
    });
  } catch (error) {
    const message = blobError(error);
    console.log("media-put", message);
    return res.status(400).json({ error: `Envoi impossible : ${message}` });
  }
}
