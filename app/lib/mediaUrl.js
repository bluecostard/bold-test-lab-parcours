export function hostedMediaUrl(value, limit = 1200) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return "";
  // Proxy image Gemelo (relatif ou absolu).
  if (text.startsWith("/api/img?")) return text.slice(0, limit);
  try {
    const url = new URL(text, "https://gemelo.online");
    if (url.pathname.startsWith("/api/img")) {
      return `${url.pathname}${url.search}`.slice(0, limit);
    }
    if (url.protocol !== "https:") return "";
    if (url.hostname.endsWith(".blob.vercel-storage.com") || url.hostname === "blob.vercel-storage.com") {
      return text.slice(0, limit);
    }
    if (url.hostname === "gemelo.online" || url.hostname.endsWith(".vercel.app")) {
      if (url.pathname.startsWith("/api/img")) return `${url.pathname}${url.search}`.slice(0, limit);
    }
  } catch {
    return "";
  }
  if (text.startsWith("/") && !text.startsWith("//") && !text.includes("..")) {
    return text.slice(0, limit);
  }
  return "";
}

/** URL affichable dans <img> pour un blob privé Vercel. */
export function publicMediaUrl(blobUrl) {
  const raw = hostedMediaUrl(blobUrl, 1200);
  if (!raw) return "";
  if (raw.startsWith("/api/img?")) return raw;
  if (raw.includes(".blob.vercel-storage.com")) {
    return `/api/img?u=${encodeURIComponent(raw)}`;
  }
  return raw;
}

export function publicPhotos(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    const url = publicMediaUrl(typeof item === "string" ? item : item?.url) || hostedMediaUrl(typeof item === "string" ? item : item?.url);
    if (!url) return null;
    const name = typeof item?.name === "string" ? item.name.trim().slice(0, 80) : "capture";
    return { name: name || "capture", url };
  }).filter(Boolean).slice(0, 6);
}
