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

export async function confirmCheckout(getToken, sessionId) {
  const response = await fetch(`/api/checkout?session_id=${encodeURIComponent(sessionId)}`, {
    headers: { ...(await authHeader(getToken)) },
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Paiement introuvable.");
  return data;
}
