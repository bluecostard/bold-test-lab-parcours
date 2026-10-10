import { readClerkUser } from "../lib/clerkAuth.js";
import { buildRanking } from "../lib/ranking.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode refusée." });
  try {
    const user = await readClerkUser(req);
    const data = await buildRanking(user?.id || "");
    return res.status(200).json(data);
  } catch (error) {
    console.log("ranking-get", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Classement indisponible." });
  }
}
