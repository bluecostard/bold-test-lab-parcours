import { seedRanking } from "./seedRanking.js";

/**
 * Inventaire d’avis démo / historiques par nom de testeur (seeds classement).
 * Max 5 par auteur — lisibles même sans campagne live ni blob.
 */
const byAuthor = {
  Léa: [
    {
      id: "avis-lea",
      campaignId: "bed-hop",
      campaignName: "Bed Hop",
      title: "Le créneau 11 h – 17 h est clair",
      text: "La recherche d’une chambre entre 11 h et 17 h se comprend tout de suite. On voit les horaires avant de réserver.",
      body: "La recherche d’une chambre entre 11 h et 17 h se comprend tout de suite. On voit les horaires avant de réserver.\n\nJ’ai particulièrement apprécié que l’entreprise paie : c’est écrit dès l’accueil, avant d’entrer. L’hôte est là, le créneau est net.\n\nUn point à améliorer : le bouton de confirmation est un peu bas sur mon téléphone. Globalement, le parcours est clair et donne envie de réserver.",
      screenshot: "/visuels/ecran-bedhop.jpg",
      videoThumb: "/visuels/iphone-autour.png",
      likes: 18,
      publishedAt: "2024-05-12T10:00:00.000Z",
    },
    { id: "demo-lea-doctolib", campaignId: "doctolib", campaignName: "Doctolib", title: "Prise de rendez-vous nette", text: "On trouve un créneau sans chercher dans les menus. Le rappel est clair.", likes: 9, publishedAt: "2024-05-10T10:00:00.000Z" },
    { id: "demo-lea-sncf", campaignId: "sncf-connect", campaignName: "SNCF Connect", title: "Billet lisible jusqu’au bout", text: "Le trajet et le prix restent visibles jusqu’à la confirmation.", likes: 7, publishedAt: "2024-05-08T10:00:00.000Z" },
    { id: "demo-lea-vinted", campaignId: "vinted", campaignName: "Vinted", title: "Annonce claire", text: "Photos et taille se voient tout de suite. L’achat est simple.", likes: 6, publishedAt: "2024-05-06T10:00:00.000Z" },
    { id: "demo-lea-deezer", campaignId: "deezer", campaignName: "Deezer", title: "Playlist trouvée vite", text: "La recherche de titres répond bien. On comprend l’abonnement.", likes: 5, publishedAt: "2024-05-04T10:00:00.000Z" },
  ],
  Thomas: [
    {
      id: "avis-thomas",
      campaignId: "bed-hop",
      campaignName: "Bed Hop",
      title: "L’entreprise paie, c’est dit",
      text: "Dès l’accueil, on comprend que l’entreprise paie avant d’entrer. Pas de surprise au moment de valider.",
      body: "Dès l’accueil, on comprend que l’entreprise paie avant d’entrer. Pas de surprise au moment de valider.\n\nLe créneau 11 h – 17 h reste visible jusqu’à la confirmation. On sait ce qu’on réserve, et qui paie.\n\nLa suite est simple. J’aurais juste mis le rappel « l’entreprise paie » aussi sur l’écran de paiement.",
      screenshot: "/visuels/iphone-accueil.png",
      videoThumb: "/visuels/ecran-bedhop.jpg",
      likes: 14,
      publishedAt: "2024-05-10T10:00:00.000Z",
    },
    { id: "demo-thomas-rose", campaignId: "du-rose-au-noir", campaignName: "Du rose au noir", title: "Deux formules bien distinctes", text: "Le parcours est simple et les deux formules sont bien distinctes.", likes: 7, publishedAt: "2024-05-09T10:00:00.000Z" },
    { id: "demo-thomas-blabla", campaignId: "blablacar", campaignName: "BlaBlaCar", title: "Trajet bien résumé", text: "Horaires et prix se lisent sans zoomer. La réservation est nette.", likes: 8, publishedAt: "2024-05-07T10:00:00.000Z" },
    { id: "demo-thomas-lydia", campaignId: "lydia", campaignName: "Lydia", title: "Envoi d’argent simple", text: "Le contact et le montant sont clairs avant de valider.", likes: 4, publishedAt: "2024-05-05T10:00:00.000Z" },
    { id: "demo-thomas-signal", campaignId: "signal", campaignName: "Signal", title: "Confidentialité visible", text: "On comprend tout de suite que les messages sont privés.", likes: 3, publishedAt: "2024-05-03T10:00:00.000Z" },
  ],
  Camille: [
    {
      id: "avis-camille",
      campaignId: "bed-hop",
      campaignName: "Bed Hop",
      title: "La réservation est simple",
      text: "Trois étapes suffisent. Le créneau 11 h – 17 h et le paiement par l’entreprise restent visibles jusqu’à la confirmation.",
      body: "Trois étapes suffisent. Le créneau 11 h – 17 h et le paiement par l’entreprise restent visibles jusqu’à la confirmation.\n\nOn cherche une chambre, on voit que la boîte paie, on valide. Rien à chercher dans les menus.\n\nPetit détail : le récapitulatif pourrait répéter l’horaire une dernière fois, en plus gros.",
      screenshot: "/visuels/iphone-comment.png",
      videoThumb: "/visuels/iphone-autour.png",
      likes: 11,
      publishedAt: "2024-05-08T10:00:00.000Z",
    },
    { id: "demo-camille-oui", campaignId: "comptoir-du-oui", campaignName: "Comptoir du Oui", title: "Livret et cagnotte clairs", text: "Le livret et la cagnotte se comprennent dès l’accueil.", likes: 4, publishedAt: "2024-05-07T10:00:00.000Z" },
    { id: "demo-camille-lebon", campaignId: "leboncoin", campaignName: "Leboncoin", title: "Annonce locale nette", text: "La carte et le filtre proximité aident vraiment.", likes: 6, publishedAt: "2024-05-05T10:00:00.000Z" },
    { id: "demo-camille-doctolib", campaignId: "doctolib", campaignName: "Doctolib", title: "Créneau trouvé", text: "Le filtre spécialité fonctionne. Confirmation claire.", likes: 5, publishedAt: "2024-05-03T10:00:00.000Z" },
    { id: "demo-camille-vinted", campaignId: "vinted", campaignName: "Vinted", title: "Messagerie utile", text: "On peut poser une question avant d’acheter sans friction.", likes: 4, publishedAt: "2024-05-01T10:00:00.000Z" },
  ],
  Alex: [
    {
      id: "avis-alex",
      campaignId: "bed-hop",
      campaignName: "Bed Hop",
      title: "Autour de toi, les chambres se voient",
      text: "La carte affiche les chambres dans le créneau. On sait tout de suite ce qui est libre entre 11 h et 17 h.",
      body: "La carte affiche les chambres dans le créneau. On sait tout de suite ce qui est libre entre 11 h et 17 h.\n\nLe pictogramme et le prix facturé à l’entreprise se lisent sans zoomer. On comprend que l’hôte est sur place.\n\nLa carte a mis une seconde à se poser, puis tout était lisible.",
      screenshot: "/visuels/iphone-autour.png",
      videoThumb: "/visuels/iphone-accueil.png",
      likes: 9,
      publishedAt: "2024-05-06T10:00:00.000Z",
    },
    { id: "demo-alex-sncf", campaignId: "sncf-connect", campaignName: "SNCF Connect", title: "Correspondances lisibles", text: "Les changements de train sont bien indiqués.", likes: 6, publishedAt: "2024-05-05T10:00:00.000Z" },
    { id: "demo-alex-deezer", campaignId: "deezer", campaignName: "Deezer", title: "Découverte OK", text: "Les suggestions collent à ce que j’écoute déjà.", likes: 4, publishedAt: "2024-05-03T10:00:00.000Z" },
    { id: "demo-alex-blabla", campaignId: "blablacar", campaignName: "BlaBlaCar", title: "Profil conducteur utile", text: "Avis et note se voient avant de réserver.", likes: 5, publishedAt: "2024-05-01T10:00:00.000Z" },
    { id: "demo-alex-signal", campaignId: "signal", campaignName: "Signal", title: "Groupes simples", text: "Créer un groupe et inviter est rapide.", likes: 2, publishedAt: "2024-04-28T10:00:00.000Z" },
  ],
  Sophie: [
    {
      id: "avis-sophie",
      campaignId: "bed-hop",
      campaignName: "Bed Hop",
      title: "Comment ça marche est net",
      text: "La page explique que l’hôte est là et que l’entreprise paie. La suite de la réservation est claire.",
      body: "La page explique que l’hôte est là et que l’entreprise paie. La suite de la réservation est claire.\n\nLe créneau 11 h – 17 h est répété au bon moment, pas seulement tout en haut. On n’a pas à revenir en arrière pour vérifier qui paie.\n\nJ’utiliserais Bed Hop pour une pause en journée, sans sortir la carte perso.",
      screenshot: "/visuels/ecran-bedhop.jpg",
      videoThumb: "/visuels/iphone-comment.png",
      likes: 7,
      publishedAt: "2024-05-04T10:00:00.000Z",
    },
    { id: "demo-sophie-blabla", campaignId: "blablacar", campaignName: "BlaBlaCar", title: "Réservation rassurante", text: "On sait qui paie et quand avant de valider.", likes: 5, publishedAt: "2024-05-02T10:00:00.000Z" },
    { id: "demo-sophie-lydia", campaignId: "lydia", campaignName: "Lydia", title: "Historique clair", text: "Les derniers envois se retrouvent facilement.", likes: 3, publishedAt: "2024-04-30T10:00:00.000Z" },
    { id: "demo-sophie-oui", campaignId: "comptoir-du-oui", campaignName: "Comptoir du Oui", title: "Jour J compréhensible", text: "On comprend la mutuelle du mariage dès l’accueil.", likes: 4, publishedAt: "2024-04-28T10:00:00.000Z" },
    { id: "demo-sophie-lebon", campaignId: "leboncoin", campaignName: "Leboncoin", title: "Filtres utiles", text: "Prix et distance filtrent bien les annonces.", likes: 4, publishedAt: "2024-04-26T10:00:00.000Z" },
  ],
  Julien: [
    { id: "demo-julien-vinted", campaignId: "vinted", campaignName: "Vinted", title: "Toujours curieux", text: "La recherche par taille et marque est efficace.", likes: 8, publishedAt: "2024-05-03T10:00:00.000Z" },
    { id: "demo-julien-bed", campaignId: "bed-hop", campaignName: "Bed Hop", title: "Pause claire", text: "Le créneau journée se comprend du premier coup.", likes: 6, publishedAt: "2024-05-01T10:00:00.000Z" },
    { id: "demo-julien-doctolib", campaignId: "doctolib", campaignName: "Doctolib", title: "Rappel utile", text: "Le rappel de rendez-vous arrive au bon moment.", likes: 5, publishedAt: "2024-04-29T10:00:00.000Z" },
    { id: "demo-julien-sncf", campaignId: "sncf-connect", campaignName: "SNCF Connect", title: "QR code net", text: "Le billet s’ouvre vite hors ligne.", likes: 4, publishedAt: "2024-04-27T10:00:00.000Z" },
    { id: "demo-julien-deezer", campaignId: "deezer", campaignName: "Deezer", title: "Hors ligne OK", text: "Télécharger une playlist est simple.", likes: 3, publishedAt: "2024-04-25T10:00:00.000Z" },
  ],
  Manon: [
    { id: "demo-manon-lebon", campaignId: "leboncoin", campaignName: "Leboncoin", title: "Petits plaisirs locaux", text: "Les annonces près de chez moi ressortent bien.", likes: 6, publishedAt: "2024-05-02T10:00:00.000Z" },
    { id: "demo-manon-bed", campaignId: "bed-hop", campaignName: "Bed Hop", title: "Repos net", text: "On comprend que l’entreprise paie avant d’entrer.", likes: 5, publishedAt: "2024-04-30T10:00:00.000Z" },
    { id: "demo-manon-rose", campaignId: "du-rose-au-noir", campaignName: "Du rose au noir", title: "Simulateur utile", text: "La situation se pose en quelques questions.", likes: 4, publishedAt: "2024-04-28T10:00:00.000Z" },
    { id: "demo-manon-lydia", campaignId: "lydia", campaignName: "Lydia", title: "Paiement amis", text: "Partager une note de resto est rapide.", likes: 3, publishedAt: "2024-04-26T10:00:00.000Z" },
    { id: "demo-manon-blabla", campaignId: "blablacar", campaignName: "BlaBlaCar", title: "Trajet culture", text: "Les filtres confort aident pour un long trajet.", likes: 3, publishedAt: "2024-04-24T10:00:00.000Z" },
  ],
  Nicolas: [
    { id: "demo-nicolas-lydia", campaignId: "lydia", campaignName: "Lydia", title: "Tester pour partager", text: "L’envoi d’argent est clair et rassurant.", likes: 5, publishedAt: "2024-05-01T10:00:00.000Z" },
    { id: "demo-nicolas-bed", campaignId: "bed-hop", campaignName: "Bed Hop", title: "Parcours net", text: "Trois étapes suffisent pour réserver.", likes: 4, publishedAt: "2024-04-29T10:00:00.000Z" },
    { id: "demo-nicolas-signal", campaignId: "signal", campaignName: "Signal", title: "Appels stables", text: "L’appel audio démarre sans friction.", likes: 3, publishedAt: "2024-04-27T10:00:00.000Z" },
    { id: "demo-nicolas-vinted", campaignId: "vinted", campaignName: "Vinted", title: "Vente simple", text: "Mettre une annonce en ligne est rapide.", likes: 4, publishedAt: "2024-04-25T10:00:00.000Z" },
    { id: "demo-nicolas-sncf", campaignId: "sncf-connect", campaignName: "SNCF Connect", title: "Échanges clairs", text: "Modifier un billet reste compréhensible.", likes: 2, publishedAt: "2024-04-23T10:00:00.000Z" },
  ],
  Élise: [
    { id: "demo-elise-deezer", campaignId: "deezer", campaignName: "Deezer", title: "Naturellement curieuse", text: "Les podcasts sont faciles à retrouver.", likes: 5, publishedAt: "2024-04-30T10:00:00.000Z" },
    { id: "demo-elise-bed", campaignId: "bed-hop", campaignName: "Bed Hop", title: "Carte utile", text: "Autour de toi montre bien les chambres libres.", likes: 4, publishedAt: "2024-04-28T10:00:00.000Z" },
    { id: "demo-elise-doctolib", campaignId: "doctolib", campaignName: "Doctolib", title: "Fiche médecin claire", text: "Adresse et horaires se lisent sans zoom.", likes: 3, publishedAt: "2024-04-26T10:00:00.000Z" },
    { id: "demo-elise-oui", campaignId: "comptoir-du-oui", campaignName: "Comptoir du Oui", title: "Cagnotte nette", text: "On voit tout de suite comment contribuer.", likes: 3, publishedAt: "2024-04-24T10:00:00.000Z" },
    { id: "demo-elise-lebon", campaignId: "leboncoin", campaignName: "Leboncoin", title: "Messagerie OK", text: "Contacter un vendeur est simple.", likes: 2, publishedAt: "2024-04-22T10:00:00.000Z" },
  ],
  Maxime: [
    { id: "demo-maxime-signal", campaignId: "signal", campaignName: "Signal", title: "Des avis utiles avant tout", text: "Les réglages de confidentialité sont trouvables.", likes: 4, publishedAt: "2024-04-29T10:00:00.000Z" },
    { id: "demo-maxime-bed", campaignId: "bed-hop", campaignName: "Bed Hop", title: "Confirmation nette", text: "Le récapitulatif répète bien qui paie.", likes: 3, publishedAt: "2024-04-27T10:00:00.000Z" },
    { id: "demo-maxime-sncf", campaignId: "sncf-connect", campaignName: "SNCF Connect", title: "Recherche trajet", text: "Aller-retour se configure sans erreur.", likes: 3, publishedAt: "2024-04-25T10:00:00.000Z" },
    { id: "demo-maxime-vinted", campaignId: "vinted", campaignName: "Vinted", title: "Filtres nets", text: "Prix et état filtrent correctement.", likes: 2, publishedAt: "2024-04-23T10:00:00.000Z" },
    { id: "demo-maxime-lydia", campaignId: "lydia", campaignName: "Lydia", title: "Solde visible", text: "Le solde et les derniers mouvements sont clairs.", likes: 2, publishedAt: "2024-04-21T10:00:00.000Z" },
  ],
};

