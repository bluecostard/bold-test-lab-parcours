import { timingSafeEqual } from "node:crypto";

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Auth admin via `Authorization: Bearer ${GEMELO_ADMIN_TOKEN}`. */
export function readAdminToken(req) {
  const expected = process.env.GEMELO_ADMIN_TOKEN || "";
  if (!expected || expected.length < 16) return null;
  const header = String(req.headers?.authorization || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  const provided = match?.[1]?.trim() || "";
  if (!provided || !safeEqual(provided, expected)) return null;
  return provided;
}

export function requireAdmin(req, res) {
  const token = readAdminToken(req);
  if (!token) {
    res.status(401).json({ error: "Accès admin refusé. Jeton manquant ou invalide." });
    return null;
  }
  return token;
}
