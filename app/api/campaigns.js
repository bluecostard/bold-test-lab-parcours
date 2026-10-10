import { readClerkUser } from "../lib/clerkAuth.js";
import { listCampaigns, readCampaign, saveCampaign } from "../lib/campaignStore.js";
import { draftCampaign, mapSocials } from "../lib/campaignDraft.js";
import { readBooking } from "../lib/bookingStore.js";

function clean(value, limit = 240) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function publicCampaign(campaign) {
  return {
    id: campaign.id,
    name: campaign.name,
    pitch: campaign.pitch,
    description: campaign.description || campaign.pitch,
    tags: Array.isArray(campaign.tags) ? campaign.tags.slice(0, 6) : [],
    logo: campaign.logo || "",
    cover: campaign.cover || campaign.logo || "",
    screenshots: Array.isArray(campaign.screenshots) ? campaign.screenshots.filter(Boolean).slice(0, 6) : [],
    website: campaign.website || "",
    productLinks: Array.isArray(campaign.productLinks) ? campaign.productLinks.slice(0, 6) : [],
    socials: mapSocials(campaign.socials),
    instructions: Array.isArray(campaign.instructions) ? campaign.instructions.slice(0, 8) : [],
    appScreens: Array.isArray(campaign.appScreens) ? campaign.appScreens.slice(0, 8) : ["Accueil", "Parcours", "Confirmation"],
    kind: campaign.kind || "app",
    live: campaign.live !== false,
    offerLabel: campaign.offerLabel || "",
    offerRange: campaign.offerRange || "",
    offerPrice: campaign.offerPrice || 0,
    offerDate: campaign.offerDate || "",
    ownerId: campaign.ownerId || "",
    publishedAt: campaign.publishedAt,
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const id = clean(req.query.id || "", 80);
    try {
      if (id) {
        const campaign = await readCampaign(id);
        if (!campaign || campaign.live === false) return res.status(404).json({ error: "Campagne introuvable." });
        return res.status(200).json({ campaign: publicCampaign(campaign) });
      }
      const campaigns = (await listCampaigns()).filter((item) => item.live !== false);
      return res.status(200).json({ campaigns: campaigns.map(publicCampaign) });
    } catch (error) {
      console.log("campaigns-get", String(error?.message || error).slice(0, 180));
      return res.status(500).json({ error: "Campagnes indisponibles." });
    }
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour publier une campagne." });
  const booking = await readBooking(user.id);
  if (!booking?.paid) return res.status(403).json({ error: "Le créneau se publie après le paiement." });
  const body = req.body || {};
  const campaign = draftCampaign(user.id, { ...booking.campaign, ...body });
  if (!campaign.name) return res.status(400).json({ error: "Indiquez le nom du projet." });
  campaign.live = true;
  campaign.offerLabel = booking.offerLabel;
  campaign.offerRange = booking.offerRange;
  campaign.offerPrice = booking.offerPrice;
  campaign.offerDate = booking.offerDate;
  campaign.publishedAt = booking.paidAt || new Date().toISOString();
  try {
    const saved = await saveCampaign(campaign);
    return res.status(201).json({ campaign: publicCampaign(saved) });
  } catch (error) {
    console.log("campaigns-post", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Enregistrement impossible pour le moment." });
  }
}