const FALLBACK_APPS = [
  { campaignId: "bed-hop", campaignName: "Bed Hop" },
  { campaignId: "doctolib", campaignName: "Doctolib" },
  { campaignId: "sncf-connect", campaignName: "SNCF Connect" },
  { campaignId: "vinted", campaignName: "Vinted" },
  { campaignId: "blablacar", campaignName: "BlaBlaCar" },
];

function fallbackReviews(name) {
  const slug = String(name || "testeur").toLowerCase().replace(/[^a-z0-9]+/gi, "-").slice(0, 24);
  return FALLBACK_APPS.map((app, index) => ({
    id: `demo-${slug}-${app.campaignId}`,
    campaignId: app.campaignId,
    campaignName: app.campaignName,
    title: `Retour sur ${app.campaignName}`,
    text: `Avis de ${name || "ce testeur"} : le parcours se comprend bien, avec un détail utile à garder.`,
    likes: Math.max(1, 8 - index),
    publishedAt: new Date(Date.UTC(2024, 4, 20 - index)).toISOString(),
  }));
}

function photoFor(name) {
  return seedRanking.find((row) => row.name === name)?.photo || "/icon-app.png";
}

/** Forme publique complète pour ouvrir un avis historique / démo. */
export function enrichDemoReview(authorName, review) {
  if (!review?.id) return null;
  const text = review.text || review.body || "";
  return {
    id: review.id,
    campaignId: review.campaignId || "",
    campaignName: review.campaignName || "",
    author: authorName || review.author || "Testeur",
    authorId: "",
    photo: review.photo || photoFor(authorName) || "",
    title: review.title || "Mon retour d’expérience",
    text,
    body: review.body || text,
    publishedAt: review.publishedAt || "",
    likes: Number(review.likes) || 0,
    screenshot: review.screenshot || "",
    photos: review.screenshot ? [{ name: "capture", url: review.screenshot }] : [],
    videoUrl: review.videoUrl || "",
    videoThumb: review.videoThumb || "",
    videoName: "",
    demo: true,
  };
}

export function demoReviewsForAuthor(name) {
  const list = byAuthor[name]?.length ? byAuthor[name] : fallbackReviews(name);
  return list.slice(0, 5).map((review) => enrichDemoReview(name, review));
}

export function hasDemoReviews(name) {
  return Boolean(byAuthor[name]?.length);
}

/** Recherche un avis historique (classement / seeds) par id, même hors blob. */
export function findDemoReview(campaignId = "", reviewId = "") {
  if (!reviewId) return null;
  for (const [name, list] of Object.entries(byAuthor)) {
    const hit = list.find((item) => item.id === reviewId && (!campaignId || item.campaignId === campaignId));
    if (hit) return enrichDemoReview(name, hit);
  }
  for (const row of seedRanking) {
    if (byAuthor[row.name]) continue;
    const hit = fallbackReviews(row.name).find((item) => item.id === reviewId && (!campaignId || item.campaignId === campaignId));
    if (hit) return enrichDemoReview(row.name, hit);
  }
  return null;
}
