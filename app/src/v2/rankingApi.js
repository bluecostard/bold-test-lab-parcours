import { useEffect, useState } from "react";
import { projectNameFor } from "../../lib/projectNames.js";
import { ranking as seedRanking, testerRail } from "./data.js";

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function seedRows() {
  const projectByName = {
    Léa: "doctolib",
    Thomas: "du-rose-au-noir",
    Camille: "comptoir-du-oui",
    Alex: "sncf-connect",
    Sophie: "blablacar",
    Julien: "vinted",
    Manon: "leboncoin",
    Nicolas: "lydia",
    Élise: "deezer",
    Maxime: "signal",
  };
  return seedRanking.map((row, index) => {
    const projectId = projectByName[row.name] || "";
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

export async function fetchRanking(getToken) {
  const headers = {};
  if (getToken) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch("/api/ranking", { headers });
  const data = await readJson(response);
  if (!response.ok || !Array.isArray(data.ranking) || !data.ranking.length) {
    const ranking = seedRows();
    return { ranking, me: null, windowDays: 30 };
  }
  return {
    ranking: data.ranking.map((row) => ({
      ...row,
      projectName: row.projectName || projectNameFor(row.projectId),
    })),
    me: data.me || null,
    windowDays: data.windowDays || 30,
  };
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
  const [state, setState] = useState(() => ({ ranking: seedRows(), me: null, windowDays: 30 }));
  useEffect(() => {
    let cancelled = false;
    fetchRanking(getToken)
      .then((data) => { if (!cancelled) setState(data); })
      .catch(() => { if (!cancelled) setState({ ranking: seedRows(), me: null, windowDays: 30 }); });
    return () => { cancelled = true; };
  }, [Boolean(getToken)]);
  return state;
}
