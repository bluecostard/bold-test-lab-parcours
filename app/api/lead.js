import tls from "node:tls";
import { rateLimited, rateLimitReply } from "../lib/rateLimit.js";

const prices = Object.freeze({ nuit: 19, matin: 39, apresmidi: 55, soir: 65, demimatin: 49, demisoir: 109, jour: 149 });

function clean(value, limit = 120) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  if (rateLimited(req, "lead", 5, 60 * 60 * 1000)) return rateLimitReply(res);
  const body = req.body || {};
  if (body.website) return res.status(200).json({ ok: true });
  const email = clean(body.email, 254).toLowerCase();
  const project = clean(body.project, 100);
  const url = clean(body.url, 500);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !project || !prices[body.slot] || body.consent !== true) {
    return res.status(400).json({ error: "Vérifiez les champs obligatoires." });
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("url");
  } catch {
    return res.status(400).json({ error: "Indiquez une adresse de site ou de fiche d’application valide." });
  }
  const lead = {
    at: new Date().toISOString(),
    email,
    project,
    url,
    slot: body.slot,
    price: prices[body.slot],
    source: clean(body.source, 80),
    medium: clean(body.medium, 80),
    campaign: clean(body.campaign, 80),
  };
  await Promise.all([notifyWebhook(lead), notifyEmail(lead)]);
  console.log("smoke-lead", JSON.stringify(lead));
  return res.status(201).json({ ok: true });
}

async function notifyWebhook(lead) {
  const webhook = process.env.SMOKE_WEBHOOK;
  if (!webhook) return;
  try {
    await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
  } catch (error) {
    console.log("smoke-mail", JSON.stringify({ ok: false, via: "webhook", error: String(error?.message || error) }));
  }
}

async function notifyEmail(lead) {
  const to = clean(process.env.SMOKE_NOTIFY_EMAIL || "", 254);
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.log("smoke-mail", JSON.stringify({ ok: false, via: "none", error: "missing-to" }));
    return;
  }
  const subject = `Demande Gemelo — ${lead.project} (${lead.price} €)`;
  const text = [
    "Nouvelle demande depuis gemelo.online/besoin",
    "",
    `Projet : ${lead.project}`,
    `Lien : ${lead.url}`,
    `E-mail : ${lead.email}`,
    `Créneau : ${lead.slot} — ${lead.price} €`,
    lead.source ? `Source : ${lead.source}` : "",
    `Date : ${lead.at}`,
  ].filter(Boolean).join("\n");
  const resendKey = process.env.RESEND_API_KEY;
  const gmailUser = clean(process.env.GMAIL_USER || to, 254);
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");
  try {
    if (resendKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.SMOKE_FROM_EMAIL || "Gemelo <beth.t@example.com>",
          to: [to],
          subject,
          text,
        }),
      });
      console.log("smoke-mail", JSON.stringify({ ok: response.ok, via: "resend", status: response.status }));
      return;
    }
    if (gmailPass) {
      const recipients = [...new Set([gmailUser, to].filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)))];
      await sendGmail({ user: gmailUser, pass: gmailPass, recipients, subject, text });
      console.log("smoke-mail", JSON.stringify({ ok: true, via: "gmail", recipients: recipients.length }));
      return;
    }
    console.log("smoke-mail", JSON.stringify({ ok: false, via: "none", error: "missing-mail-provider" }));
  } catch (error) {
    console.log("smoke-mail", JSON.stringify({ ok: false, via: "smtp", error: String(error?.message || error).slice(0, 180) }));
  }
}

function sendGmail({ user, pass, recipients, subject, text }) {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
  const body = text.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
  const payload = [
    `From: Gemelo <${user}>`,
    `To: ${recipients.join(", ")}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    body,
    "",
  ].join("\r\n");

  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: "smtp.gmail.com", port: 465, servername: "smtp.gmail.com" });
    let buffer = "";
    const pending = [];
    const waiters = [];
    let settled = false;

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (error) reject(error);
      else resolve();
    };

    const timer = setTimeout(() => finish(new Error("smtp-timeout")), 15000);

    const takeLine = () => {
      if (pending.length) return Promise.resolve(pending.shift());
      return new Promise((res) => waiters.push(res));
    };

    const expect = async (ok, line) => {
      if (line != null) socket.write(`${line}\r\n`);
      const response = await takeLine();
      const code = Number(response.slice(0, 3));
      if (!ok(code)) throw new Error(response.slice(0, 120));
      return response;
    };

    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      buffer += chunk;
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, index).replace(/\r$/, "");
        buffer = buffer.slice(index + 1);
        if (!/^\d{3}[ -]/.test(line) || line[3] === "-") continue;
        if (waiters.length) waiters.shift()(line);
        else pending.push(line);
      }
    });
    socket.on("error", (error) => finish(error));
    socket.on("end", () => {
      if (!settled) finish(new Error("smtp-end"));
    });

    (async () => {
      try {
        await expect((code) => code === 220, null);
        await expect((code) => code === 250, "EHLO gemelo.online");
        await expect((code) => code === 334, "AUTH LOGIN");
        await expect((code) => code === 334, Buffer.from(user, "utf8").toString("base64"));
        await expect((code) => code === 235, Buffer.from(pass, "utf8").toString("base64"));
        await expect((code) => code === 250, `MAIL FROM:<${user}>`);
        for (const recipient of recipients) {
          await expect((code) => code === 250, `RCPT TO:<${recipient}>`);
        }
        await expect((code) => code === 354, "DATA");
        await expect((code) => code === 250, `${payload}\r\n.`);
        await expect((code) => code === 221, "QUIT");
        finish();
      } catch (error) {
        finish(error);
      }
    })();
  });
}
