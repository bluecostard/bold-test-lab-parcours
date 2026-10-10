import { notifyAdmin } from "../lib/mail.js";
import { rateLimited, rateLimitReply } from "../lib/rateLimit.js";

function clean(value, limit = 240) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  if (rateLimited(req, "contact", 5, 60 * 60 * 1000)) return rateLimitReply(res);
  const body = req.body || {};
  if (body.website) return res.status(200).json({ ok: true });
  const name = clean(body.name, 80);
  const email = clean(body.email, 254).toLowerCase();
  const message = clean(body.message, 2000);
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Vérifiez le nom, l’e-mail et le message." });
  }
  const text = [
    "Message depuis gemelo.online / Contact",
    "",
    `Nom : ${name}`,
    `E-mail : ${email}`,
    "",
    message,
    "",
    `Date : ${new Date().toISOString()}`,
  ].join("\n");
  try {
    const sent = await notifyAdmin({
      subject: `Contact Gemelo — ${name}`,
      text,
      replyTo: email,
    });
    if (!sent) return res.status(503).json({ error: "L’envoi n’est pas disponible pour le moment." });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.log("contact-mail", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Envoi impossible pour le moment." });
  }
}
