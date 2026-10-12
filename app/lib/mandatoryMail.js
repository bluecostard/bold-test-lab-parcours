import { readBooking } from "./bookingStore.js";
import {
  bookingChangeEmail,
  directMessageEmail,
  reviewQuestionEmail,
} from "./emails.js";
import { sendMail } from "./mail.js";
import { mailToken, readMailPrefs } from "./mailPrefs.js";

function cleanEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

/** Destinataire obligatoire : prefs (même désinscrit marketing) ou e-mail de réservation. */
export async function resolveMailTarget(userId) {
  if (!userId) return null;
  const prefs = await readMailPrefs();
  const sub = prefs.subscribers?.[userId];
  const fromSub = cleanEmail(sub?.email);
  if (fromSub) {
    return { email: fromSub, name: String(sub?.name || "").trim().slice(0, 40), token: mailToken(userId) };
  }
  const booking = await readBooking(userId);
  const fromBooking = cleanEmail(booking?.email);
  if (fromBooking) {
    return { email: fromBooking, name: "", token: mailToken(userId) };
  }
  return null;
}

async function deliver(userId, buildMail) {
  try {
    const target = await resolveMailTarget(userId);
    if (!target) {
      console.log("mandatory-mail-skip", String(userId).slice(0, 16), "no-email");
      return { sent: false, reason: "no-email" };
    }
    const mail = buildMail(target);
    await sendMail({ to: target.email, subject: mail.subject, text: mail.text, html: mail.html });
    console.log("mandatory-mail-sent", mail.subject.slice(0, 40), target.email.replace(/(.{2}).+(@.+)/, "$1…$2"));
    return { sent: true };
  } catch (error) {
    console.log("mandatory-mail-fail", String(error?.message || error).slice(0, 180));
    return { sent: false, reason: "error" };
  }
}

export function notifyReviewQuestion(authorId, { campaignName, question }) {
  if (!authorId) return Promise.resolve({ sent: false, reason: "no-user" });
  return deliver(authorId, (target) => reviewQuestionEmail({
    name: target.name,
    campaignName,
    question,
    token: target.token,
  }));
}

export function notifyDirectMessage(toUserId, { fromName, previewText }) {
  if (!toUserId) return Promise.resolve({ sent: false, reason: "no-user" });
  return deliver(toUserId, (target) => directMessageEmail({
    name: target.name,
    fromName,
    previewText,
    token: target.token,
  }));
}

export function notifyBookingChange(userId, payload) {
  if (!userId) return Promise.resolve({ sent: false, reason: "no-user" });
  return deliver(userId, (target) => bookingChangeEmail({
    name: target.name,
    token: target.token,
    ...payload,
  }));
}
