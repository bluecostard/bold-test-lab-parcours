import { readBooking } from "../lib/bookingStore.js";
import { fulfillBooking } from "../lib/fulfillBooking.js";
import { stripeClient } from "../lib/stripeClient.js";

export const config = { api: { bodyParser: false } };

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function fulfillSession(session) {
  if (!session || session.payment_status === "unpaid") return;
  const userId = session.metadata?.userId;
  const booking = await readBooking(userId);
  if (!booking) return;
  if (booking.sessionId && booking.sessionId !== session.id) return;
  await fulfillBooking(booking, session);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return res.status(503).json({ error: "Webhook indisponible." });
  try {
    const event = stripe.webhooks.constructEvent(await rawBody(req), req.headers["stripe-signature"], secret);
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await fulfillSession(event.data.object);
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.log("stripe-webhook", String(error?.message || error).slice(0, 180));
    return res.status(400).json({ error: "Signature invalide." });
  }
}
