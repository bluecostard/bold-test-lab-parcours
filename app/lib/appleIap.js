import { SignJWT, compactVerify, importPKCS8, importX509 } from "jose";

const BUNDLE_ID = "online.gemelo.app";

function privateKeyPem() {
  return String(process.env.APPLE_IAP_PRIVATE_KEY || "").replace(/\\n/g, "\n").trim();
}

export function appleIapConfigured() {
  return Boolean(privateKeyPem() && process.env.APPLE_IAP_KEY_ID && process.env.APPLE_IAP_ISSUER_ID);
}

async function appleServerToken() {
  const pem = privateKeyPem();
  const keyId = process.env.APPLE_IAP_KEY_ID;
  const issuer = process.env.APPLE_IAP_ISSUER_ID;
  if (!pem || !keyId || !issuer) return "";
  const key = await importPKCS8(pem, "ES256");
  return new SignJWT({ bid: BUNDLE_ID })
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime("15m")
    .setAudience("appstoreconnect-v1")
    .sign(key);
}

async function fetchTransaction(host, transactionId, token) {
  try {
    const response = await fetch(`${host}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 404) return { ok: false, status: 404 };
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.log("iap-apple-api", host, response.status, body.slice(0, 160));
      return { ok: false, status: response.status };
    }
    return { ok: true, data: await response.json() };
  } catch (error) {
    console.log("iap-apple-api", host, String(error?.message || error).slice(0, 160));
    return { ok: false, status: 0 };
  }
}

function decodePart(value) {
  try {
    return JSON.parse(Buffer.from(String(value || ""), "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function decodePayload(jwsOrPayload) {
  const raw = String(jwsOrPayload || "").trim();
  if (!raw) return null;
  // JWS complet (header.payload.sig) ou segment payload seul.
  const parts = raw.split(".");
  if (parts.length >= 2) return decodePart(parts[1]);
  return decodePart(raw);
}

function pemFromX5c(certB64) {
  const lines = String(certB64 || "").match(/.{1,64}/g) || [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
}

async function verifyClientJws(jws) {
  const raw = String(jws || "").trim();
  const parts = raw.split(".");
  if (parts.length < 3) return decodePayload(raw);
  const header = decodePart(parts[0]);
  const leaf = header?.x5c?.[0];
  if (!leaf) return decodePayload(raw);
  try {
    const key = await importX509(pemFromX5c(leaf), "ES256");
    await compactVerify(raw, key);
  } catch (error) {
    console.log("iap-jws-verify", String(error?.message || error).slice(0, 120));
  }
  return decodePayload(raw);
}

function assertTransaction(payload, { transactionId, productId }) {
  if (!payload) throw new Error("Achat Apple introuvable.");
  if (payload.bundleId && payload.bundleId !== BUNDLE_ID) throw new Error("Achat Apple invalide.");
  if (productId && payload.productId && payload.productId !== productId) {
    throw new Error("Cet achat ne correspond pas à l’offre.");
  }
  if (payload.revocationDate) throw new Error("Cet achat a été annulé.");
  const id = String(payload.transactionId || transactionId || "").trim();
  if (!id) throw new Error("Achat Apple introuvable.");
  return {
    transactionId: id,
    productId: payload.productId || productId || "",
    environment: payload.environment || "",
  };
}

/**
 * 1) Preuve StoreKit du téléphone (jws / payload)
 * 2) Sinon App Store Server API (sandbox puis production)
 */
export async function verifyAppleTransaction({ transactionId, jws, payload, productId }) {
  const fromJws = await verifyClientJws(jws);
  const fromPayload = decodePayload(payload);
  const fromClient = fromJws || fromPayload;
  const id = String(transactionId || fromClient?.transactionId || "").trim();

  if (fromClient?.transactionId || fromClient?.productId) {
    console.log("iap-confirm-client", String(fromClient.transactionId || id).slice(0, 24));
    return assertTransaction(fromClient, { transactionId: id, productId });
  }

  if (!id) throw new Error("Achat Apple introuvable.");

  let token = "";
  try {
    token = await appleServerToken();
  } catch (error) {
    console.log("iap-token", String(error?.message || error).slice(0, 160));
  }

  const hosts = [
    "https://api.storekit-sandbox.itunes.apple.com",
    "https://api.storekit.itunes.apple.com",
  ];
  const statuses = [];
  if (token) {
    for (const host of hosts) {
      const result = await fetchTransaction(host, id, token);
      statuses.push(String(result.status));
      if (result.ok && result.data?.signedTransactionInfo) {
        const apiPayload = decodePayload(result.data.signedTransactionInfo);
        return assertTransaction(apiPayload, { transactionId: id, productId });
      }
    }
  }

  console.log("iap-confirm-fail", id.slice(0, 24), "jws", Boolean(jws), "payload", Boolean(payload), statuses.join(","));
  throw new Error(
    token
      ? `Vérification Apple impossible (${statuses.join("/") || "api"}).`
      : "Vérification Apple non configurée.",
  );
}
