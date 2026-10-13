/** Classement démo : 50 testeurs pour permettre le scroll jusqu’à la limite. */
const PROJECT_CYCLE = [
  "doctolib",
  "du-rose-au-noir",
  "comptoir-du-oui",
  "sncf-connect",
  "blablacar",
  "vinted",
  "leboncoin",
  "lydia",
  "deezer",
  "signal",
];

const PHOTO_CYCLE = [
  "/visuels/lea.jpg",
  "/visuels/thomas.jpg",
  "/visuels/camille.jpg",
  "/visuels/alex.jpg",
  "/visuels/sophie.jpg",
  "/visuels/julien.jpg",
  "/visuels/manon.jpg",
  "/visuels/nicolas.jpg",
  "/visuels/elise.jpg",
  "/visuels/maxime.jpg",
];

const PHRASES = [
  "Toujours à l’affût de nouveaux lieux",
  "Nature, cafés et bonnes adresses",
  "Explorer pour mieux vivre",
  "Des idées pour un quotidien meilleur",
  "Bien-être et découverte",
  "Toujours curieux",
  "Cafés, culture, petits plaisirs",
  "Tester pour partager",
  "Naturellement curieuse",
  "Des avis utiles avant tout",
];

/** 50 prénoms distincts (exemples classement). */
const NAMES = [
  "Léa", "Thomas", "Camille", "Alex", "Sophie", "Julien", "Manon", "Nicolas", "Élise", "Maxime",
  "Chloé", "Hugo", "Inès", "Louis", "Emma", "Arthur", "Jade", "Lucas", "Lina", "Noah",
  "Zoé", "Gabriel", "Alice", "Raphaël", "Léna", "Adam", "Mila", "Paul", "Sarah", "Nathan",
  "Louise", "Théo", "Anna", "Tom", "Clara", "Ethan", "Julia", "Léo", "Eva", "Sacha",
  "Maya", "Mathis", "Rose", "Noé", "Iris", "Enzo", "Nina", "Axel", "Lila", "Oscar",
];

export const seedRanking = NAMES.map((name, index) => ({
  name,
  tested: Math.max(1, 48 - index),
  points: Math.max(20, 420 - index * 8),
  phrase: PHRASES[index % PHRASES.length],
  photo: PHOTO_CYCLE[index % PHOTO_CYCLE.length],
  projectId: PROJECT_CYCLE[index % PROJECT_CYCLE.length],
}));
