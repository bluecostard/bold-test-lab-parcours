import { SignJWT, importPKCS8 } from "jose";

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
  const response = await fetch(`${host}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Vérification Apple impossible.");
  return response.json();
}

function decodePayload(jws) {
  const parts = String(jws || "").split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function verifyAppleTransaction({ transactionId, jws, productId }) {
  const fromClient = decodePayload(jws);
  const id = String(transactionId || fromClient?.transactionId || "").trim();
  if (!id) throw new Error("Achat Apple introuvable.");
  const token = await appleServerToken();
  if (!token) throw new Error("Vérification Apple non configurée.");
  const hosts = [
    "https://api.storekit.itunes.apple.com",
    "https://api.storekit-sandbox.itunes.apple.com",
  ];
  let signed = "";
  for (const host of hosts) {
    const data = await fetchTransaction(host, id, token);
    if (data?.signedTransactionInfo) {
      signed = data.signedTransactionInfo;
      break;
    }
  }
  const payload = decodePayload(signed) || fromClient;
  if (!payload) throw new Error("Achat Apple introuvable.");
  if (payload.bundleId !== BUNDLE_ID) throw new Error("Achat Apple invalide.");
  if (productId && payload.productId !== productId) throw new Error("Cet achat ne correspond pas à l’offre.");
  if (payload.revocationDate) throw new Error("Cet achat a été annulé.");
  return {
    transactionId: String(payload.transactionId || id),
    productId: payload.productId,
    environment: payload.environment || "",
  };
}
