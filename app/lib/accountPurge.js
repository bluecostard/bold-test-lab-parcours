import { del, list } from "@vercel/blob";
import { listCampaigns, readCampaign } from "./campaignStore.js";
import { readBooking } from "./bookingStore.js";
import { listAllReviews, listReviews } from "./reviewStore.js";
import { listQuestions } from "./questionStore.js";
import { listConversationsFor } from "./messageStore.js";
import { removePushDevice } from "./pushStore.js";
import { removeSubscriber } from "./mailPrefs.js";

function bookingPath(userId) {
  return `bookings/${String(userId).replace(/[^a-zA-Z0-9_-]/g, "")}.json`;
}

function campaignPath(id) {
  return `campaigns/${id}.json`;
}

function reviewPath(campaignId, reviewId) {
  return `reviews/${campaignId}/${reviewId}.json`;
}

function questionPath(reviewId) {
  return `questions/${reviewId}.json`;
}

function conversationPath(conversationId) {
  return `conversations/${String(conversationId).replace(/[^a-zA-Z0-9_-]/g, "")}.json`;
}

async function deletePathnames(pathnames) {
  const unique = [...new Set((pathnames || []).filter(Boolean))];
  for (let i = 0; i < unique.length; i += 40) {
    const chunk = unique.slice(i, i + 40);
    try {
      await del(chunk);
    } catch (error) {
      console.log("account-purge-del", String(error?.message || error).slice(0, 120));
    }
  }
}

async function deleteUrls(urls) {
  const unique = [...new Set((urls || []).filter((url) => typeof url === "string" && url.startsWith("http")))];
  for (let i = 0; i < unique.length; i += 40) {
    const chunk = unique.slice(i, i + 40);
    try {
      await del(chunk);
    } catch (error) {
      console.log("account-purge-url", String(error?.message || error).slice(0, 120));
    }
  }
}

async function listAllUnder(prefix) {
  const blobs = [];
  let cursor;
  do {
    const listed = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...(listed.blobs || []));
    cursor = listed.hasMore ? listed.cursor : undefined;
  } while (cursor);
  return blobs;
}

function collectMediaUrls(source, into) {
  if (!source || typeof source !== "object") return;
  const add = (value) => {
    if (typeof value === "string" && value.startsWith("http")) into.add(value);
  };
  add(source.logo);
  add(source.screenshot);
  add(source.videoUrl);
  add(source.photo);
  if (Array.isArray(source.screenshots)) source.screenshots.forEach(add);
  if (Array.isArray(source.photos)) {
    source.photos.forEach((item) => {
      if (typeof item === "string") add(item);
      else add(item?.url);
    });
  }
}

async function purgeReviewTree(review) {
  if (!review?.id || !review.campaignId) return { pathnames: [], urls: [] };
  const pathnames = [reviewPath(review.campaignId, review.id), questionPath(review.id)];
  const likes = await listAllUnder(`likes/${review.id}/`);
  const flags = await listAllUnder(`flags/${review.id}/`);
  pathnames.push(...likes.map((blob) => blob.pathname), ...flags.map((blob) => blob.pathname));
  const urls = new Set();
  collectMediaUrls(review, urls);
  return { pathnames, urls: [...urls] };
}

/**
 * Efface les données serveur Gemelo liées à un utilisateur (Blob + prefs + push).
 * Clerk reste à fermer côté client après cet appel.
 */
export async function purgeUserAccount(userId) {
  if (!userId) throw new Error("Utilisateur manquant.");

  const pathnames = [];
  const mediaUrls = new Set();
  const removedReviewIds = new Set();

  const booking = await readBooking(userId);
  const owned = (await listCampaigns()).filter((campaign) => campaign.ownerId === userId);
  if (booking?.campaignId) {
    const linked = await readCampaign(booking.campaignId);
    if (linked?.id && linked.ownerId === userId && !owned.some((item) => item.id === linked.id)) {
      owned.push(linked);
    }
  }

  for (const campaign of owned) {
    collectMediaUrls(campaign, mediaUrls);
    const reviews = await listReviews(campaign.id);
    for (const review of reviews) {
      const tree = await purgeReviewTree(review);
      pathnames.push(...tree.pathnames);
      tree.urls.forEach((url) => mediaUrls.add(url));
      removedReviewIds.add(review.id);
    }
    // Avis masqués aussi
    const allUnder = await listAllUnder(`reviews/${campaign.id}/`);
    for (const blob of allUnder) {
      pathnames.push(blob.pathname);
    }
    pathnames.push(campaignPath(campaign.id));
  }

  const authored = (await listAllReviews()).filter((review) => review.authorId === userId);
  for (const review of authored) {
    if (removedReviewIds.has(review.id)) continue;
    const tree = await purgeReviewTree(review);
    pathnames.push(...tree.pathnames);
    tree.urls.forEach((url) => mediaUrls.add(url));
    removedReviewIds.add(review.id);
  }

  const questions = await listQuestions();
  for (const question of questions) {
    if (question.fromId === userId || question.authorId === userId) {
      pathnames.push(questionPath(question.reviewId));
    }
  }

  const conversations = await listConversationsFor(userId);
  for (const conversation of conversations) {
    pathnames.push(conversationPath(conversation.id));
  }

  const encodedSuffix = `/${encodeURIComponent(userId)}.json`;
  for (const prefix of ["likes/", "flags/"]) {
    const blobs = await listAllUnder(prefix);
    for (const blob of blobs) {
      if (blob.pathname.endsWith(encodedSuffix)) pathnames.push(blob.pathname);
    }
  }

  pathnames.push(bookingPath(userId));

  const mediaPrefix = `media/image/${String(userId).slice(0, 12)}-`;
  const mediaBlobs = await listAllUnder(mediaPrefix);
  pathnames.push(...mediaBlobs.map((blob) => blob.pathname));
  const mediaVideoPrefix = `media/video/${String(userId).slice(0, 12)}-`;
  const mediaVideoBlobs = await listAllUnder(mediaVideoPrefix);
  pathnames.push(...mediaVideoBlobs.map((blob) => blob.pathname));

  await deletePathnames(pathnames);
  await deleteUrls([...mediaUrls]);
  await removeSubscriber(userId);
  await removePushDevice(userId);

  return {
    ok: true,
    campaigns: owned.length,
    reviews: removedReviewIds.size,
    conversations: conversations.length,
  };
}
