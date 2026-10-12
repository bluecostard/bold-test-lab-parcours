import { SignJWT, importPKCS8 } from "jose";

function cleanKey(raw) {
  return String(raw || "")
    .replace(/\\n/g, "\n")
    .replace(/^\uFEFF/, "")
    .trim();
}

function apnsConfigured() {
  return Boolean(
    process.env.APNS_KEY_ID
    && process.env.APNS_TEAM_ID
    && process.env.APNS_PRIVATE_KEY
    && (process.env.APNS_BUNDLE_ID || "online.gemelo.app"),
  );
}

let cached = { jwt: "", at: 0, key: null };

async function apnsJwt() {
  const now = Date.now();
  if (cached.jwt && now - cached.at < 45 * 60 * 1000) return cached.jwt;
  const pem = cleanKey(process.env.APNS_PRIVATE_KEY);
  if (!cached.key) cached.key = await importPKCS8(pem, "ES256");
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APNS_KEY_ID })
    .setIssuer(process.env.APNS_TEAM_ID)
    .setIssuedAt()
    .sign(cached.key);
  cached = { ...cached, jwt, at: now };
  return jwt;
}

/**
 * Envoie une notif iOS via APNs HTTP/2.
 * @returns {{ sent: boolean, reason?: string, status?: number }}
 */
export async function sendApnsPush({ token, title, body, ecran }) {
  if (!apnsConfigured()) return { sent: false, reason: "not-configured" };
  const device = String(token || "").replace(/[^0-9a-fA-F]/g, "");
  if (device.length < 32) return { sent: false, reason: "bad-token" };

  const host = process.env.APNS_PRODUCTION === "0" || process.env.APNS_PRODUCTION === "false"
    ? "api.sandbox.push.apple.com"
    : "api.push.apple.com";
  const topic = process.env.APNS_BUNDLE_ID || "online.gemelo.app";
  const jwt = await apnsJwt();
  const payload = {
    aps: {
      alert: { title: String(title || "Gemelo").slice(0, 80), body: String(body || "").slice(0, 180) },
      sound: "default",
    },
    ecran: ecran || "",
  };

  const response = await fetch(`https://${host}/3/device/${device}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) return { sent: true, status: response.status };
  const detail = await response.text().catch(() => "");
  console.log("apns-fail", response.status, detail.slice(0, 180));
  return { sent: false, reason: `apns-${response.status}`, status: response.status };
}

export { apnsConfigured };
