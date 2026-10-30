import { requireAdmin } from "../lib/adminAuth.js";
import { listCampaigns, readCampaign, saveCampaign } from "../lib/campaignStore.js";
import { listPaidBookings } from "../lib/bookingStore.js";
import { buildRanking } from "../lib/ranking.js";
import { countFlags, hideReview, listAllReviews } from "../lib/reviewStore.js";
import { list } from "@vercel/blob";

function clean(value, limit = 200) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function colorFor(id = "") {
  const palette = ["orange", "green", "purple", "blue", "rose"];
  let hash = 0;
  for (const ch of String(id)) hash = (hash + ch.charCodeAt(0)) % palette.length;
  return palette[hash];
}

function campaignStatus(campaign, now = Date.now()) {
  if (campaign.adminStatus) return campaign.adminStatus;
  if (campaign.live === false) return "paused";
  const start = campaign.offerDate ? Date.parse(`${campaign.offerDate}T00:00:00`) : NaN;
  const price = Number(campaign.offerPrice) || 0;
  const hours = /24/.test(campaign.offerLabel || "") ? 24 : /12/.test(campaign.offerLabel || "") ? 12 : 6;
  if (Number.isFinite(start)) {
    const end = start + hours * 3600 * 1000;
    if (now < start) return "scheduled";
    if (now >= end) return "completed";
  }
  if (price > 0) return "active";
  return "pending";
}

function mapCampaign(campaign, reviewCount = 0) {
  const status = campaignStatus(campaign);
  const offer = campaign.offerLabel || campaign.offerRange || "—";
  const price = Number(campaign.offerPrice) || 0;
  return {
    id: campaign.id,
    name: campaign.name || campaign.id,
    owner: campaign.ownerName || campaign.ownerId || "—",
    category: Array.isArray(campaign.tags) ? campaign.tags.join(" · ") : "Campagne",
    initial: initials(campaign.name || campaign.id),
    color: colorFor(campaign.id),
    status,
    slot: campaign.offerDate
      ? `${campaign.offerDate}${campaign.offerRange ? ` · ${campaign.offerRange}` : ""}`
      : offer,
    date: campaign.offerDate || "",
    start: "",
    offer,
    price,
    tests: reviewCount,
    target: 100,
    description: campaign.description || campaign.pitch || "",
    objective: "",
    platform: Array.isArray(campaign.productLinks)
      ? campaign.productLinks.map((l) => l.label).filter(Boolean).join(" · ") || "—"
      : "—",
    private: Boolean(campaign.private),
    live: campaign.live !== false,
    publishedAt: campaign.publishedAt || "",
  };
}

async function listFlaggedReviewIds() {
  const listed = await list({ prefix: "flags/", limit: 500 });
  const counts = new Map();
  for (const blob of listed.blobs) {
    if (!blob.pathname.endsWith(".json")) continue;
    const parts = blob.pathname.split("/");
    const reviewId = parts[1];
    if (!reviewId) continue;
    counts.set(reviewId, (counts.get(reviewId) || 0) + 1);
  }
  return counts;
}

