import { Webhook } from "svix";
import { notifyAdmin } from "../lib/mail.js";
import { readMailPrefs, upsertSubscriber } from "../lib/mailPrefs.js";

export const config = { api: { bodyParser: false } };

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function primaryEmail(data) {
  const list = Array.isArray(data?.email_addresses) ? data.email_addresses : [];
  const primaryId = data?.primary_email_address_id;
  const primary = list.find((row) => row?.id === primaryId);
  const email = primary?.email_address || list[0]?.email_address || "";
  return String(email).trim().toLowerCase();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  const secret = String(process.env.CLERK_WEBHOOK_SIGNING_SECRET || "").trim();
  if (!secret) return res.status(503).json({ error: "Webhook indisponible." });

  let evt;
  try {
    const payload = (await rawBody(req)).toString("utf8");
    const wh = new Webhook(secret);
    evt = wh.verify(payload, {
      "svix-id": String(req.headers["svix-id"] || ""),
      "svix-timestamp": String(req.headers["svix-timestamp"] || ""),
      "svix-signature": String(req.headers["svix-signature"] || ""),
    });
  } catch (error) {
    console.log("clerk-webhook", String(error?.message || error).slice(0, 180));
    return res.status(400).json({ error: "Signature invalide." });
  }

  if (evt?.type === "user.created") {
    const data = evt.data || {};
    const userId = String(data.id || "");
    const email = primaryEmail(data);
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
    try {
      if (userId) {
        const prefs = await readMailPrefs();
        if (prefs.subscribers[userId]?.signupAlertSent) {
          return res.status(200).json({ ok: true, skipped: true });
        }
      }
      const text = [
        "Nouvelle inscription Gemelo",
        "",
        `E-mail : ${email || "—"}`,
        `Nom : ${name || "—"}`,
        `Clerk id : ${userId || "—"}`,
        `Date : ${new Date().toISOString()}`,
      ].join("\n");
      await notifyAdmin({
        subject: `Nouvelle inscription Gemelo — ${email || userId || "utilisateur"}`,
        text,
        replyTo: email || undefined,
      });
      if (userId) {
        await upsertSubscriber(userId, {
          email: email || undefined,
          name: name || undefined,
          signupAlertSent: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.log("clerk-webhook-notify", String(error?.message || error).slice(0, 180));
    }
  }

  return res.status(200).json({ ok: true });
}
