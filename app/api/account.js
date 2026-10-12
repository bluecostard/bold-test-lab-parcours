import { readClerkUser } from "../lib/clerkAuth.js";
import { readBooking } from "../lib/bookingStore.js";
import { readCampaign } from "../lib/campaignStore.js";
import { mapInstruction, mapSocials } from "../lib/campaignDraft.js";

function clean(value, limit = 240) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function linkHref(links, label) {
  if (!Array.isArray(links)) return "";
  const hit = links.find((item) => clean(item?.label, 40).toLowerCase() === label.toLowerCase());
  return clean(hit?.href || hit?.url, 300);
}

/** Compte entrepreneur : réservation payée + campagne pour resync après réinstall. */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Méthode refusée." });

  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour continuer." });

  try {
    const booking = await readBooking(user.id);
    if (!booking?.paid) {
      return res.status(200).json({ paid: false });
    }

    const stored = booking.campaignId ? await readCampaign(booking.campaignId) : null;
    const source = stored || booking.campaign || null;
    if (!source) {
      return res.status(200).json({
        paid: true,
        booking: {
          campaignId: booking.campaignId || "",
          offerLabel: booking.offerLabel || "",
          offerRange: booking.offerRange || "",
          offerPrice: booking.offerPrice ?? null,
          offerDate: booking.offerDate || "",
          paidAt: booking.paidAt || "",
          email: clean(booking.email, 254),
        },
        campaign: null,
      });
    }

    const socials = mapSocials(source.socials);
    const instructions = Array.isArray(source.instructions)
      ? source.instructions.map(mapInstruction).filter(Boolean)
      : [];
    const productLinks = Array.isArray(source.productLinks) ? source.productLinks : [];

    return res.status(200).json({
      paid: true,
      booking: {
        campaignId: booking.campaignId || source.id || "",
        offerLabel: booking.offerLabel || source.offerLabel || "",
        offerRange: booking.offerRange || source.offerRange || "",
        offerPrice: booking.offerPrice ?? source.offerPrice ?? null,
        offerDate: booking.offerDate || source.offerDate || "",
        paidAt: booking.paidAt || source.paidAt || "",
        email: clean(booking.email, 254),
      },
      campaign: {
        id: source.id || booking.campaignId || "",
        name: clean(source.name, 80),
        pitch: clean(source.pitch || source.description, 160),
        description: clean(source.description || source.pitch, 400),
        tags: Array.isArray(source.tags) ? source.tags.map((tag) => clean(tag, 40)).filter(Boolean).slice(0, 6) : [],
        logo: clean(source.logo, 500),
        screenshots: Array.isArray(source.screenshots) ? source.screenshots.filter(Boolean).slice(0, 6) : [],
        website: clean(source.website, 300),
        appStore: linkHref(productLinks, "App Store") || clean(source.appStore, 300),
        playStore: linkHref(productLinks, "Google Play") || clean(source.playStore, 300),
        socials: socials.map((item) => ({
          platform: item.label,
          url: item.href || "",
        })),
        instructions: instructions.map((item) => ({
          title: item.title,
          text: item.detail || "",
        })),
      },
    });
  } catch (error) {
    console.log("account-get", String(error?.message || error).slice(0, 180));
    return res.status(500).json({ error: "Compte indisponible." });
  }
}
