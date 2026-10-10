export function hostedMediaUrl(value, limit = 500) {
  const text = typeof value === "string" ? value.trim().slice(0, limit) : "";
  if (!text) return "";
  if (text.startsWith("/") && !text.startsWith("//") && !text.includes("..")) return text;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:") return "";
    if (url.hostname.endsWith(".blob.vercel-storage.com")) return text;
  } catch {
    return "";
  }
  return "";
}

export function publicPhotos(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => {
    const url = hostedMediaUrl(typeof item === "string" ? item : item?.url);
    if (!url) return null;
    const name = typeof item?.name === "string" ? item.name.trim().slice(0, 80) : "capture";
    return { name: name || "capture", url };
  }).filter(Boolean).slice(0, 6);
}
