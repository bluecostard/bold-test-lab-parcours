import { readClerkUser } from "../lib/clerkAuth.js";
import { readMailPrefs, upsertSubscriber } from "../lib/mailPrefs.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour continuer." });
  const prefs = await readMailPrefs();
  const current = prefs.subscribers[user.id] || {
    campaigns: true,
    ranking: true,
    closing: true,
    unsubscribedAt: "",
  };
  if (req.method === "GET") {
    return res.status(200).json({
      campaigns: current.campaigns !== false && !current.unsubscribedAt,
      ranking: current.ranking !== false && !current.unsubscribedAt,
      closing: current.closing !== false && !current.unsubscribedAt,
    });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  const body = req.body || {};
  const next = await upsertSubscriber(user.id, {
    campaigns: body.campaigns !== false,
    ranking: body.ranking !== false,
    closing: body.closing !== false,
    unsubscribedAt: body.campaigns === false && body.ranking === false && body.closing === false
      ? new Date().toISOString()
      : "",
  });
  return res.status(200).json({
    campaigns: next.campaigns !== false && !next.unsubscribedAt,
    ranking: next.ranking !== false && !next.unsubscribedAt,
    closing: next.closing !== false && !next.unsubscribedAt,
  });
}
