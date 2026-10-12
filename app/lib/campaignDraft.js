import { hostedMediaUrl, publicMediaUrl } from "./mediaUrl.js";

function clean(value, limit = 240) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function shortMedia(value) {
  return publicMediaUrl(value) || hostedMediaUrl(value, 500);
}

const socialIcons = { Instagram: "◎", TikTok: "♪", Facebook: "f", LinkedIn: "in", YouTube: "▶", X: "X" };

export function mapSocials(list) {
  return (Array.isArray(list) ? list : []).map((item) => {
    const label = clean(item.label || item.platform, 40);
    const href = clean(item.href || item.url, 300);
    if (!label) return null;
    return { label, href: href || null, icon: item.icon || socialIcons[label] || "◎" };
  }).filter(Boolean).slice(0, 8);
}

export function draftCampaign(userId, body) {
  const name = clean(body.name, 80);
  const screenshots = Array.isArray(body.screenshots) ? body.screenshots.map(shortMedia).filter(Boolean).slice(0, 6) : [];
  return {
    id: `camp-${userId}`.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80),
    ownerId: userId,
    name,
    pitch: clean(body.pitch, 160),
    description: clean(body.description || body.pitch, 400),
    tags: Array.isArray(body.tags) ? body.tags.map((tag) => clean(tag, 40)).filter(Boolean).slice(0, 6) : [],
    logo: shortMedia(body.logo),
    cover: shortMedia(body.cover) || shortMedia(body.logo),
    screenshots,
    website: clean(body.website, 300),
    productLinks: body.website ? [{ label: "Visiter le site", detail: clean(body.website, 300), href: clean(body.website, 300), icon: "◎" }] : [],
    socials: mapSocials(body.socials),
    instructions: Array.isArray(body.instructions) ? body.instructions.map((item) => clean(item, 200)).filter(Boolean).slice(0, 8) : [],
    appScreens: ["Accueil", "Parcours", "Confirmation"],
    kind: "app",
    live: false,
  };
}
