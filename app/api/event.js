const names = new Set(["page_view", "pricing_view", "offer_select", "form_view"]);
const slots = new Set(["nuit", "matin", "apresmidi", "soir", "demimatin", "demisoir", "jour"]);

function clean(value, limit = 80) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  const body = req.body || {};
  if (!names.has(body.name)) return res.status(400).json({ error: "Événement inconnu." });
  console.log("smoke-event", JSON.stringify({
    at: new Date().toISOString(),
    name: body.name,
    slot: slots.has(body.slot) ? body.slot : null,
    source: clean(body.source),
    medium: clean(body.medium),
    campaign: clean(body.campaign),
  }));
  return res.status(200).json({ ok: true });
}
