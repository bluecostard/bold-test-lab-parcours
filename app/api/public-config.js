export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode refusée." });
  const clerkPublishableKey = String(process.env.VITE_CLERK_PUBLISHABLE_KEY || "").trim();
  return res.status(200).json({ clerkPublishableKey });
}
