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

function mapProductLink(item) {
  const label = clean(item?.label, 40);
  const href = clean(item?.href || item?.url, 300);
  if (!label || !href) return null;
  return {
    label,
    detail: clean(item.detail, 120) || href,
    href,
    icon: clean(item.icon, 8) || "◎",
  };
}

/** Construit productLinks façon Bed Hop (App Store / Google Play / Visiter le site). */
export function buildProductLinks(body = {}) {
  if (Array.isArray(body.productLinks) && body.productLinks.length) {
    return body.productLinks.map(mapProductLink).filter(Boolean).slice(0, 6);
  }
  const name = clean(body.name, 80);
  const website = clean(body.website || body.projectLink, 300);
  const appStore = clean(body.appStore || body.projectAppStore, 300);
  const playStore = clean(body.playStore || body.projectPlayStore, 300);
  const links = [];
  if (appStore) {
    links.push({ label: "App Store", detail: "Ouvrir sur l’App Store", href: appStore, icon: "●" });
  }
  if (playStore) {
    links.push({ label: "Google Play", detail: "Ouvrir sur Google Play", href: playStore, icon: "▶" });
  }
  if (website) {
    links.push({
      label: "Visiter le site",
      detail: name ? `Découvrir ${name} sur le web` : "Découvrir sur le web",
      href: website,
      icon: "◎",
    });
  }
  return links.slice(0, 6);
}

export function draftCampaign(userId, body) {
  const name = clean(body.name, 80);
  const screenshots = Array.isArray(body.screenshots) ? body.screenshots.map(shortMedia).filter(Boolean).slice(0, 6) : [];
  const website = clean(body.website, 300);
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
    website,
    productLinks: buildProductLinks({ ...body, name, website }),
    socials: mapSocials(body.socials),
    instructions: Array.isArray(body.instructions) ? body.instructions.map((item) => clean(item, 200)).filter(Boolean).slice(0, 8) : [],
    appScreens: ["Accueil", "Parcours", "Confirmation"],
    kind: "app",
    live: false,
  };
}
