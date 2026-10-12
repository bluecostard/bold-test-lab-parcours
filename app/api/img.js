import { get } from "@vercel/blob";
import { hostedMediaUrl } from "../lib/mediaUrl.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode refusée." });

  const raw = String(req.query.u || "");
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const url = hostedMediaUrl(decoded, 800);
  if (!url || !url.includes(".blob.vercel-storage.com")) {
    return res.status(400).json({ error: "URL invalide." });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: "Stockage indisponible." });
  }

  try {
    const result = await get(url, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return res.status(404).json({ error: "Image introuvable." });
    }
    const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
    res.setHeader("Content-Type", result.blob.contentType || "image/jpeg");
    res.setHeader("Content-Length", String(bytes.length));
    return res.status(200).send(bytes);
  } catch (error) {
    console.log("img-proxy", String(error?.message || error).slice(0, 180));
    return res.status(404).json({ error: "Image introuvable." });
  }
}
