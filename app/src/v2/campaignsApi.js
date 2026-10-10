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

export async function listCampaigns() {
  const response = await fetch("/api/campaigns");
  const data = await readJson(response);
  return response.ok && Array.isArray(data.campaigns) ? data.campaigns : [];
}

export async function publishCampaign(getToken, payload) {
  const response = await fetch("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader(getToken)) },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Campagne impossible à enregistrer.");
  return data.campaign;
}
