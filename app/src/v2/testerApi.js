import { demoReviewsForAuthor } from "../../lib/demoTesterReviews.js";
import { projectNameFor } from "../../lib/projectNames.js";
import { ranking as seedRanking } from "./data.js";

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

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

function seedTester(name, place = 0) {
  const row = seedRanking.find((item) => item.name === name);
  if (!row) return null;
  const projectId = projectByName[name] || "";
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
    place,
    live: false,
  };
}

function fallbackProfile({ authorId = "", name = "", place = 0, photo = "", points = 0, projectId = "", phrase = "" } = {}) {
  const seed = name ? seedTester(name, place) : null;
  if (seed) {
    return {
      tester: {
        ...seed,
        place: place || seed.place,
        photo: photo || seed.photo,
        points: points || seed.points,
        projectId: projectId || seed.projectId,
        projectName: projectNameFor(projectId || seed.projectId) || seed.projectName,
        phrase: phrase || seed.phrase,
      },
      reviews: demoReviewsForAuthor(seed.name),
    };
  }
  if (!name && !authorId) return null;
  const resolvedProjectId = projectId || "";
  return {
    tester: {
      id: authorId || `local-${name}`,
      authorId: authorId || "",
      name: name || "Testeur",
      photo: photo || "/icon-app.png",
      phrase: phrase || "Avis utiles",
      points: points || 0,
      tested: 0,
      projectId: resolvedProjectId,
      projectName: projectNameFor(resolvedProjectId),
      place: place || 0,
      live: Boolean(authorId),
    },
    reviews: name ? demoReviewsForAuthor(name) : [],
  };
}

export async function fetchTesterProfile(params = {}) {
  const authorId = params.authorId || "";
  const name = params.name || "";
  const query = new URLSearchParams();
  if (authorId) query.set("authorId", authorId);
  if (name) query.set("name", name);
  try {
    const response = await fetch(`/api/tester?${query.toString()}`);
    const data = await readJson(response);
    if (response.ok && data.tester) {
      return {
        tester: data.tester,
        reviews: Array.isArray(data.reviews) ? data.reviews.slice(0, 5) : [],
      };
    }
  } catch {
    /* fallback local */
  }
  return fallbackProfile(params);
}
