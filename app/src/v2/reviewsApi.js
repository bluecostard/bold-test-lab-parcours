import { findDemoReview } from "../../lib/demoTesterReviews.js";

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

export async function getReview(campaignId, reviewId) {
  const response = await fetch(`/api/reviews?campaignId=${encodeURIComponent(campaignId)}&id=${encodeURIComponent(reviewId)}`);
  const data = await readJson(response);
  if (response.ok && data.review) return data.review;
  return findDemoReview(campaignId, reviewId);
}

export async function listReviews(campaignId) {
  const response = await fetch(`/api/reviews?campaignId=${encodeURIComponent(campaignId)}`);
  const data = await readJson(response);
  return response.ok && Array.isArray(data.reviews) ? data.reviews : [];
}

export async function publishReview(getToken, payload) {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader(getToken)) },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Publication impossible.");
  return data.review;
}

export async function flagReview(getToken, payload) {
  const response = await fetch("/api/flags", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader(getToken)) },
    body: JSON.stringify(payload),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Signalement impossible.");
  return data;
}

export async function likeReview(getToken, reviewId, campaignId) {
  const response = await fetch("/api/likes", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader(getToken)) },
    body: JSON.stringify({ reviewId, campaignId }),
  });
  const data = await readJson(response);
  if (!response.ok) throw new Error(data.error || "Like impossible.");
  return data;
}
