import { readClerkUser } from "../lib/clerkAuth.js";
import { welcomeEmail } from "../lib/emails.js";
import { sendMail } from "../lib/mail.js";
import { mailToken, readMailPrefs, markWelcomeSent } from "../lib/mailPrefs.js";
import { rateLimited, rateLimitReply } from "../lib/rateLimit.js";

function clean(value, limit = 240) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  if (rateLimited(req, "welcome", 6, 60 * 60 * 1000)) return rateLimitReply(res);
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour continuer." });
  const email = clean(req.body?.email, 254).toLowerCase();
  const name = clean(req.body?.name, 24);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Indiquez un e-mail valide." });
  }
  try {
    const prefs = await readMailPrefs();
    if (prefs.subscribers[user.id]?.welcomeSent) return res.status(200).json({ ok: true, sent: false });
    const mail = welcomeEmail({ name, token: mailToken(user.id) });
    await sendMail({ to: email, subject: mail.subject, text: mail.text, html: mail.html });
    await markWelcomeSent(user.id, email, name);
    return res.status(200).json({ ok: true, sent: true });
  } catch (error) {
    console.log("welcome-mail", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Envoi impossible pour le moment." });
  }
}
