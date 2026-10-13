/** Noms publics des projets seed / rail testeurs. */
export const PROJECT_NAMES = {
  "bed-hop": "Bed Hop",
  "doctolib": "Doctolib",
  "du-rose-au-noir": "Du rose au noir",
  "comptoir-du-oui": "Comptoir du Oui",
  "sncf-connect": "SNCF Connect",
  blablacar: "BlaBlaCar",
  vinted: "Vinted",
  leboncoin: "Leboncoin",
  lydia: "Lydia",
  deezer: "Deezer",
  signal: "Signal",
};

export function projectNameFor(projectId) {
  if (!projectId) return "";
  return PROJECT_NAMES[projectId] || "";
}
