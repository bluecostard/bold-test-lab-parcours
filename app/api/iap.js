import { randomUUID } from "node:crypto";
import { slotAvailable } from "../lib/availability.js";
import { listCampaigns } from "../lib/campaignStore.js";
import { readClerkUser } from "../lib/clerkAuth.js";
import { draftCampaign } from "../lib/campaignDraft.js";
import { readBooking, saveBooking } from "../lib/bookingStore.js";
import { fulfillBooking } from "../lib/fulfillBooking.js";
import { matchOffer, offerByAppleProduct } from "../lib/offers.js";
import { appleIapConfigured, verifyAppleTransaction } from "../lib/appleIap.js";

function clean(value, limit = 240) {
  if (value == null) return "";
  return String(value).trim().slice(0, limit);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    return res.status(200).json({ available: appleIapConfigured() });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  if (!appleIapConfigured()) return res.status(503).json({ error: "Achats Apple indisponibles pour le moment." });
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour payer." });
  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  if (body.jws || body.transactionId) {
    const booking = await readBooking(user.id);
    if (!booking || booking.sessionId !== clean(body.bookingRef, 80)) {
      return res.status(404).json({ error: "Réservation introuvable." });
    }
    try {
      const paidTx = await verifyAppleTransaction({
        transactionId: clean(body.transactionId, 80),
        jws: clean(body.jws, 200000),
        productId: booking.appleProductId,
      });
      const offer = offerByAppleProduct(paidTx.productId);
      if (!offer || offer.label !== booking.offerLabel || offer.price !== booking.offerPrice) {
        return res.status(400).json({ error: "Cet achat ne correspond pas à l’offre." });
      }
      if (booking.paid && booking.appleTransactionId && booking.appleTransactionId !== paidTx.transactionId) {
        return res.status(409).json({ error: "Cette réservation est déjà payée." });
      }
      if (booking.paid && booking.appleTransactionId === paidTx.transactionId) {
        return res.status(200).json({
          paid: true,
          campaignId: booking.campaignId,
          offerLabel: booking.offerLabel,
          offerPrice: booking.offerPrice,
          offerDate: booking.offerDate,
        });
      }
      const paid = await fulfillBooking(booking, { id: `iap:${paidTx.transactionId}` });
      const locked = await saveBooking({
        ...paid,
        appleTransactionId: paidTx.transactionId,
        appleEnvironment: paidTx.environment || "",
      });
      return res.status(200).json({
        paid: true,
        campaignId: locked.campaignId,
        offerLabel: locked.offerLabel,
        offerPrice: locked.offerPrice,
        offerDate: locked.offerDate,
      });
    } catch (error) {
      console.log("iap-confirm", String(error?.message || error).slice(0, 180));
      return res.status(400).json({ error: error.message || "Achat Apple introuvable." });
    }
  }

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
    console.log("iap-slot", String(error?.message || error).slice(0, 180));
  }
  const campaign = draftCampaign(user.id, body);
  if (!campaign.name) return res.status(400).json({ error: "Indiquez le nom du projet." });
  const bookingRef = `iap-${randomUUID()}`;
  await saveBooking({
    userId: user.id,
    sessionId: bookingRef,
    paid: false,
    offerLabel: offer.label,
    offerRange: offer.range,
    offerPrice: offer.price,
    offerDate,
    appleProductId: offer.appleProductId,
    email: clean(body.email, 254).toLowerCase(),
    campaign,
    createdAt: new Date().toISOString(),
  });
  return res.status(200).json({ productId: offer.appleProductId, bookingRef });
}
