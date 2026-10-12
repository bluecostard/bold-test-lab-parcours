import { put } from "@vercel/blob";
import { readClerkUser } from "../lib/clerkAuth.js";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const maxBytes = 10 * 1024 * 1024;

function cleanName(value) {
  return String(value || "image.jpg").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || "image.jpg";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour envoyer un fichier." });

  const body = req.body || {};
  const contentType = String(body.contentType || "image/jpeg").toLowerCase();
  if (!imageTypes.has(contentType)) {
    return res.status(400).json({ error: "Choisissez une image JPG, PNG, WebP ou GIF." });
  }
  const data = String(body.data || "");
  if (!data) return res.status(400).json({ error: "Fichier manquant." });

  let buffer;
  try {
    buffer = Buffer.from(data, "base64");
  } catch {
    return res.status(400).json({ error: "Fichier illisible." });
  }
  if (!buffer.length) return res.status(400).json({ error: "Fichier manquant." });
  if (buffer.length > maxBytes) return res.status(400).json({ error: "L’image dépasse 10 Mo." });

  try {
    const blob = await put(`media/image/${cleanName(body.name)}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return res.status(200).json({ url: blob.url, name: cleanName(body.name) });
  } catch (error) {
    console.log("media-put", String(error?.message || error).slice(0, 180));
    return res.status(400).json({ error: "Envoi impossible." });
  }
}
