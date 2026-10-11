import { findSubscriberByToken, upsertSubscriber } from "../lib/mailPrefs.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const token = String(req.query?.t || req.body?.t || "").trim();
  const found = token ? await findSubscriberByToken(token) : null;
  if (!found) {
    res.status(400).setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("<!doctype html><meta charset=utf-8><title>Lien invalide</title><p>Ce lien de désinscription n’est plus valable.</p>");
  }
  if (req.method === "GET" || req.method === "POST") {
    await upsertSubscriber(found.userId, {
      campaigns: false,
      ranking: false,
      closing: false,
      unsubscribedAt: new Date().toISOString(),
    });
    res.status(200).setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end("<!doctype html><meta charset=utf-8><title>Désinscription</title><p>Vous ne recevrez plus les e-mails de campagnes, de classement et de clôture. L’accès à Gemelo reste ouvert.</p><p><a href=\"https://gemelo.online/?app=1&ecran=settings\">Gérer mes notifications</a></p>");
  }
  return res.status(405).json({ error: "Méthode refusée." });
}
