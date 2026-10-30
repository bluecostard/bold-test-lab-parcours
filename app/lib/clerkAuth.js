import { createRemoteJWKSet, jwtVerify } from "jose";

function clerkHost() {
  const key = process.env.VITE_CLERK_PUBLISHABLE_KEY || "";
  const raw = key.replace(/^pk_(test|live)_/, "");
  if (!raw) return "";
  try {
    return Buffer.from(raw, "base64").toString("utf8").replace(/\$+$/, "").trim();
  } catch {
    return "";
  }
}

let jwks;

export async function readClerkUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const host = clerkHost();
  if (!token || !host) return null;
  try {
    if (!jwks) jwks = createRemoteJWKSet(new URL(`https://${host}/.well-known/jwks.json`));
    const { payload } = await jwtVerify(token, jwks);
    const id = typeof payload.sub === "string" ? payload.sub : "";
    if (!id) return null;
    const email =
      typeof payload.email === "string"
        ? payload.email
        : typeof payload.primary_email_address === "string"
          ? payload.primary_email_address
          : "";
    const metadata =
      payload.metadata && typeof payload.metadata === "object" ? payload.metadata : payload.public_metadata || null;
    return { id, email: String(email || "").trim().toLowerCase(), metadata };
  } catch {
    return null;
  }
}
