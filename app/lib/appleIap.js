import { X509Certificate } from "node:crypto";
import { SignJWT, compactVerify, importPKCS8, importX509 } from "jose";

const BUNDLE_ID = "online.gemelo.app";

/** Apple Root CA - G3 (public) — ancre de confiance pour les JWS StoreKit. */
const APPLE_ROOT_CA_G3 = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----`;

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

function pemFromX5c(certB64) {
  const lines = String(certB64 || "").match(/.{1,64}/g) || [];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
}

function assertAppleCertificateChain(x5c) {
  if (!Array.isArray(x5c) || x5c.length < 1) throw new Error("Certificat Apple manquant.");
  let certs;
  try {
    certs = x5c.map((entry) => new X509Certificate(Buffer.from(String(entry), "base64")));
  } catch {
    throw new Error("Certificat Apple manquant.");
  }
  const root = new X509Certificate(APPLE_ROOT_CA_G3);
  for (let index = 0; index < certs.length - 1; index += 1) {
    const child = certs[index];
    const parent = certs[index + 1];
    if (!child.checkIssued(parent)) throw new Error("Chaîne Apple invalide.");
  }
  const anchor = certs[certs.length - 1];
  const anchored =
    anchor.fingerprint256 === root.fingerprint256
    || anchor.checkIssued(root);
  if (!anchored) throw new Error("Certificat Apple non reconnu.");
}

/**
 * Vérifie un JWS StoreKit (signature + chaîne jusqu’à Apple Root CA - G3).
 * Ne décode jamais un payload non signé.
 */
export async function verifySignedTransactionJws(jws) {
  const raw = String(jws || "").trim();
  const parts = raw.split(".");
  if (parts.length !== 3) throw new Error("Preuve Apple invalide.");
  const header = decodePart(parts[0]);
  if (!header || header.alg !== "ES256") throw new Error("Preuve Apple invalide.");
  const chain = header.x5c;
  assertAppleCertificateChain(chain);
  try {
    const key = await importX509(pemFromX5c(chain[0]), "ES256");
    await compactVerify(raw, key);
  } catch (error) {
    console.log("iap-jws-verify", String(error?.message || error).slice(0, 120));
    throw new Error("Signature Apple invalide.");
  }
  const payload = decodePart(parts[1]);
  if (!payload?.transactionId && !payload?.productId) throw new Error("Achat Apple introuvable.");
  return payload;
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

async function verifyViaAppStoreServerApi(transactionId, productId) {
  let token = "";
  try {
    token = await appleServerToken();
  } catch (error) {
    console.log("iap-token", String(error?.message || error).slice(0, 160));
  }
  if (!token) throw new Error("Vérification Apple non configurée.");

  const hosts = [
    "https://api.storekit-sandbox.itunes.apple.com",
    "https://api.storekit.itunes.apple.com",
  ];
  const statuses = [];
  for (const host of hosts) {
    const result = await fetchTransaction(host, transactionId, token);
    statuses.push(String(result.status));
    if (result.ok && result.data?.signedTransactionInfo) {
      const apiPayload = await verifySignedTransactionJws(result.data.signedTransactionInfo);
      return assertTransaction(apiPayload, { transactionId, productId });
    }
  }
  console.log("iap-confirm-api-fail", transactionId.slice(0, 24), statuses.join(","));
  throw new Error(`Vérification Apple impossible (${statuses.join("/") || "api"}).`);
}

/**
 * Vérifie un achat StoreKit avant fulfillment.
 * 1) JWS client vérifié (signature + chaîne Apple)
 * 2) Sinon App Store Server API + JWS Apple vérifié
 * Aucun payload non signé n’est accepté.
 */
export async function verifyAppleTransaction({ transactionId, jws, productId }) {
  const idHint = String(transactionId || "").trim();
  const rawJws = String(jws || "").trim();

  if (rawJws) {
    try {
      const fromJws = await verifySignedTransactionJws(rawJws);
      const verified = assertTransaction(fromJws, { transactionId: idHint || fromJws.transactionId, productId });
      console.log("iap-confirm-jws", verified.transactionId.slice(0, 24), verified.environment || "");
      return verified;
    } catch (error) {
      // Si le JWS client est rejeté mais qu’on a un transactionId, on tente l’API Apple.
      if (!idHint) throw error;
      console.log("iap-jws-fallback-api", String(error?.message || error).slice(0, 80));
    }
  }

  if (!idHint) throw new Error("Achat Apple introuvable.");
  const fromApi = await verifyViaAppStoreServerApi(idHint, productId);
  console.log("iap-confirm-api", fromApi.transactionId.slice(0, 24), fromApi.environment || "");
  return fromApi;
}
