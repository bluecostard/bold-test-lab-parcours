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

export async function listMyQuestions(getToken) {
  const response = await fetch("/api/questions?mine=1", {
    headers: { ...(await authHeader(getToken)) },
  });
  const data = await readJson(response);
  return response.ok && Array.isArray(data.questions) ? data.questions : [];
}

export async function readQuestion(reviewId) {
  const response = await fetch(`/api/questions?reviewId=${encodeURIComponent(reviewId)}`);
  const data = await readJson(response);
  return response.ok ? data.question : null;
}

export async function askQuestion(getToken, payload) {
  const response = await fetch("/api/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader(getToken)) },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Envoi impossible.");
  return data.question;
}

export async function answerQuestion(getToken, payload) {
  const response = await fetch("/api/questions", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeader(getToken)) },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Réponse impossible.");
  return data.question;
}
