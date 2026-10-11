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

export async function imageFileToJpeg(file, maxSize = 1280) {
  if (!file) throw new Error("Fichier manquant.");
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
    bitmap = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onerror = () => reject(new Error("Cette image ne peut pas être ouverte. Essayez un JPG ou un PNG."));
      image.onload = () => resolve(image);
      image.src = dataUrl;
    });
  }
  try {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Compression de l’image impossible.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Compression de l’image impossible."))), "image/jpeg", 0.85);
    });
    const base = String(file.name || "image").replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } finally {
    if (typeof bitmap.close === "function") bitmap.close();
  }
}

export function previewUrl(file) {
  return file ? URL.createObjectURL(file) : "";
}

export async function uploadMedia(getToken, file, kind = "image") {
  if (!file) throw new Error("Fichier manquant.");
  let ready = file;
  let type = fileKind(file, kind);
  if (type === "image") {
    const mime = String(file.type || "").toLowerCase();
    if (!mime.startsWith("image/") && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name || "")) {
      throw new Error("Choisissez une image JPG, PNG, WebP ou HEIC.");
    }
    if (mime !== "image/jpeg" && mime !== "image/png" && mime !== "image/webp" && mime !== "image/gif") {
      ready = await imageFileToJpeg(file);
    }
    type = "image";
  }
  const max = type === "video" ? videoMax : imageMax;
  if (ready.size > max) {
    throw new Error(type === "video" ? "La vidéo dépasse 100 Mo." : "L’image dépasse 10 Mo.");
  }
  if (type === "video" && !ready.type.startsWith("video/")) {
    throw new Error("Choisissez une vidéo MP4 ou MOV.");
  }
  file = ready;
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
  if (typeof value === "string" && (value.startsWith("data:") || value.startsWith("blob:"))) {
    const file = await fileFromDataUrl(value, name || "image.jpg");
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
