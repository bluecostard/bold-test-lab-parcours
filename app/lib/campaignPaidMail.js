import { campaignPaidEmail } from "./emails.js";
import { sendMail } from "./mail.js";
import { mailToken, readMailPrefs, upsertSubscriber } from "./mailPrefs.js";
import { saveBooking } from "./bookingStore.js";

function cleanEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
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

  const name = String(options.name || sub?.name || campaign?.name || "").trim().slice(0, 40);
  const mail = campaignPaidEmail({
    name,
    campaignName: campaign?.name || booking.campaign?.name || "",
    offerLabel: booking.offerLabel || "",
    offerRange: booking.offerRange || "",
    offerDate: booking.offerDate || "",
    offerPrice: booking.offerPrice,
    token: mailToken(booking.userId),
  });
  await sendMail({ to, subject: mail.subject, text: mail.text, html: mail.html });
  try {
    await upsertSubscriber(booking.userId, { email: to, name: name || sub?.name || "" });
  } catch (error) {
    console.log("mail-paid-sub", String(error?.message || error).slice(0, 120));
  }
  await saveBooking({
    ...booking,
    email: to,
    confirmMailSent: new Date().toISOString(),
  });
  console.log("mail-paid-sent", to.replace(/(.{2}).+(@.+)/, "$1…$2"));
  return { sent: true };
}
