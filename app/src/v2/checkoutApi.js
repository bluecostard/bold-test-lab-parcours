async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function authHeader(getToken) {
  if (!getToken) return {};
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function paymentMode() {
  const response = await fetch("/api/checkout");
  const data = await readJson(response);
  return {
    available: Boolean(data.available),
    livemode: Boolean(data.livemode),
  };
}

export async function startCheckout(getToken, payload) {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader(getToken)) },
    body: JSON.stringify({ ...payload, origin: window.location.origin }),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Impossible d’ouvrir Stripe.");
  return data;
}

export async function startAppleCheckout(getToken, payload) {
  const response = await fetch("/api/iap", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader(getToken)) },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Impossible de préparer l’achat Apple.");
  return data;
}

export async function confirmAppleCheckout(getToken, payload) {
  const response = await fetch("/api/iap", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader(getToken)) },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Achat Apple introuvable.");
  return data;
}

export async function confirmCheckout(getToken, sessionId) {
  const response = await fetch(`/api/checkout?session_id=${encodeURIComponent(sessionId)}`, {
    headers: { ...(await authHeader(getToken)) },
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Paiement introuvable.");
  return data;
}

/** Envoie (ou renvoie) l’e-mail de confirmation de campagne au créateur. */
export async function requestCampaignConfirmMail(getToken, email = "", force = true) {
  const response = await fetch("/api/campaign-confirm-mail", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader(getToken)) },
    body: JSON.stringify({ email: email || undefined, force }),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Envoi impossible.");
  return data;
}
