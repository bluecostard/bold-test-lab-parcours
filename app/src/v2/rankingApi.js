import { useEffect, useState } from "react";
import { projectNameFor } from "../../lib/projectNames.js";
import { ranking as seedRanking, testerRail } from "./data.js";

const CACHE_MS = 45_000;
const rankingCache = new Map();

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function seedRows() {
  return seedRanking.map((row, index) => {
    const projectId = row.projectId || "";
    return {
      id: `seed-${row.name}`,
      authorId: "",
      name: row.name,
      photo: row.photo,
      phrase: row.phrase,
      points: row.points,
      tested: row.tested,
      projectId,
      projectName: projectNameFor(projectId),
      live: false,
      place: index + 1,
    };
  });
}

function cacheKey(getToken) {
  return getToken ? "authed" : "guest";
}

export async function fetchRanking(getToken, force = false) {
  const key = cacheKey(getToken);
  const hit = rankingCache.get(key);
  if (!force && hit?.data && Date.now() - hit.at < CACHE_MS) return hit.data;
  if (!force && hit?.promise) return hit.promise;

  const promise = (async () => {
    const headers = {};
    if (getToken) {
      const token = await getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch("/api/ranking", { headers });
    const data = await readJson(response);
    if (!response.ok || !Array.isArray(data.ranking) || !data.ranking.length) {
      return { ranking: seedRows(), me: null, windowDays: 30 };
    }
    return {
      ranking: data.ranking.map((row) => ({
        ...row,
        projectName: row.projectName || projectNameFor(row.projectId),
      })),
      me: data.me || null,
      windowDays: data.windowDays || 30,
    };
  })()
    .then((data) => {
      rankingCache.set(key, { at: Date.now(), data, promise: null });
      return data;
    })
    .catch((error) => {
      rankingCache.set(key, { at: 0, data: hit?.data || null, promise: null });
      throw error;
    });

  rankingCache.set(key, { at: hit?.at || 0, data: hit?.data || null, promise });
  return promise;
}

export function projectsInTop10(rows) {
  const byId = new Map(testerRail.map((item) => [item.id, item]));
  const seen = new Set();
  const list = [];
  for (const row of rows.slice(0, 10)) {
    const project = byId.get(row.projectId);
    if (!project || seen.has(project.id)) continue;
    seen.add(project.id);
    list.push({ ...project, kind: "tester", rank: row.place, testerName: row.name });
  }
  return list.length ? list : testerRail.map((item, index) => ({ ...item, kind: "tester", rank: index + 1 }));
}

export function useRanking(getToken) {
  const [state, setState] = useState(() => {
    const hit = rankingCache.get(cacheKey(getToken));
    return hit?.data || { ranking: seedRows(), me: null, windowDays: 30 };
  });
  useEffect(() => {
    let cancelled = false;
    fetchRanking(getToken)
      .then((data) => { if (!cancelled) setState(data); })
      .catch(() => { if (!cancelled) setState({ ranking: seedRows(), me: null, windowDays: 30 }); });
    return () => { cancelled = true; };
  }, [Boolean(getToken)]);
  return state;
}

export function prefetchRanking(getToken = null) {
  return fetchRanking(getToken).catch(() => ({ ranking: seedRows(), me: null, windowDays: 30 }));
}
