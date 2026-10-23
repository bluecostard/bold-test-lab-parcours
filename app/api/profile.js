import { readClerkUser } from "../lib/clerkAuth.js";
import { hostedMediaUrl, publicMediaUrl } from "../lib/mediaUrl.js";
import { readProfileRecord, saveProfileRecord } from "../lib/profileStore.js";
import { rateLimited, rateLimitReply } from "../lib/rateLimit.js";

function cleanAvatar(value) {
  const text = typeof value === "string" ? value.trim().slice(0, 800) : "";
  if (!text) return "";
  if (text.startsWith("/api/img?")) return text;
  const hosted = hostedMediaUrl(text, 800);
  if (!hosted) return "";
  return publicMediaUrl(hosted) || hosted;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour continuer." });

  if (req.method === "GET") {
    try {
      const record = await readProfileRecord(user.id);
      return res.status(200).json({
        avatar: cleanAvatar(record?.avatar) || "",
        updatedAt: record?.updatedAt || null,
      });
    } catch (error) {
      console.log("profile-get", String(error?.message || error).slice(0, 180));
      return res.status(500).json({ error: "Profil indisponible." });
    }
  }

  if (req.method !== "PUT" && req.method !== "POST") {
    return res.status(405).json({ error: "Méthode refusée." });
  }

  if (rateLimited(req, "profile-avatar", 20, 60 * 60 * 1000, user.id)) return rateLimitReply(res);

  const avatar = cleanAvatar(req.body?.avatar);
  if (!avatar) {
    return res.status(400).json({ error: "URL de photo invalide." });
  }

  try {
    const record = await saveProfileRecord(user.id, { avatar });
    return res.status(200).json({
      avatar: cleanAvatar(record.avatar) || avatar,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    console.log("profile-put", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Enregistrement de la photo impossible." });
  }
}
