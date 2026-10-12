import { readClerkUser } from "../lib/clerkAuth.js";
import { readBooking, saveBooking } from "../lib/bookingStore.js";
import { readCampaign, saveCampaign } from "../lib/campaignStore.js";
import { matchOffer } from "../lib/offers.js";
import { notifyBookingChange } from "../lib/mandatoryMail.js";
import { rateLimited, rateLimitReply } from "../lib/rateLimit.js";

function clean(value, limit = 240) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

const MANAGE_MS = 72 * 60 * 60 * 1000;

function slotStartMs(offerDate, offerRange, offerLabel) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(offerDate || ""))) return null;
  const range = String(offerRange || offerLabel || "");
  const hourMatch = range.match(/(\d{1,2})\s*h/i);
  const hour = hourMatch ? Number(hourMatch[1]) : 0;
  const start = new Date(`${offerDate}T${String(hour).padStart(2, "0")}:00:00`);
  return Number.isNaN(start.getTime()) ? null : start.getTime();
}

function canManage(booking) {
  const start = slotStartMs(booking.offerDate, booking.offerRange, booking.offerLabel);
  if (start == null) return false;
  return Date.now() < start - MANAGE_MS;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  if (rateLimited(req, "booking-manage", 20, 60 * 60 * 1000)) return rateLimitReply(res);

  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour continuer." });

  const booking = await readBooking(user.id);
  if (!booking?.paid) return res.status(403).json({ error: "Aucun créneau payé." });
  if (!canManage(booking)) {
    return res.status(403).json({ error: "Modification et annulation fermées — moins de 72 h avant le début." });
  }

  const body = req.body || {};
  const action = clean(body.action, 20);
  const campaign = booking.campaignId ? await readCampaign(booking.campaignId) : null;
  const campaignName = campaign?.name || booking.campaign?.name || "";

  try {
    if (action === "cancel") {
      const nextBooking = {
        ...booking,
        paid: false,
        cancelledAt: new Date().toISOString(),
      };
      await saveBooking(nextBooking);
      if (campaign) {
        await saveCampaign({ ...campaign, live: false });
      }
      notifyBookingChange(user.id, {
        kind: "cancel",
        campaignName,
        offerLabel: booking.offerLabel,
        offerRange: booking.offerRange,
        offerDate: booking.offerDate,
      }).catch(() => {});
      return res.status(200).json({ ok: true, cancelled: true });
    }

    if (action === "update") {
      let offerLabel = booking.offerLabel;
      let offerRange = booking.offerRange;
      let offerPrice = booking.offerPrice;
      const offerDate = clean(body.offerDate, 20) || booking.offerDate;

      if (body.offerLabel || body.offerRange || body.offerPrice != null) {
        const offer = matchOffer(body.offerLabel || offerLabel, body.offerRange || offerRange, body.offerPrice ?? offerPrice);
        if (!offer) return res.status(400).json({ error: "Cette offre n’existe pas." });
        offerLabel = offer.label;
        offerRange = offer.range;
        offerPrice = offer.price;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(offerDate)) {
        return res.status(400).json({ error: "Jour invalide." });
      }

      const nextBooking = {
        ...booking,
        offerLabel,
        offerRange,
        offerPrice,
        offerDate,
        updatedAt: new Date().toISOString(),
      };
      await saveBooking(nextBooking);
      if (campaign) {
        await saveCampaign({
          ...campaign,
          offerLabel,
          offerRange,
          offerPrice,
          offerDate,
          live: true,
        });
      }
      notifyBookingChange(user.id, {
        kind: "update",
        campaignName,
        offerLabel,
        offerRange,
        offerDate,
      }).catch(() => {});
      return res.status(200).json({
        ok: true,
        booking: {
          offerLabel,
          offerRange,
          offerPrice,
          offerDate,
          campaignId: booking.campaignId || "",
        },
      });
    }

    return res.status(400).json({ error: "Action inconnue." });
  } catch (error) {
    console.log("booking-post", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Mise à jour impossible pour le moment." });
  }
}
