import { campaignPaidEmail } from "./emails.js";
import { sendMail } from "./mail.js";
import { mailToken, readMailPrefs, upsertSubscriber } from "./mailPrefs.js";
import { readBooking, saveBooking } from "./bookingStore.js";
import { offerByAppleProduct, OFFERS } from "./offers.js";

function cleanEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function formatPaidAmount(booking) {
  const viaApple = Boolean(booking?.appleTransactionId || booking?.appleProductId);
  if (viaApple) {
    const offer = offerByAppleProduct(booking.appleProductId)
      || OFFERS.find((item) => item.price === Number(booking.offerPrice));
    const amount = offer?.applePrice ?? booking.offerPrice;
    if (amount == null || amount === "") return "";
    const text = Number.isInteger(amount) ? String(amount) : String(amount).replace(".", ",");
    return `${text} €`;
  }
  if (booking?.offerPrice == null || booking.offerPrice === "") return "";
  return `${booking.offerPrice} €`;
}

/**
 * Envoie la confirmation au créateur.
 * @param {{ force?: boolean }} [options] — force renvoie même si déjà marqué envoyé.
 * @returns {{ sent: boolean, reason?: string }}
 */
export async function sendCampaignPaidMail(booking, campaign = booking?.campaign, options = {}) {
  if (!booking?.userId || !booking.paid) return { sent: false, reason: "unpaid" };
  if (booking.confirmMailSent && !options.force) return { sent: false, reason: "already" };

  const prefs = await readMailPrefs();
  const sub = prefs.subscribers?.[booking.userId];
  const to = cleanEmail(options.email) || cleanEmail(booking.email) || cleanEmail(sub?.email);
  if (!to) {
    console.log("mail-paid-missing-email", String(booking.userId).slice(0, 24));
    return { sent: false, reason: "no-email" };
  }

  // Claim avant l’envoi pour couper les courses (fulfill + écran confirmation).
  const claim = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const stamped = await saveBooking({
    ...booking,
    email: to,
    confirmMailClaim: claim,
    confirmMailSent: options.force ? booking.confirmMailSent || new Date().toISOString() : new Date().toISOString(),
  });
  if (!options.force) {
    const latest = await readBooking(booking.userId);
    if (latest?.confirmMailClaim && latest.confirmMailClaim !== claim) {
      return { sent: false, reason: "already" };
    }
  }

  const name = String(options.name || sub?.name || campaign?.name || "").trim().slice(0, 40);
  const mail = campaignPaidEmail({
    name,
    campaignName: campaign?.name || booking.campaign?.name || "",
    offerLabel: booking.offerLabel || "",
    offerRange: booking.offerRange || "",
    offerDate: booking.offerDate || "",
    offerPriceLabel: formatPaidAmount(booking),
    token: mailToken(booking.userId),
  });
  try {
    await sendMail({ to, subject: mail.subject, text: mail.text, html: mail.html });
  } catch (error) {
    if (!booking.confirmMailSent && !options.force) {
      await saveBooking({ ...stamped, confirmMailSent: "", confirmMailClaim: "" }).catch(() => {});
    }
    throw error;
  }
  try {
    await upsertSubscriber(booking.userId, { email: to, name: name || sub?.name || "" });
  } catch (error) {
    console.log("mail-paid-sub", String(error?.message || error).slice(0, 120));
  }
  console.log("mail-paid-sent", to.replace(/(.{2}).+(@.+)/, "$1…$2"));
  return { sent: true };
}
