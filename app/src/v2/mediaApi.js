import { hostedMediaUrl, publicMediaUrl } from "../../lib/mediaUrl.js";

const imageMax = 10 * 1024 * 1024;
/** Aligné preuves avis (maquette) et pitch entrepreneur. */
export const videoMax = 100 * 1024 * 1024;
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

/** Presets : captures nettes pour le cadre téléphone ; logo plus léger. */
export const IMAGE_PRESETS = {
  logo: { maxSize: 1000, quality: 0.88 },
  screenshot: { maxSize: 1800, quality: 0.92 },
  image: { maxSize: 1600, quality: 0.9 },
};

export async function imageFileToJpeg(file, maxSize = 1600, quality = 0.9) {
  if (!file) throw new Error("Fichier manquant.");
  let bitmap;
  try {
    bitmap = await withTimeout(createImageBitmap(file), 15000, "Lecture de l’image trop lente.");
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
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("Compression de l’image impossible."))),
        "image/jpeg",
        quality,
      );
    });
    const base = String(file.name || "image").replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } finally {
    if (typeof bitmap.close === "function") bitmap.close();
  }
}

/** Une seule passe JPEG (évite la double compression aperçu + upload). */
export async function prepareImageFile(file, kind = "screenshot") {
  const preset = IMAGE_PRESETS[kind] || IMAGE_PRESETS.image;
  let ready = await imageFileToJpeg(file, preset.maxSize, preset.quality);
  // Corps JSON Vercel ~4,5 Mo : base64 ≈ +33 % → rester sous ~2,4 Mo fichier.
  let maxEdge = preset.maxSize;
  let q = preset.quality;
  while (ready.size > 2.4 * 1024 * 1024 && (maxEdge > 1000 || q > 0.78)) {
    maxEdge = Math.max(1000, Math.round(maxEdge * 0.85));
    q = Math.max(0.78, q - 0.04);
    ready = await imageFileToJpeg(file, maxEdge, q);
  }
  return ready;
}

export function previewUrl(file) {
  return file ? URL.createObjectURL(file) : "";
}

/** Durée en secondes via métadonnées vidéo (navigateur). */
export function readVideoDuration(file) {
  if (!file) return Promise.reject(new Error("Fichier manquant."));
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const finish = (fn) => {
      URL.revokeObjectURL(url);
      fn();
    };
    video.onloadedmetadata = () => {
      const duration = Number(video.duration);
      finish(() => {
        if (!Number.isFinite(duration) || duration <= 0) {
          reject(new Error("Impossible de lire la durée de cette vidéo."));
          return;
        }
        resolve(duration);
      });
    };
    video.onerror = () => {
      finish(() => reject(new Error("Cette vidéo ne peut pas être ouverte. Essayez un MP4 ou un MOV.")));
    };
    video.src = url;
  });
}

/** Affichage type maquette : "0:42" / "1:00". */
export function formatPitchDuration(seconds) {
  const total = Math.max(0, Math.min(60, Math.round(Number(seconds) || 0)));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function originUrl() {
  return typeof window !== "undefined" ? window.location.origin : "";
}

async function fileToBase64(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Lecture du fichier impossible.");
  return dataUrl.slice(comma + 1);
}

async function uploadMediaViaServer(getToken, file, kind) {
  const token = getToken ? await getToken() : "";
  if (!token) throw new Error("Connectez-vous pour envoyer un fichier.");
  if (file.size > 3 * 1024 * 1024) {
    throw new Error("Image trop lourde pour l’envoi serveur.");
  }
  const data = await fileToBase64(file);
  const response = await fetch(`${originUrl()}/api/media`, {
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
  if (!response.ok) {
    throw new Error(payload.error || `Envoi impossible (${response.status}).`);
  }
  if (!payload.url) throw new Error("Envoi impossible.");
  return { name: file.name, url: payload.url };
}

async function uploadMediaViaBlobClient(getToken, file, type) {
  const token = getToken ? await getToken() : "";
  if (!token) throw new Error("Connectez-vous pour envoyer un fichier.");
  // @vercel/blob/client ~100 Ko : chargé seulement pour l’upload vidéo, pas au boot.
  const { upload } = await import("@vercel/blob/client");
  const safe = String(file.name || type).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80) || type;
  const blob = await upload(`media/${type}/${safe}`, file, {
    access: "private",
    handleUploadUrl: `${originUrl()}/api/upload`,
    multipart: false,
    headers: { Authorization: `Bearer ${token}` },
    clientPayload: JSON.stringify({ kind: type }),
  });
  return { name: file.name, url: publicMediaUrl(blob.url) };
}

/**
 * @param {string} [kind] — "logo" | "screenshot" | "image" | "video"
 * @param {{ prepared?: boolean }} [options] — prepared: fichier déjà passé par prepareImageFile
 */
export async function uploadMedia(getToken, file, kind = "image", options = {}) {
  if (!file) throw new Error("Fichier manquant.");
  let ready = file;
  const role = kind === "logo" || kind === "screenshot" ? kind : fileKind(file, kind);
  let type = role === "video" ? "video" : "image";
  if (type === "image") {
    const mime = String(file.type || "").toLowerCase();
    if (!mime.startsWith("image/") && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name || "")) {
      throw new Error("Choisissez une image JPG, PNG, WebP ou HEIC.");
    }
    // Une seule compression : ne pas recompresser un JPEG déjà préparé.
    if (!options.prepared) {
      ready = await prepareImageFile(file, role === "logo" ? "logo" : "screenshot");
    }
    type = "image";
  }
  const max = type === "video" ? videoMax : imageMax;
  if (ready.size > max) {
    throw new Error(
      type === "video"
        ? "La vidéo dépasse 100 Mo. Raccourcissez l’extrait dans le pitch (15–45 s) ou compressez-la avant l’envoi."
        : "L’image dépasse 10 Mo.",
    );
  }
  if (type === "video" && !ready.type.startsWith("video/")) {
    throw new Error("Choisissez une vidéo MP4 ou MOV.");
  }

  // Images : upload serveur uniquement (le client Blob échoue souvent dans la WebView iOS).
  if (type === "image") {
    return withTimeout(
      uploadMediaViaServer(getToken, ready, type),
      45000,
      "Envoi de l’image trop lent. Réessayez.",
    );
  }

  return withTimeout(
    uploadMediaViaBlobClient(getToken, ready, type),
    60000,
    "Envoi de la vidéo trop lent. Réessayez.",
  );
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

/** Ne bloque pas le paiement : URL hébergée ou chaîne vide. */
export async function hostMediaValueSoft(getToken, value, name, kind = "image") {
  if (!value) return "";
  if (isHostedMedia(value)) return hostedMediaUrl(value);
  try {
    return await withTimeout(hostMediaValue(getToken, value, name, kind), 20000, "Envoi trop lent.");
  } catch {
    return "";
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
