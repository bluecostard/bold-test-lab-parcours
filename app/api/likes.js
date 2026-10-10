import { readClerkUser } from "../lib/clerkAuth.js";
import { addLike, listReviews, readReview } from "../lib/reviewStore.js";

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
  if (!user) return res.status(401).json({ error: "Connectez-vous pour aimer un avis." });
  const reviewId = clean(req.body?.reviewId);
  const campaignId = clean(req.body?.campaignId || "bed-hop");
  if (!reviewId) return res.status(400).json({ error: "Avis manquant." });
  try {
    const review = await findReview(reviewId, campaignId);
    if (review?.authorId && review.authorId === user.id) {
      return res.status(403).json({ error: "Vous ne pouvez pas aimer votre avis." });
    }
    const likes = await addLike(reviewId, user.id);
    return res.status(200).json({ ok: true, likes });
  } catch (error) {
    console.log("likes-post", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Like impossible pour le moment." });
  }
}
