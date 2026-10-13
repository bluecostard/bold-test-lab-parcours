import { listAllReviews, listLikeEvents } from "./reviewStore.js";
import { projectNameFor } from "./projectNames.js";
import { seedRanking } from "./seedRanking.js";

export const RANK_WINDOW_DAYS = 30;
export const RANKING_LIMIT = 50;
const WINDOW_MS = RANK_WINDOW_DAYS * 24 * 60 * 60 * 1000;

function inWindow(iso, now) {
  const at = Date.parse(iso || "");
  return Number.isFinite(at) && now - at <= WINDOW_MS && now - at >= 0;
}

function publicRow(row, place) {
  const projectId = row.projectId || "";
  return {
    id: row.id,
    authorId: row.authorId || "",
    name: row.name,
    photo: row.photo || "",
    phrase: row.phrase || "Avis utiles",
    points: row.points,
    tested: row.tested,
    projectId,
    projectName: row.projectName || projectNameFor(projectId),
    live: Boolean(row.live),
    place,
  };
}

export function getSeedRankingRow(name) {
  const row = seedRanking.find((item) => item.name === name);
  if (!row) return null;
  return {
    id: `seed-${row.name}`,
    authorId: "",
    name: row.name,
    photo: row.photo,
    phrase: row.phrase,
    points: row.points,
    tested: row.tested,
    projectId: row.projectId,
    projectName: projectNameFor(row.projectId),
    live: false,
  };
}

export async function buildRanking(userId = "") {
  const now = Date.now();
  const reviews = await listAllReviews();
  const liveByAuthor = new Map();

  for (const review of reviews) {
    const key = review.authorId || review.author;
    if (!key) continue;
    const events = await listLikeEvents(review.id);
    const recentLikes = events.filter((event) => {
      if (review.authorId && event.userId === review.authorId) return false;
      return inWindow(event.at, now);
    });
    const row = liveByAuthor.get(key) || {
      id: key,
      authorId: review.authorId || "",
      name: review.author || "Testeur",
      photo: review.photo || "",
      phrase: "Avis utiles",
      points: 0,
      tested: 0,
      projectId: "",
      live: true,
    };
    if (inWindow(review.publishedAt, now)) row.tested += 1;
    row.points += recentLikes.length;
    if (!row.photo && review.photo) row.photo = review.photo;
    liveByAuthor.set(key, row);
  }

  const live = [...liveByAuthor.values()];
  const liveNames = new Set(live.map((row) => row.name));
  const seed = seedRanking
    .filter((row) => !liveNames.has(row.name))
    .map((row) => ({
      id: `seed-${row.name}`,
      authorId: "",
      name: row.name,
      photo: row.photo,
      phrase: row.phrase,
      points: row.points,
      tested: row.tested,
      projectId: row.projectId,
      live: false,
    }));

  const combined = [...live, ...seed].sort((a, b) => b.points - a.points || b.tested - a.tested || a.name.localeCompare(b.name, "fr"));
  const ranking = combined.slice(0, RANKING_LIMIT).map((row, index) => publicRow(row, index + 1));

  let me = null;
  if (userId) {
    const index = combined.findIndex((row) => row.authorId === userId);
    const row = index >= 0 ? combined[index] : { authorId: userId, name: "Vous", photo: "", phrase: "", points: 0, tested: 0, live: true };
    me = {
      ...publicRow(row, index >= 0 ? index + 1 : 0),
      inTop10: index >= 0 && index < 10,
    };
  }

  return { ranking, me, windowDays: RANK_WINDOW_DAYS, limit: RANKING_LIMIT };
}

/** Profil public + place dans le classement (jusqu’à la limite). */
export async function findRankingPerson({ authorId = "", name = "" } = {}) {
  const { ranking } = await buildRanking("");
  const byAuthor = authorId ? ranking.find((row) => row.authorId === authorId || row.id === authorId) : null;
  if (byAuthor) return byAuthor;
  if (name) {
    const byName = ranking.find((row) => row.name === name);
    if (byName) return byName;
    const seed = getSeedRankingRow(name);
    if (seed) return { ...seed, place: 0 };
  }
  return null;
}
