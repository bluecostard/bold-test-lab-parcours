const hits = new Map();

function clientKey(req, extra = "") {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = forwarded || req.headers["x-real-ip"] || "ip";
  return `${extra}:${ip}`;
}

export function rateLimited(req, bucket, max, windowMs, extra = "") {
  const id = `${bucket}:${clientKey(req, extra)}`;
  const now = Date.now();
  const recent = (hits.get(id) || []).filter((time) => now - time < windowMs);
  if (recent.length >= max) return true;
  recent.push(now);
  hits.set(id, recent);
  if (hits.size > 2000) {
    for (const [key, times] of hits) {
      if (!times.some((time) => now - time < windowMs)) hits.delete(key);
    }
  }
  return false;
}

export function rateLimitReply(res) {
  return res.status(429).json({ error: "Trop de tentatives. Réessayez dans une heure." });
}
