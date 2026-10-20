/**
 * Pitch entrepreneur — trim + compression avant upload.
 *
 * Seuils produit :
 * - durée max livrée : 60 s
 * - poids max upload : 100 Mo
 * - compression conseillée dès ~40 Mo
 *
 * iOS (TestFlight / Capacitor) : GemeloVideo + AVAssetExportSession.
 * Web / Android récents : MediaRecorder + captureStream.
 */

export const PITCH_MAX_SECONDS = 60;
export const PITCH_DURATION_CHIPS = [15, 30, 45, 60];
export const PITCH_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const PITCH_COMPRESS_BYTES = 40 * 1024 * 1024;
const TARGET_BITS_PER_SECOND = 1_500_000;
const NATIVE_CHUNK = 512 * 1024;

export function formatVideoClock(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function formatFileMegabytes(bytes) {
  const mb = (Number(bytes) || 0) / (1024 * 1024);
  if (mb < 0.1) return "< 0,1 Mo";
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} Mo`.replace(".", ",");
}

export function pitchNeedsTrim(durationSec) {
  return Number(durationSec) > PITCH_MAX_SECONDS;
}

export function pitchNeedsCompress(bytes) {
  return Number(bytes) > PITCH_COMPRESS_BYTES;
}

export function pitchTooHeavy(bytes) {
  return Number(bytes) > PITCH_VIDEO_MAX_BYTES;
}

export function defaultClipLength(durationSec) {
  const duration = Math.max(0, Number(durationSec) || 0);
  if (duration <= 15) return Math.max(1, Math.floor(duration));
  if (duration <= 30) return 15;
  if (duration <= 45) return 30;
  if (duration <= 60) return Math.min(45, Math.floor(duration));
  return 45;
}

export function clampClipWindow(durationSec, startSec, lengthSec) {
  const duration = Math.max(0, Number(durationSec) || 0);
  const length = Math.min(
    PITCH_MAX_SECONDS,
    Math.max(1, Math.round(Number(lengthSec) || defaultClipLength(duration))),
    Math.max(1, Math.floor(duration) || 1),
  );
  const maxStart = Math.max(0, duration - length);
  const start = Math.min(maxStart, Math.max(0, Number(startSec) || 0));
  return { start, end: start + length, length };
}

function nativeBridge() {
  const Cap = typeof window !== "undefined" ? window.Capacitor : null;
  if (!Cap?.isNativePlatform?.() || Cap.getPlatform?.() !== "ios") return null;
  if (typeof Cap.nativePromise !== "function") return null;
  const headers = Cap.PluginHeaders;
  const listed = Array.isArray(headers) && headers.some((h) => h?.name === "GemeloVideo");
  const marked = typeof Cap.isPluginAvailable === "function" ? Cap.isPluginAvailable("GemeloVideo") : listed;
  if (!marked && !listed) return null;
  return {
    ping: () => Cap.nativePromise("GemeloVideo", "ping", {}),
    beginImport: (name) => Cap.nativePromise("GemeloVideo", "beginImport", { name: name || "pitch.mp4" }),
    appendImport: (jobId, data) => Cap.nativePromise("GemeloVideo", "appendImport", { jobId, data }),
    cancelImport: (jobId) => Cap.nativePromise("GemeloVideo", "cancelImport", { jobId }),
    exportClip: (payload) => Cap.nativePromise("GemeloVideo", "exportClip", payload),
  };
}

function pickRecorderMime() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  if (typeof MediaRecorder === "undefined") return "";
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
}

function canExportWeb() {
  if (typeof document === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  if (!pickRecorderMime()) return false;
  const probe = document.createElement("video");
  return typeof probe.captureStream === "function" || typeof probe.mozCaptureStream === "function";
}

export function canExportPitchClip() {
  return Boolean(nativeBridge()) || canExportWeb();
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToFile(base64, name, mimeType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name || "pitch-extrait.mp4", {
    type: mimeType || "video/mp4",
    lastModified: Date.now(),
  });
}

function waitForEvent(target, eventName, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(message));
    }, timeoutMs);
    function onOk() {
      cleanup();
      resolve();
    }
    function onErr() {
      cleanup();
      reject(new Error(message));
    }
    function cleanup() {
      clearTimeout(timer);
      target.removeEventListener(eventName, onOk);
      target.removeEventListener("error", onErr);
    }
    target.addEventListener(eventName, onOk, { once: true });
    target.addEventListener("error", onErr, { once: true });
  });
}

async function seekVideo(video, time) {
  if (!Number.isFinite(time)) return;
  if (Math.abs((video.currentTime || 0) - time) < 0.05) return;
  video.currentTime = time;
  await waitForEvent(video, "seeked", 12000, "Impossible de positionner la vidéo. Réessayez.");
}

async function exportPitchClipNative(file, { start = 0, end = PITCH_MAX_SECONDS, onStatus } = {}) {
  const bridge = nativeBridge();
  if (!bridge) throw new Error("Compression native indisponible.");

  onStatus?.("Préparation iPhone…");
  const { jobId } = await bridge.beginImport(file.name || "pitch.mp4");
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const total = bytes.length || 1;
    for (let offset = 0; offset < bytes.length; offset += NATIVE_CHUNK) {
      const slice = bytes.subarray(offset, Math.min(bytes.length, offset + NATIVE_CHUNK));
      onStatus?.(`Envoi vers compression… ${Math.min(100, Math.round((offset / total) * 100))} %`);
      await bridge.appendImport(jobId, bytesToBase64(slice));
    }
    onStatus?.("Raccourcissement et compression…");
    const window = { start, duration: Math.max(1, (end || PITCH_MAX_SECONDS) - start) };
    const result = await bridge.exportClip({
      jobId,
      start: window.start,
      duration: window.duration,
      maxBytes: PITCH_VIDEO_MAX_BYTES,
    });
    if (!result?.base64) throw new Error("Compression sans résultat. Réessayez.");
    onStatus?.("Extrait prêt.");
    return base64ToFile(result.base64, result.name || "pitch-extrait.mp4", result.mimeType || "video/mp4");
  } catch (error) {
    try {
      await bridge.cancelImport(jobId);
    } catch {
      /* ignore */
    }
    throw new Error(error?.message || "Compression iPhone impossible. Réessayez.");
  }
}

async function exportPitchClipWeb(file, { start = 0, end = PITCH_MAX_SECONDS, onStatus } = {}) {
  const mime = pickRecorderMime();
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = sourceUrl;

  try {
    onStatus?.("Lecture de la vidéo…");
    await waitForEvent(video, "loadedmetadata", 20000, "Impossible de lire cette vidéo. Essayez un MP4.");
    const duration = Number(video.duration);
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Impossible de lire la durée de cette vidéo.");
    }
    const window = clampClipWindow(duration, start, Math.max(1, (end || duration) - start));
    await seekVideo(video, window.start);

    const capture = video.captureStream?.bind(video) || video.mozCaptureStream?.bind(video);
    const stream = capture(30);
    if (!stream) throw new Error("Export vidéo indisponible sur cet appareil.");

    onStatus?.("Raccourcissement en cours…");
    const chunks = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: TARGET_BITS_PER_SECOND,
    });
    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data);
    };

    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error("Échec du raccourcissement. Réessayez ou choisissez un autre fichier."));
    });

    recorder.start(250);
    await video.play();

    await new Promise((resolve) => {
      const tick = () => {
        if (video.currentTime >= window.end - 0.04 || video.ended || video.paused) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      const watchdog = setTimeout(resolve, Math.ceil(window.length * 1000) + 2500);
      const finish = () => {
        clearTimeout(watchdog);
        resolve();
      };
      video.addEventListener("ended", finish, { once: true });
      requestAnimationFrame(tick);
    });

    video.pause();
    stream.getTracks().forEach((track) => track.stop());
    if (recorder.state !== "inactive") recorder.stop();
    await stopped;

    if (!chunks.length) {
      throw new Error("Aucun extrait produit. Réessayez avec un MP4 plus court.");
    }

    const extension = mime.includes("mp4") ? "mp4" : "webm";
    const base = String(file.name || "pitch").replace(/\.[^.]+$/, "") || "pitch";
    const blob = new Blob(chunks, { type: mime.split(";")[0] || "video/webm" });
    onStatus?.("Extrait prêt.");
    return new File([blob], `${base}-extrait.${extension}`, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(sourceUrl);
  }
}

/**
 * Exporte un extrait [start, end] (secondes), recompressé si besoin.
 * @returns {Promise<File>}
 */
export async function exportPitchClip(file, options = {}) {
  if (!file) throw new Error("Fichier manquant.");
  if (nativeBridge()) {
    return exportPitchClipNative(file, options);
  }
  if (canExportWeb()) {
    return exportPitchClipWeb(file, options);
  }
  throw new Error(
    "Cet appareil ne peut pas raccourcir la vidéo ici. Mettez à jour Gemelo (TestFlight), ou exportez un clip ≤ 60 s et ≤ 100 Mo depuis Photos.",
  );
}

export function pitchSizeMessage(bytes) {
  if (pitchTooHeavy(bytes)) {
    return `Fichier trop lourd (${formatFileMegabytes(bytes)}, max. 100 Mo). Choisissez un extrait plus court (15–30 s) : Gemelo le compresse avant l’envoi.`;
  }
  if (pitchNeedsCompress(bytes)) {
    return `Vidéo volumineuse (${formatFileMegabytes(bytes)}). Un extrait plus court partira plus vite (compression automatique).`;
  }
  return "";
}

export function pitchDurationMessage(durationSec) {
  if (!pitchNeedsTrim(durationSec)) return "";
  return `Vidéo trop longue (${formatVideoClock(durationSec)}). Choisissez un extrait de ${PITCH_MAX_SECONDS} s maximum (puces 15 / 30 / 45 / 60 s), puis validez.`;
}
