import { upload } from "@vercel/blob/client";
import { hostedMediaUrl } from "../../lib/mediaUrl.js";

const imageMax = 10 * 1024 * 1024;
const videoMax = 100 * 1024 * 1024;
const pending = new Map();

export function isHostedMedia(url) {
  return Boolean(hostedMediaUrl(url));
}

export function rememberFile(key, file) {
  if (key && file) pending.set(key, file);
}

export function forgetFile(key) {
  if (key) pending.delete(key);
}

function fileKind(file, kind) {
  if (kind === "video" || file?.type?.startsWith("video/")) return "video";
  return "image";
}

function fileFromDataUrl(value, name) {
  return fetch(value).then((response) => response.blob()).then((blob) => (
    new File([blob], name || "fichier", { type: blob.type || "application/octet-stream" })
  ));
}

export async function uploadMedia(getToken, file, kind = "image") {
  if (!file) throw new Error("Fichier manquant.");
  const type = fileKind(file, kind);
  const max = type === "video" ? videoMax : imageMax;
  if (file.size > max) {
    throw new Error(type === "video" ? "La vidéo dépasse 100 Mo." : "L’image dépasse 10 Mo.");
  }
  if (type === "image" && !file.type.startsWith("image/")) {
    throw new Error("Choisissez une image JPG, PNG ou WebP.");
  }
  if (type === "video" && !file.type.startsWith("video/")) {
    throw new Error("Choisissez une vidéo MP4 ou MOV.");
  }
  const token = getToken ? await getToken() : "";
  if (!token) throw new Error("Connectez-vous pour envoyer un fichier.");
  const safe = String(file.name || type).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || type;
  const blob = await upload(`media/${type}/${safe}`, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    multipart: file.size > 4 * 1024 * 1024,
    headers: { Authorization: `Bearer ${token}` },
    clientPayload: JSON.stringify({ kind: type }),
  });
  return { name: file.name, url: blob.url };
}

export async function hostMediaValue(getToken, value, name, kind = "image") {
  if (!value) return "";
  if (isHostedMedia(value)) return hostedMediaUrl(value);
  if (typeof value === "string" && value.startsWith("data:")) {
    const file = await fileFromDataUrl(value, name);
    const uploaded = await uploadMedia(getToken, file, kind);
    return uploaded.url;
  }
  return "";
}

export async function hostPending(getToken, item, kind = "image") {
  if (!item) return null;
  if (isHostedMedia(item.url)) return { name: item.name || "capture", url: hostedMediaUrl(item.url) };
  const file = item.key ? pending.get(item.key) : null;
  if (!file) return null;
  const uploaded = await uploadMedia(getToken, file, kind);
  pending.delete(item.key);
  return uploaded;
}
