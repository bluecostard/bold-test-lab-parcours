import { get, list, put } from "@vercel/blob";

const access = "private";

function reviewPath(campaignId, reviewId) {
  return `reviews/${campaignId}/${reviewId}.json`;
}

function likePath(reviewId, userId) {
  return `likes/${reviewId}/${encodeURIComponent(userId)}.json`;
}

function flagPath(reviewId, userId) {
  return `flags/${reviewId}/${encodeURIComponent(userId)}.json`;
}

async function readJson(pathname) {
  const result = await get(pathname, { access, useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const text = await new Response(result.stream).text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeJson(pathname, value) {
  await put(pathname, JSON.stringify(value), {
    access,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function countLikes(reviewId) {
  const listed = await list({ prefix: `likes/${reviewId}/`, limit: 1000 });
  return listed.blobs.length;
}

export async function listReviews(campaignId) {
  const listed = await list({ prefix: `reviews/${campaignId}/`, limit: 100 });
  const reviews = [];
  for (const blob of listed.blobs) {
    const review = await readJson(blob.pathname);
    if (!review?.id || review.hidden) continue;
    review.likes = await countLikes(review.id);
    reviews.push(review);
  }
  reviews.sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));
  return reviews;
}

export async function readReview(campaignId, reviewId) {
  const review = await readJson(reviewPath(campaignId, reviewId));
  if (!review?.id) return null;
  review.likes = await countLikes(review.id);
  return review;
}

export async function saveReview(review) {
  await writeJson(reviewPath(review.campaignId, review.id), review);
  review.likes = await countLikes(review.id);
  return review;
}

export async function hasLiked(reviewId, userId) {
  return Boolean(await readJson(likePath(reviewId, userId)));
}

export async function addLike(reviewId, userId) {
  if (await hasLiked(reviewId, userId)) return countLikes(reviewId);
  await writeJson(likePath(reviewId, userId), { at: new Date().toISOString(), userId });
  return countLikes(reviewId);
}

export async function addFlag(flag) {
  const pathname = flagPath(flag.reviewId, flag.userId);
  const existing = await readJson(pathname);
  if (existing) return { flag: existing, created: false };
  const saved = {
    reviewId: flag.reviewId,
    campaignId: flag.campaignId || "",
    userId: flag.userId,
    reason: flag.reason,
    detail: flag.detail || "",
    at: new Date().toISOString(),
  };
  await writeJson(pathname, saved);
  return { flag: saved, created: true };
}

export async function countFlags(reviewId) {
  const listed = await list({ prefix: `flags/${reviewId}/`, limit: 1000 });
  return listed.blobs.length;
}

export async function hideReview(campaignId, reviewId, reason) {
  const review = await readJson(reviewPath(campaignId, reviewId));
  if (!review?.id) return null;
  if (review.hidden) return review;
  review.hidden = true;
  review.hiddenAt = new Date().toISOString();
  review.hiddenReason = reason || "";
  await writeJson(reviewPath(campaignId, reviewId), review);
  return review;
}

export async function listAllReviews() {
  const listed = await list({ prefix: "reviews/", limit: 500 });
  const reviews = [];
  for (const blob of listed.blobs) {
    if (!blob.pathname.endsWith(".json")) continue;
    const review = await readJson(blob.pathname);
    if (review?.id) reviews.push(review);
  }
  return reviews;
}

export async function listLikeEvents(reviewId) {
  const listed = await list({ prefix: `likes/${reviewId}/`, limit: 1000 });
  const events = [];
  for (const blob of listed.blobs) {
    const file = blob.pathname.split("/").pop() || "";
    const fromPath = decodeURIComponent(file.replace(/\.json$/, ""));
    const data = await readJson(blob.pathname);
    events.push({
      userId: data?.userId || fromPath,
      at: data?.at || "",
    });
  }
  return events;
}