async function snapshot() {
  const [campaignsRaw, reviewsRaw, bookings, ranking] = await Promise.all([
    listCampaigns(),
    listAllReviews(),
    listPaidBookings(),
    buildRanking(""),
  ]);
  const flagCounts = await listFlaggedReviewIds();
  const reviewsByCampaign = new Map();
  for (const review of reviewsRaw) {
    const key = review.campaignId || "";
    reviewsByCampaign.set(key, (reviewsByCampaign.get(key) || 0) + (review.hidden ? 0 : 1));
  }

  const campaigns = campaignsRaw.map((c) => mapCampaign(c, reviewsByCampaign.get(c.id) || 0));

  const rankRows = ranking.ranking || [];
  const usersFromRank = rankRows.map((row) => ({
    id: row.authorId || row.id,
    name: row.name,
    initial: initials(row.name),
    color: colorFor(row.id),
    email: "",
    role: "Testeur",
    project: row.projectName || "—",
    points: row.points || 0,
    tests: row.tested || 0,
    signed: true,
    status: "active",
  }));

  const reviews = await Promise.all(
    reviewsRaw.slice(0, 200).map(async (review) => {
      const flags = flagCounts.get(review.id) || (await countFlags(review.id).catch(() => 0));
      const status = review.hidden ? "hidden" : flags > 0 ? "flagged" : "published";
      return {
        id: review.id,
        user: review.authorId || review.author || "—",
        userName: review.author || "Testeur",
        project: review.campaignName || review.campaignId || "—",
        campaignId: review.campaignId || "",
        type: review.kind || review.type || "Avis",
        text: review.text || "",
        likes: Number(review.likes) || 0,
        status,
        design: review.design || "",
        journey: review.journey || "",
        battery: review.battery || "",
        screen: review.screen || "",
        device: review.device || "",
        flag: flags ? `${flags} signalement(s)` : "",
        publishedAt: review.publishedAt || "",
      };
    }),
  );

  const payments = bookings.map((b, index) => ({
    id: b.paymentIntentId || b.transactionId || `PAY-${index + 1}`,
    campaign: b.campaignId || "",
    name: b.projectName || b.offerLabel || "Campagne",
    amount: Number(b.amount || b.offerPrice || 0),
    status: b.paid ? "paid" : b.refunded ? "refunded" : "failed",
    date: b.paidAt || b.updatedAt || b.createdAt || "",
    ref: b.paymentIntentId || b.transactionId || "",
    userId: b.userId || "",
  }));

  return {
    campaigns,
    users: usersFromRank,
    reviews,
    payments,
    ranking: rankRows,
    settings: {
      name: "Gemelo",
      email: process.env.ADMIN_NOTIFY_EMAIL || "bonjour@gemelo.online",
      charter: "1.0",
      notifications: true,
      moderation: true,
    },
    log: [
      {
        title: "Snapshot admin chargé",
        detail: `${new Date().toLocaleString("fr-FR")} · ${campaigns.length} campagnes · ${reviews.length} avis`,
      },
    ],
    meta: {
      generatedAt: new Date().toISOString(),
      source: "live",
    },
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!(await requireAdmin(req, res))) return;

  try {
    if (req.method === "GET") {
      const data = await snapshot();
      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const action = clean(req.body?.action, 40);
      if (action === "hide-review") {
        const campaignId = clean(req.body?.campaignId, 80);
        const reviewId = clean(req.body?.reviewId, 80);
        const reason = clean(req.body?.reason, 120) || "moderation-admin";
        if (!campaignId || !reviewId) return res.status(400).json({ error: "Avis incomplet." });
        const hidden = await hideReview(campaignId, reviewId, reason);
        if (!hidden) return res.status(404).json({ error: "Avis introuvable." });
        return res.status(200).json({ ok: true, review: hidden });
      }
      if (action === "pause-campaign" || action === "resume-campaign") {
        const id = clean(req.body?.campaignId, 80);
        const campaign = await readCampaign(id);
        if (!campaign) return res.status(404).json({ error: "Campagne introuvable." });
        campaign.live = action === "resume-campaign";
        campaign.adminStatus = action === "pause-campaign" ? "paused" : "";
        await saveCampaign(campaign);
        return res.status(200).json({ ok: true, campaign: mapCampaign(campaign) });
      }
      if (action === "reject-campaign") {
        const id = clean(req.body?.campaignId, 80);
        const reason = clean(req.body?.reason, 400);
        const campaign = await readCampaign(id);
        if (!campaign) return res.status(404).json({ error: "Campagne introuvable." });
        campaign.live = false;
        campaign.adminStatus = "rejected";
        campaign.adminRejectReason = reason;
        await saveCampaign(campaign);
        return res.status(200).json({ ok: true, campaign: mapCampaign(campaign) });
      }
      return res.status(400).json({ error: "Action inconnue." });
    }

    return res.status(405).json({ error: "Méthode refusée." });
  } catch (error) {
    console.error("admin", error);
    return res.status(500).json({ error: error?.message || "Erreur admin." });
  }
}
