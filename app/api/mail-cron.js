import { runMailJobs } from "../lib/mailJobs.js";

function authorized(req) {
  if (req.headers["x-vercel-cron"] === "1") return true;
  const secret = process.env.CRON_SECRET || "";
  const header = req.headers.authorization || "";
  return Boolean(secret && header === `Bearer ${secret}`);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  if (!authorized(req)) return res.status(401).json({ error: "Non autorisé." });
  try {
    const sent = await runMailJobs();
    return res.status(200).json({ ok: true, sent });
  } catch (error) {
    console.log("mail-cron", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Envoi impossible pour le moment." });
  }
}
