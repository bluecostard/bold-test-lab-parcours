import { readCampaign } from "../lib/campaignStore.js";
import { demoReviewsForAuthor } from "../lib/demoTesterReviews.js";
import { projectNameFor } from "../lib/projectNames.js";
import { findRankingPerson } from "../lib/ranking.js";
import { listAllReviews } from "../lib/reviewStore.js";

function clean(value, limit = 120) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

async function resolveCampaignName(campaignId) {
  const known = projectNameFor(campaignId);
  if (known) return known;
  if (campaignId === "bed-hop") return "Bed Hop";
  try {
    const campaign = await readCampaign(campaignId);
    return campaign?.name || campaignId || "";
  } catch {
    return campaignId || "";
  }
}

function publicReviewCard(review, campaignName) {
  return {
    id: review.id,
    campaignId: review.campaignId || "",
    campaignName: campaignName || review.campaignName || "",
    title: review.title || "Mon retour d’expérience",
    text: review.text || review.body || "",
    likes: Number(review.likes) || 0,
    publishedAt: review.publishedAt || "",
  };
}

async function liveReviewsForAuthor(authorId, name) {
  const reviews = await listAllReviews();
  const matched = reviews.filter((review) => {
    if (review.hidden) return false;
    if (authorId && review.authorId === authorId) return true;
    if (name && review.author === name) return true;
    return false;
  });
  matched.sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));
  const top = matched.slice(0, 5);
  const cards = [];
  for (const review of top) {
    const campaignName = await resolveCampaignName(review.campaignId);
    cards.push(publicReviewCard(review, campaignName));
  }
  return cards;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode refusée." });
  const authorId = clean(req.query.authorId || "", 80);
  const name = clean(req.query.name || "", 80);
  if (!authorId && !name) return res.status(400).json({ error: "Indiquez authorId ou name." });

  try {
    const person = await findRankingPerson({ authorId, name });
    if (!person) return res.status(404).json({ error: "Testeur introuvable." });

    let reviews = await liveReviewsForAuthor(person.authorId || authorId, person.name || name);
    if (!reviews.length) reviews = demoReviewsForAuthor(person.name).map((item) => publicReviewCard(item, item.campaignName));

    return res.status(200).json({
      tester: {
        id: person.id,
        authorId: person.authorId || "",
        name: person.name,
        photo: person.photo || "",
        phrase: person.phrase || "",
        points: person.points || 0,
        tested: person.tested || 0,
        projectId: person.projectId || "",
        projectName: person.projectName || projectNameFor(person.projectId) || "",
        place: person.place || 0,
        live: Boolean(person.live),
      },
      reviews,
    });
  } catch (error) {
    console.log("tester-get", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Profil testeur indisponible." });
  }
}
