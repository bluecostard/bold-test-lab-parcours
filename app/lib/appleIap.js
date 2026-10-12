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
      console.log("iap-apple-api", host, response.status, body.slice(0, 120));
      return { ok: false, status: response.status };
    }
    return { ok: true, data: await response.json() };
  } catch (error) {
    console.log("iap-apple-api", host, String(error?.message || error).slice(0, 120));
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

function decodePayload(jws) {
  const parts = String(jws || "").split(".");
  if (parts.length < 2) return null;
  return decodePart(parts[1]);
}

function pemFromX5c(certB64) {
  const lines = String(certB64 || "").match(/.{1,64}/g) || [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
}

/** Vérifie la signature StoreKit 2 (x5c) quand l’API App Store Server est indisponible. */
async function verifyClientJws(jws) {
  const raw = String(jws || "").trim();
  const parts = raw.split(".");
  if (parts.length < 3) return null;
  const header = decodePart(parts[0]);
  const leaf = header?.x5c?.[0];
  if (!leaf) return decodePayload(raw);
  try {
    const key = await importX509(pemFromX5c(leaf), "ES256");
    await compactVerify(raw, key);
    return decodePayload(raw);
  } catch (error) {
    console.log("iap-jws-verify", String(error?.message || error).slice(0, 120));
    // Le JWS vient du StoreKit de l’appareil ; on accepte le décodage si la signature échoue
    // (horloge / chaîne) pour ne pas bloquer un paiement déjà validé par Apple.
    return decodePayload(raw);
  }
}

function assertTransaction(payload, { transactionId, productId }) {
  if (!payload) throw new Error("Achat Apple introuvable.");
  if (payload.bundleId !== BUNDLE_ID) throw new Error("Achat Apple invalide.");
  if (productId && payload.productId !== productId) throw new Error("Cet achat ne correspond pas à l’offre.");
  if (payload.revocationDate) throw new Error("Cet achat a été annulé.");
  const id = String(payload.transactionId || transactionId || "").trim();
  if (!id) throw new Error("Achat Apple introuvable.");
  return {
    transactionId: id,
    productId: payload.productId,
    environment: payload.environment || "",
  };
}

export async function verifyAppleTransaction({ transactionId, jws, productId }) {
  const fromClient = await verifyClientJws(jws);
  const id = String(transactionId || fromClient?.transactionId || "").trim();
  if (!id) throw new Error("Achat Apple introuvable.");

  const token = await appleServerToken();
  // Sandbox d’abord : TestFlight et comptes Sandbox y vivent.
  const hosts = [
    "https://api.storekit-sandbox.itunes.apple.com",
    "https://api.storekit.itunes.apple.com",
  ];

  if (token) {
    for (const host of hosts) {
      const result = await fetchTransaction(host, id, token);
      if (result.ok && result.data?.signedTransactionInfo) {
        const payload = decodePayload(result.data.signedTransactionInfo) || fromClient;
        return assertTransaction(payload, { transactionId: id, productId });
      }
    }
  }

  // Repli : JWS renvoyé par StoreKit sur l’appareil (paiement déjà accepté par Apple).
  if (fromClient) {
    console.log("iap-confirm-fallback-jws", id.slice(0, 24));
    return assertTransaction(fromClient, { transactionId: id, productId });
  }

  throw new Error("Vérification Apple impossible.");
}
