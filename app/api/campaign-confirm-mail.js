import { readClerkUser } from "../lib/clerkAuth.js";
import { readBooking } from "../lib/bookingStore.js";
import { readCampaign } from "../lib/campaignStore.js";
import { sendCampaignPaidMail } from "../lib/campaignPaidMail.js";
import { rateLimited, rateLimitReply } from "../lib/rateLimit.js";

function clean(value, limit = 240) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

/** Renvoie / envoie la confirmation de campagne au créateur déjà payé. */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  if (rateLimited(req, "campaign-confirm-mail", 8, 60 * 60 * 1000)) return rateLimitReply(res);
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour continuer." });
  const booking = await readBooking(user.id);
  if (!booking?.paid) return res.status(403).json({ error: "Aucun créneau payé." });
  const email = clean(req.body?.email, 254).toLowerCase();
  const force = req.body?.force !== false;
  try {
    const campaign = booking.campaignId ? await readCampaign(booking.campaignId) : booking.campaign;
    const result = await sendCampaignPaidMail(
      email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { ...booking, email } : booking,
      campaign || booking.campaign,
      { force, email },
    );
    if (!result.sent && result.reason === "no-email") {
      return res.status(400).json({ error: "Indiquez un e-mail pour recevoir la confirmation.", ...result });
    }
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.log("campaign-confirm-mail", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Envoi impossible pour le moment." });
  }
}
