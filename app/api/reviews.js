import { readClerkUser } from "../lib/clerkAuth.js";
import { readCampaign } from "../lib/campaignStore.js";
import { hostedMediaUrl, publicPhotos } from "../lib/mediaUrl.js";
import { listReviews, readReview, saveReview } from "../lib/reviewStore.js";

async function liveCampaignForPublish(id) {
  if (id === "bed-hop") return { id: "bed-hop", name: "Bed Hop", live: true };
  const campaign = await readCampaign(id);
  if (!campaign || campaign.live === false) return null;
  return campaign;
}

function clean(value, limit = 400) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function publicReview(review) {
  const photos = publicPhotos(review.photos);
  const screenshot = hostedMediaUrl(review.screenshot) || photos[0]?.url || "";
  const videoUrl = hostedMediaUrl(review.videoUrl);
  return {
    id: review.id,
    campaignId: review.campaignId,
    campaignName: review.campaignName || "",
    author: review.author,
    photo: review.photo || "",
    title: review.title,
    text: review.text,
    body: review.body || review.text,
    publishedAt: review.publishedAt,
    likes: review.likes || 0,
    authorId: review.authorId,
    screenshot,
    photos,
    videoUrl,
    videoName: videoUrl ? (review.videoName || "video") : "",
    hadBug: review.hadBug || "",
    battery: review.battery || "",
    designScore: Number.isFinite(review.designScore) ? review.designScore : null,
    journeyScore: Number.isFinite(review.journeyScore) ? review.journeyScore : null,
    screen: review.screen || "",
    bugText: review.bugText || "",
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const campaignId = clean(req.query.campaignId || "", 80);
    const reviewId = clean(req.query.id || "", 80);
    if (!campaignId) return res.status(400).json({ error: "Campagne manquante." });
    try {
      // Lecture autorisée même si la campagne n’est plus live : les avis restent disponibles.
      if (reviewId) {
        const review = await readReview(campaignId, reviewId);
        if (!review || review.hidden) return res.status(404).json({ error: "Avis introuvable." });
        return res.status(200).json({ review: publicReview(review) });
      }
      const reviews = await listReviews(campaignId);
      return res.status(200).json({ reviews: reviews.map(publicReview) });
    } catch (error) {
      console.log("reviews-get", String(error?.message || error).slice(0, 180));
      return res.status(500).json({ error: "Avis indisponibles." });
    }
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour publier." });
  const body = req.body || {};
  const campaignId = clean(body.campaignId, 80);
  const campaign = await liveCampaignForPublish(campaignId);
  if (!campaign) return res.status(400).json({ error: "Les avis se déposent uniquement sur une campagne entrepreneur en cours." });
  const text = clean(body.text || body.body, 2000);
  if (!text) return res.status(400).json({ error: "Écrivez votre avis." });
  const photos = publicPhotos(body.photos);
  const screenshot = hostedMediaUrl(body.screenshot) || photos[0]?.url || "";
  const videoUrl = hostedMediaUrl(body.videoUrl);
  const campaignName = clean(body.campaignName || campaign.name || "", 80);
  const review = {
    id: `avis-${user.id}-${campaignId}`.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80),
    campaignId,
    campaignName,
    authorId: user.id,
    author: clean(body.author, 80) || "Testeur",
    photo: clean(body.photo, 500),
    title: clean(body.title, 120) || "Mon retour d’expérience",
    text: text.slice(0, 280),
    body: text,
    screenshot,
    photos,
    videoUrl,
    videoName: videoUrl ? clean(body.videoName, 80) : "",
    hadBug: clean(body.hadBug, 8),
    battery: clean(body.battery, 20),
    designScore: Number(body.designScore) >= 1 && Number(body.designScore) <= 5 ? Number(body.designScore) : null,
    journeyScore: Number(body.journeyScore) >= 1 && Number(body.journeyScore) <= 5 ? Number(body.journeyScore) : null,
    screen: clean(body.screen, 80),
    bugText: clean(body.bugText, 500),
    publishedAt: new Date().toISOString(),
  };
  try {
    const saved = await saveReview(review);
    return res.status(201).json({ review: publicReview(saved) });
  } catch (error) {
    console.log("reviews-post", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Publication impossible pour le moment." });
  }
}
