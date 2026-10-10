import { readClerkUser } from "../lib/clerkAuth.js";
import { notifyAdmin } from "../lib/mail.js";
import { rateLimited, rateLimitReply } from "../lib/rateLimit.js";
import { addFlag, countFlags, hideReview, listReviews, readReview } from "../lib/reviewStore.js";

const reasons = new Set(["illicite", "spam", "hors-sujet", "autre"]);

function clean(value, limit = 80) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

async function findReview(reviewId, campaignId) {
  if (campaignId) {
    const review = await readReview(campaignId, reviewId);
    if (review) return review;
  }
  const reviews = await listReviews("bed-hop");
  return reviews.find((item) => item.id === reviewId) || null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour signaler un avis." });
  if (rateLimited(req, "flags", 20, 60 * 60 * 1000, user.id)) return rateLimitReply(res);
  const reviewId = clean(req.body?.reviewId);
  const campaignId = clean(req.body?.campaignId || "bed-hop");
  const reason = clean(req.body?.reason, 20);
  const detail = clean(req.body?.detail, 400);
  if (!reviewId) return res.status(400).json({ error: "Avis manquant." });
  if (!reasons.has(reason)) return res.status(400).json({ error: "Choisissez un motif." });
  try {
    const review = await findReview(reviewId, campaignId);
    if (!review) return res.status(404).json({ error: "Avis introuvable." });
    if (review.authorId && review.authorId === user.id) {
      return res.status(403).json({ error: "Vous ne pouvez pas signaler votre avis." });
    }
    const result = await addFlag({ reviewId, campaignId, userId: user.id, reason, detail });
    const flags = await countFlags(reviewId);
    const hidden = reason === "illicite" || flags >= 2;
    if (hidden) await hideReview(campaignId, reviewId, reason);
    if (result.created) {
      notifyAdmin({
        subject: hidden ? `Avis masqué — ${reason}` : `Signalement Gemelo — ${reason}`,
        text: [
          "Signalement d’un avis sur gemelo.online",
          "",
          `Avis : ${reviewId}`,
          `Campagne : ${campaignId}`,
          `Auteur : ${review.author || review.authorId || "?"}`,
          `Motif : ${reason}`,
          detail ? `Précision : ${detail}` : "",
          `Signalements : ${flags}`,
          hidden ? "L’avis a été retiré de l’affichage public." : "L’avis reste visible pour le moment.",
          `Date : ${new Date().toISOString()}`,
        ].filter(Boolean).join("\n"),
      }).catch((error) => {
        console.log("flags-mail", String(error?.message || error).slice(0, 180));
      });
    }
    return res.status(200).json({ ok: true, hidden });
  } catch (error) {
    console.log("flags-post", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Signalement impossible pour le moment." });
  }
}
