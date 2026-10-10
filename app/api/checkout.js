import { slotAvailable } from "../lib/availability.js";
import { listCampaigns } from "../lib/campaignStore.js";
import { readClerkUser } from "../lib/clerkAuth.js";
import { draftCampaign } from "../lib/campaignDraft.js";
import { readBooking, saveBooking } from "../lib/bookingStore.js";
import { fulfillBooking } from "../lib/fulfillBooking.js";
import { matchOffer } from "../lib/offers.js";
import { integrationLabel, publicOrigin, stripeClient } from "../lib/stripeClient.js";

function clean(value, limit = 240) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const sessionId = clean(req.query.session_id || req.query.sessionId || "", 120);
    if (!sessionId) {
      const key = process.env.STRIPE_SECRET_KEY || "";
      return res.status(200).json({
        available: Boolean(key),
        livemode: key.startsWith("sk_live"),
      });
    }
    const stripe = stripeClient();
    if (!stripe) return res.status(503).json({ error: "Paiement indisponible pour le moment." });
    const user = await readClerkUser(req);
    if (!user) return res.status(401).json({ error: "Connectez-vous pour payer." });
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.metadata?.userId !== user.id) return res.status(403).json({ error: "Cette session ne vous appartient pas." });
      if (session.payment_status === "unpaid") return res.status(200).json({ paid: false });
      const booking = await readBooking(user.id);
      if (!booking || (booking.sessionId && booking.sessionId !== session.id)) {
        return res.status(404).json({ error: "Réservation introuvable." });
      }
      const paid = await fulfillBooking(booking, session);
      return res.status(200).json({
        paid: true,
        campaignId: paid.campaignId,
        offerLabel: paid.offerLabel,
        offerPrice: paid.offerPrice,
        offerDate: paid.offerDate,
      });
    } catch (error) {
      console.log("checkout-get", String(error?.message || error).slice(0, 180));
      return res.status(400).json({ error: "Paiement introuvable." });
    }
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  const stripe = stripeClient();
  if (!stripe) return res.status(503).json({ error: "Paiement indisponible pour le moment." });
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour payer." });
  const body = req.body || {};
  const offer = matchOffer(body.offerLabel, body.offerRange, body.offerPrice);
  if (!offer) return res.status(400).json({ error: "Cette offre n’existe pas." });
  const offerDate = clean(body.offerDate, 20);
  if (!offerDate) return res.status(400).json({ error: "Choisissez un jour." });
  try {
    const booked = await listCampaigns();
    const existing = await readBooking(user.id);
    if (!slotAvailable(offerDate, offer.label, booked, existing?.campaignId || "")) {
      return res.status(409).json({ error: "Ce créneau est complet. Choisissez un autre jour." });
    }
  } catch (error) {
    console.log("checkout-slot", String(error?.message || error).slice(0, 180));
  }
  const campaign = draftCampaign(user.id, body);
  if (!campaign.name) return res.status(400).json({ error: "Indiquez le nom du projet." });
  const origin = publicOrigin(body.origin || req.headers.origin || "https://gemelo.online");
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "fr",
      customer_email: clean(body.email, 120) || undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: offer.price * 100,
          product_data: {
            name: `Campagne Gemelo — ${offer.label}`,
            description: `${offer.range} · ${offerDate}`,
          },
        },
      }],
      metadata: { userId: user.id },
      integration_identifier: integrationLabel(),
      success_url: `${origin}/?ecran=confirmation&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?ecran=payment`,
    });
    await saveBooking({
      userId: user.id,
      sessionId: session.id,
      paid: false,
      offerLabel: offer.label,
      offerRange: offer.range,
      offerPrice: offer.price,
      offerDate,
      campaign,
      createdAt: new Date().toISOString(),
    });
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.log("checkout-post", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Impossible d’ouvrir Stripe." });
  }
}
