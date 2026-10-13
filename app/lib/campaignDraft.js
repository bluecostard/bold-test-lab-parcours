import { hostedMediaUrl, publicMediaUrl } from "./mediaUrl.js";

function clean(value, limit = 240) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function shortMedia(value) {
  return publicMediaUrl(value) || hostedMediaUrl(value, 500);
}

/** Ordre produit / maquette campagne : toujours les 6, même sans URL. */
export const SOCIAL_NETWORKS = ["Instagram", "TikTok", "Facebook", "LinkedIn", "YouTube", "X"];

/**
 * Normalise les réseaux entrepreneur → affichage campagne.
 * Tous les réseaux de la liste apparaissent ; href null si non renseigné.
 */
export function mapSocials(list) {
  const byLabel = new Map();
  for (const item of Array.isArray(list) ? list : []) {
    const label = clean(item.label || item.platform, 40);
    if (!SOCIAL_NETWORKS.includes(label)) continue;
    const href = clean(item.href || item.url, 300);
    byLabel.set(label, href || null);
  }
  return SOCIAL_NETWORKS.map((label) => ({
    label,
    href: byLabel.get(label) || null,
  }));
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

/** Normalise une consigne entrepreneur → { title, detail } pour la page campagne. */
export function mapInstruction(item) {
  if (typeof item === "string") {
    const title = clean(item, 200);
    return title ? { title, detail: "" } : null;
  }
  if (!item || typeof item !== "object") return null;
  const title = clean(item.title, 120);
  const detail = clean(item.detail || item.text, 400);
  if (!title && !detail) return null;
  if (!title) return { title: detail, detail: "" };
  return { title, detail: detail === title ? "" : detail };
}

/** Pitch vidéo entrepreneur : { src, poster, duration } — durée max 1 min (affichage). */
export function mapFounderPitch(value, screenshots = [], logo = "") {
  if (!value || typeof value !== "object") return null;
  const src = shortMedia(value.src);
  if (!src) return null;
  const raw = clean(value.duration, 8);
  const match = raw.match(/^(\d+):(\d{1,2})$/);
  let duration = "1:00";
  if (match) {
    const seconds = Number(match[1]) * 60 + Number(match[2]);
    if (seconds > 0 && seconds <= 60) {
      duration = `${Number(match[1])}:${String(Number(match[2])).padStart(2, "0")}`;
    }
  }
  return {
    src,
    poster: shortMedia(value.poster) || screenshots[0] || shortMedia(logo) || "",
    duration,
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
  const logo = shortMedia(body.logo);
  return {
    id: `camp-${userId}`.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80),
    ownerId: userId,
    name,
    pitch: clean(body.pitch, 160),
    description: clean(body.description || body.pitch, 400),
    tags: Array.isArray(body.tags) ? body.tags.map((tag) => clean(tag, 40)).filter(Boolean).slice(0, 6) : [],
    logo,
    cover: shortMedia(body.cover) || logo,
    screenshots,
    founderPitch: mapFounderPitch(body.founderPitch, screenshots, logo),
    website,
    productLinks: buildProductLinks({ ...body, name, website }),
    socials: mapSocials(body.socials),
    instructions: Array.isArray(body.instructions) ? body.instructions.map(mapInstruction).filter(Boolean).slice(0, 8) : [],
    appScreens: ["Accueil", "Parcours", "Confirmation"],
    kind: "app",
    live: false,
  };
}
