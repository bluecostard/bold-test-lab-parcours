import { readClerkUser } from "../lib/clerkAuth.js";
import { removePushDevice, upsertPushDevice } from "../lib/pushStore.js";
import { rateLimited, rateLimitReply } from "../lib/rateLimit.js";

function clean(value, limit = 200) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour continuer." });

  if (req.method === "DELETE") {
    await removePushDevice(user.id);
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  if (rateLimited(req, "push-token", 30, 60 * 60 * 1000)) return rateLimitReply(res);

  const token = clean(req.body?.token, 200);
  const platform = clean(req.body?.platform, 20) || "ios";
  if (!token) return res.status(400).json({ error: "Jeton manquant." });

  try {
    await upsertPushDevice(user.id, { token, platform });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.log("push-token", String(error?.message || error).slice(0, 120));
    return res.status(400).json({ error: error.message || "Enregistrement impossible." });
  }
}
