import { timingSafeEqual } from "node:crypto";
import { readClerkUser } from "./clerkAuth.js";

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function splitList(value) {
  return String(value || "")
    .split(/[,;\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function adminEmails() {
  const defaults = ["bonjour@gemelo.online", "elvii86@yahoo.fr"];
  const fromEnv = splitList(process.env.GEMELO_ADMIN_EMAILS);
  const merged = [...fromEnv];
  for (const email of defaults) {
    if (!merged.includes(email)) merged.push(email);
  }
  const notify = String(process.env.ADMIN_NOTIFY_EMAIL || "")
    .trim()
    .toLowerCase();
  if (notify && !merged.includes(notify)) merged.push(notify);
  return merged;
}

function adminUserIds() {
  return String(process.env.GEMELO_ADMIN_USER_IDS || "")
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Auth admin legacy : `Authorization: Bearer ${GEMELO_ADMIN_TOKEN}`. */
export function readAdminToken(req) {
  const expected = process.env.GEMELO_ADMIN_TOKEN || "";
  if (!expected || expected.length < 16) return null;
  const header = String(req.headers?.authorization || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  const provided = match?.[1]?.trim() || "";
  if (!provided || !safeEqual(provided, expected)) return null;
  return { kind: "token" };
}

async function fetchClerkUser(userId) {
  const secret = String(process.env.CLERK_SECRET_KEY || "").trim();
  if (!secret || !userId) return null;
  try {
    const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function primaryEmailFromClerkUser(user) {
  const list = Array.isArray(user?.email_addresses) ? user.email_addresses : [];
  const primary = list.find((row) => row?.id === user?.primary_email_address_id) || list[0];
  return String(primary?.email_address || "")
    .trim()
    .toLowerCase();
}

function isAdminClerkUser(user, clerkId) {
  if (!user && !clerkId) return false;
  const ids = adminUserIds();
  if (clerkId && ids.includes(clerkId)) return true;
  const email = primaryEmailFromClerkUser(user);
  if (email && adminEmails().includes(email)) return true;
  const publicRole = String(user?.public_metadata?.role || "").toLowerCase();
  const privateAdmin = user?.private_metadata?.admin === true || user?.public_metadata?.admin === true;
  if (publicRole === "admin" || privateAdmin) return true;
  return false;
}

/** Auth admin via Clerk (allowlist e-mail / user id / metadata) ou jeton partagé. */
export async function requireAdmin(req, res) {
  const shared = readAdminToken(req);
  if (shared) return shared;

  const clerk = await readClerkUser(req);
  if (!clerk?.id) {
    res.status(401).json({ error: "Connectez-vous avec votre compte Gemelo." });
    return null;
  }

  const ids = adminUserIds();
  if (ids.includes(clerk.id)) {
    return { kind: "clerk", id: clerk.id, email: clerk.email || "" };
  }

  const emails = adminEmails();
  if (clerk.email && emails.includes(clerk.email)) {
    return { kind: "clerk", id: clerk.id, email: clerk.email };
  }

  const meta = clerk.metadata || {};
  if (String(meta.role || "").toLowerCase() === "admin" || meta.admin === true) {
    return { kind: "clerk", id: clerk.id, email: clerk.email || "" };
  }

  const profile = await fetchClerkUser(clerk.id);
  if (!isAdminClerkUser(profile, clerk.id)) {
    res.status(403).json({
      error: "Ce compte n’est pas autorisé à administrer Gemelo.",
    });
    return null;
  }

  return {
    kind: "clerk",
    id: clerk.id,
    email: primaryEmailFromClerkUser(profile) || clerk.email || "",
  };
}
