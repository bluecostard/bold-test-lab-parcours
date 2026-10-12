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

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function fileFromUrl(value, name, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(value, { signal: controller.signal });
    if (!response.ok) throw new Error("Lecture de l’image impossible.");
    const blob = await response.blob();
    return new File([blob], name || "fichier", { type: blob.type || "application/octet-stream" });
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Envoi d’une image trop lent. Réessayez.");
    throw new Error("Une image n’est plus disponible. Réajoutez-la puis réessayez.");
  } finally {
    clearTimeout(timer);
  }
}

/** Copie immédiate des File (iOS invalide la FileList après le premier await). */
export async function snapshotFiles(fileList) {
  const files = Array.from(fileList || []);
  return Promise.all(files.map(async (file, index) => {
    const buffer = await file.arrayBuffer();
    return new File(
      [buffer],
      file.name || `image-${index + 1}.jpg`,
      { type: file.type || "application/octet-stream", lastModified: file.lastModified || Date.now() },
    );
  }));
}

export function rememberBlobFile(url, file) {
  if (url && file) pending.set(url, file);
}

export function forgetBlobFile(url) {
  if (url) pending.delete(url);
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

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function uploadMediaViaServer(getToken, file, kind) {
  const token = getToken ? await getToken() : "";
  if (!token) throw new Error("Connectez-vous pour envoyer un fichier.");
  const data = await fileToBase64(file);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const response = await fetch(`${origin}/api/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: file.name || `${kind}.jpg`,
      contentType: file.type || "image/jpeg",
      data,
      kind,
    }),
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) throw new Error(payload.error || "Envoi impossible.");
  if (!payload.url) throw new Error("Envoi impossible.");
  return { name: file.name, url: payload.url };
}

async function uploadMediaViaBlobClient(getToken, file, type) {
  const token = getToken ? await getToken() : "";
  if (!token) throw new Error("Connectez-vous pour envoyer un fichier.");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const safe = String(file.name || type).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || type;
  const blob = await upload(`media/${type}/${safe}`, file, {
    access: "public",
    handleUploadUrl: `${origin}/api/upload`,
    multipart: file.size > 4 * 1024 * 1024,
    headers: { Authorization: `Bearer ${token}` },
    clientPayload: JSON.stringify({ kind: type }),
  });
  return { name: file.name, url: blob.url };
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

  // Sur iPhone, l’upload client Vercel Blob bloque souvent dans la WebView :
  // les images passent par /api/media (PUT serveur).
  const job = type === "video"
    ? uploadMediaViaBlobClient(getToken, ready, type)
    : uploadMediaViaServer(getToken, ready, type);
  return withTimeout(job, 45000, "Envoi de l’image trop lent. Vérifiez la connexion et réessayez.");
}

export async function hostMediaValue(getToken, value, name, kind = "image") {
  if (!value) return "";
  if (isHostedMedia(value)) return hostedMediaUrl(value);
  if (typeof value !== "string") return "";
  if (value.startsWith("blob:") || value.startsWith("data:")) {
    const remembered = value.startsWith("blob:") ? pending.get(value) : null;
    const file = remembered || await fileFromUrl(value, name || "image.jpg");
    forgetBlobFile(value);
    const uploaded = await uploadMedia(getToken, file, kind);
    return uploaded.url;
  }
  return "";
}

/** Comme hostMediaValue, mais ne bloque pas : en cas d’échec renvoie "" ou l’URL déjà hébergée. */
export async function hostMediaValueSoft(getToken, value, name, kind = "image") {
  try {
    return await withTimeout(
      hostMediaValue(getToken, value, name, kind),
      50000,
      "Envoi trop lent.",
    );
  } catch {
    return isHostedMedia(value) ? hostedMediaUrl(value) : "";
  }
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
