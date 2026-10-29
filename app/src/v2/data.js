export const campaigns = [
  {
    id: "bed-hop",
    name: "Bed Hop",
    pitch: "Une heure de lit autour de toi",
    description: "L’hôte est là. L’entreprise paie. Repos de 11 h à 17 h, facturé à la boîte avant d’entrer.",
    tags: ["Application", "Repos", "Entreprise"],
    logo: "/visuels/logo-bedhop-tight.png",
    cover: "/visuels/visuel-bedhop.jpg",
    screenshots: [
      "/visuels/ecran-bedhop.jpg",
      "/visuels/iphone-accueil.png",
      "/visuels/iphone-autour.png",
      "/visuels/iphone-comment.png",
    ],
    website: "https://bedhop.online",
    productLinks: [
      { label: "App Store", detail: "Ouvrir sur l’App Store", href: "https://apps.apple.com/fr/app/bed-hop/id6807971956", icon: "●" },
      { label: "Visiter le site", detail: "Découvrir Bed Hop sur le web", href: "https://bedhop.online", icon: "◎" },
    ],
    socials: [
      { label: "Instagram", href: "https://www.instagram.com/bedhop26" },
      { label: "TikTok", href: null },
      { label: "Facebook", href: null },
      { label: "LinkedIn", href: null },
      { label: "YouTube", href: null },
      { label: "X", href: null },
    ],
    founderPitch: {
      src: "/visuels/pitch-fondateur-bedhop.mp4",
      poster: "/visuels/visuel-bedhop.jpg",
      duration: "0:12",
    },
    instructions: [
      { title: "Ouvrez Bed Hop", detail: "Installez l’app et créez un compte pour commencer." },
      { title: "Cherchez une chambre", detail: "Entre 11 h et 17 h autour de vous." },
      { title: "Évaluez la réservation", detail: "Dites si le parcours est clair et ce qui bloque." },
    ],
    appScreens: ["Accueil", "Autour de toi", "Comment ça marche"],
    kind: "app",
    live: true,
  },
];

export const testerProjects = [
  {
    id: "du-rose-au-noir",
    name: "Du rose au noir",
    pitch: "Une idée sur ton argent, ta situation",
    description: "Simulateur de vérité financière pour une séparation : mariage, PACS ou concubinage.",
    tags: ["Site", "Séparation", "Argent"],
    logo: "/visuels/logo-rose.png",
    cover: "/visuels/visuel-rose.jpg",
    screenshots: ["/visuels/ecran-rose.jpg"],
    website: "https://duroseaunoir.online",
    social: { label: "Instagram", href: null },
    likes: 7,
  },
  {
    id: "comptoir-du-oui",
    name: "Comptoir du Oui",
    pitch: "La mutuelle du jour J",
    description: "Finance le mariage des autres, les autres financent le tien. Pas une banque, pas un prêt.",
    tags: ["Application", "Mariage", "Cagnotte"],
    logo: "/visuels/logo-comptoir-tight.png",
    cover: "/visuels/visuel-comptoir-tight.png",
    screenshots: ["/visuels/ecran-comptoir.jpg"],
    website: "https://comptoir-du-oui.vercel.app",
    social: { label: "Instagram", href: null },
    likes: 4,
  },
];

export const testerServices = [
  {
    id: "doctolib",
    name: "Doctolib",
    pitch: "Rendez-vous médicaux",
    description: "Prenez rendez-vous avec un médecin, un dentiste ou un professionnel de santé près de chez vous.",
    tags: ["Application", "Santé", "Rendez-vous"],
    website: "https://www.doctolib.fr",
    social: { label: "Instagram", href: "https://www.instagram.com/doctolib/" },
    likes: 11,
  },
  {
    id: "sncf-connect",
    name: "SNCF Connect",
    pitch: "Billets de train",
    description: "Réservez vos billets de train et organisez vos trajets en France et en Europe.",
    tags: ["Application", "Train", "Voyage"],
    website: "https://www.sncf-connect.com",
    social: { label: "Instagram", href: "https://www.instagram.com/sncfconnect/" },
    likes: 9,
  },
  {
    id: "blablacar",
    name: "BlaBlaCar",
    pitch: "Covoiturage",
    description: "Trouvez un covoiturage ou un autocar pour vos trajets longue distance.",
    tags: ["Application", "Covoiturage", "Voyage"],
    website: "https://www.blablacar.fr",
    social: { label: "Instagram", href: "https://www.instagram.com/blablacarfr/" },
    likes: 8,
  },
  {
    id: "vinted",
    name: "Vinted",
    pitch: "Seconde main",
    description: "Achetez et vendez des vêtements et objets de seconde main.",
    tags: ["Application", "Seconde main", "Mode"],
    website: "https://www.vinted.fr",
    social: { label: "Instagram", href: "https://www.instagram.com/vinted/" },
    likes: 10,
  },
  {
    id: "leboncoin",
    name: "Leboncoin",
    pitch: "Petites annonces",
    description: "Déposez ou consultez des petites annonces près de chez vous.",
    tags: ["Site", "Annonces", "Seconde main"],
    website: "https://www.leboncoin.fr",
    social: { label: "Instagram", href: "https://www.instagram.com/leboncoin/" },
    likes: 6,
  },
  {
    id: "lydia",
    name: "Lydia",
    pitch: "Paiement entre amis",
    description: "Envoyez de l’argent à vos proches et payez entre amis.",
    tags: ["Application", "Paiement", "Argent"],
    website: "https://lydia-app.com",
    social: { label: "Instagram", href: "https://www.instagram.com/lydiaapp/" },
    likes: 5,
  },
  {
    id: "deezer",
    name: "Deezer",
    pitch: "Musique en ligne",
    description: "Écoutez de la musique, des playlists et des podcasts en streaming.",
    tags: ["Application", "Musique", "Streaming"],
    website: "https://www.deezer.com",
    social: { label: "Instagram", href: "https://www.instagram.com/deezer/" },
    likes: 7,
  },
  {
    id: "signal",
    name: "Signal",
    pitch: "Messages privés",
    description: "Échangez des messages chiffrés, des appels et des groupes privés.",
    tags: ["Application", "Messages", "Confidentialité"],
    website: "https://signal.org",
    social: { label: "Instagram", href: "https://www.instagram.com/signal_app/" },
    likes: 3,
  },
].map((item) => {
  const cover = webShot(item.website);
  return {
    ...item,
    logo: webIcon(item.website),
    cover,
    screenshots: [cover],
    fallback: webIcon(item.website),
    kind: "service",
  };
});

export const testerRail = [
  ...testerProjects.map((project) => ({ ...project, kind: "tester" })),
  ...testerServices,
];

export const testerComments = [
  { id: 1, projectId: "bed-hop", project: "Bed Hop", author: "Léa", text: "La recherche entre 11 h et 17 h est claire. On comprend que l’entreprise paie.", likes: 12 },
  { id: 2, projectId: "du-rose-au-noir", project: "Du rose au noir", author: "Thomas", text: "Le parcours est simple et les deux formules sont bien distinctes.", likes: 7 },
  { id: 3, projectId: "comptoir-du-oui", project: "Comptoir du Oui", author: "Camille", text: "Le livret et la cagnotte se comprennent dès l’accueil.", likes: 4 },
];

export const demoReviews = [
  {
    id: "avis-lea",
    campaignId: "bed-hop",
    author: "Léa",
    photo: "/visuels/lea.jpg",
    role: "testeuse",
    since: "3 semaines",
    date: "12 mai 2024",
    title: "Le créneau 11 h – 17 h est clair",
    text: "La recherche d’une chambre entre 11 h et 17 h se comprend tout de suite. On voit les horaires avant de réserver.",
    body: "La recherche d’une chambre entre 11 h et 17 h se comprend tout de suite. On voit les horaires avant de réserver.\n\nJ’ai particulièrement apprécié que l’entreprise paie : c’est écrit dès l’accueil, avant d’entrer. L’hôte est là, le créneau est net.\n\nUn point à améliorer : le bouton de confirmation est un peu bas sur mon téléphone. Globalement, le parcours est clair et donne envie de réserver.",
    screenshot: "/visuels/ecran-bedhop.jpg",
    videoThumb: "/visuels/iphone-autour.png",
    videoDuration: "0:32",
    likes: 18,
    entrepreneurReply: "Merci Léa pour ce retour détaillé. Nous allons remonter le bouton de confirmation.",
    replyDate: "13 mai 2024",
  },
  {
    id: "avis-thomas",
    campaignId: "bed-hop",
    author: "Thomas",
    photo: "/visuels/thomas.jpg",
    role: "testeur",
    since: "2 mois",
    date: "10 mai 2024",
    title: "L’entreprise paie, c’est dit",
    text: "Dès l’accueil, on comprend que l’entreprise paie avant d’entrer. Pas de surprise au moment de valider.",
    body: "Dès l’accueil, on comprend que l’entreprise paie avant d’entrer. Pas de surprise au moment de valider.\n\nLe créneau 11 h – 17 h reste visible jusqu’à la confirmation. On sait ce qu’on réserve, et qui paie.\n\nLa suite est simple. J’aurais juste mis le rappel « l’entreprise paie » aussi sur l’écran de paiement.",
    screenshot: "/visuels/iphone-accueil.png",
    videoThumb: "/visuels/ecran-bedhop.jpg",
    videoDuration: "0:28",
    likes: 14,
    entrepreneurReply: "Merci Thomas. Nous gardons le paiement par l’entreprise bien visible dès l’accueil.",
    replyDate: "11 mai 2024",
  },
  {
    id: "avis-camille",
    campaignId: "bed-hop",
    author: "Camille",
    photo: "/visuels/camille.jpg",
    role: "testeuse",
    since: "6 semaines",
    date: "8 mai 2024",
    title: "La réservation est simple",
    text: "Trois étapes suffisent. Le créneau 11 h – 17 h et le paiement par l’entreprise restent visibles jusqu’à la confirmation.",
    body: "Trois étapes suffisent. Le créneau 11 h – 17 h et le paiement par l’entreprise restent visibles jusqu’à la confirmation.\n\nOn cherche une chambre, on voit que la boîte paie, on valide. Rien à chercher dans les menus.\n\nPetit détail : le récapitulatif pourrait répéter l’horaire une dernière fois, en plus gros.",
    screenshot: "/visuels/iphone-comment.png",
    videoThumb: "/visuels/iphone-autour.png",
    videoDuration: "0:41",
    likes: 11,
    entrepreneurReply: "Merci Camille. Trois étapes, c’est le parcours que nous voulons garder.",
    replyDate: "9 mai 2024",
  },
  {
    id: "avis-alex",
    campaignId: "bed-hop",
    author: "Alex",
    photo: "/visuels/alex.jpg",
    role: "testeur",
    since: "1 mois",
    date: "6 mai 2024",
    title: "Autour de toi, les chambres se voient",
    text: "La carte affiche les chambres dans le créneau. On sait tout de suite ce qui est libre entre 11 h et 17 h.",
    body: "La carte affiche les chambres dans le créneau. On sait tout de suite ce qui est libre entre 11 h et 17 h.\n\nLe pictogramme et le prix facturé à l’entreprise se lisent sans zoomer. On comprend que l’hôte est sur place.\n\nLa carte a mis une seconde à se poser, puis tout était lisible.",
    screenshot: "/visuels/iphone-autour.png",
    videoThumb: "/visuels/iphone-accueil.png",
    videoDuration: "0:19",
    likes: 9,
    entrepreneurReply: "Merci Alex. La carte Autour de toi reste notre priorité.",
    replyDate: "7 mai 2024",
  },
  {
    id: "avis-sophie",
    campaignId: "bed-hop",
    author: "Sophie",
    photo: "/visuels/sophie.jpg",
    role: "testeuse",
    since: "3 semaines",
    date: "4 mai 2024",
    title: "Comment ça marche est net",
    text: "La page explique que l’hôte est là et que l’entreprise paie. La suite de la réservation est claire.",
    body: "La page explique que l’hôte est là et que l’entreprise paie. La suite de la réservation est claire.\n\nLe créneau 11 h – 17 h est répété au bon moment, pas seulement tout en haut. On n’a pas à revenir en arrière pour vérifier qui paie.\n\nJ’utiliserais Bed Hop pour une pause en journée, sans sortir la carte perso.",
    screenshot: "/visuels/ecran-bedhop.jpg",
    videoThumb: "/visuels/iphone-comment.png",
    videoDuration: "0:36",
    likes: 7,
    entrepreneurReply: "Merci Sophie. Nous allons encore simplifier Comment ça marche.",
    replyDate: "5 mai 2024",
  },
];

export const bottomNavigation = [
  { id: "discover", label: "Découvrir", icon: "compass" },
  { id: "explore", label: "Explorer", icon: "explore" },
  { id: "ranking", label: "Classement", icon: "ranking" },
];

function webShot(url) {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=720`;
}

function webIcon(url) {
  return `https://www.google.com/s2/favicons?sz=128&domain=${new URL(url).hostname}`;
}

const exploreCatalog = [
  { name: "Spotify", url: "https://www.spotify.com", kind: "Application" },
  { name: "Instagram", url: "https://www.instagram.com", kind: "Application" },
  { name: "TikTok", url: "https://www.tiktok.com", kind: "Application" },
  { name: "WhatsApp", url: "https://www.whatsapp.com", kind: "Application" },
  { name: "Telegram", url: "https://telegram.org", kind: "Application" },
  { name: "Signal", url: "https://signal.org", kind: "Application" },
  { name: "Slack", url: "https://slack.com", kind: "Application" },
  { name: "Discord", url: "https://discord.com", kind: "Application" },
  { name: "Notion", url: "https://www.notion.so", kind: "Application" },
  { name: "Figma", url: "https://www.figma.com", kind: "Application" },
  { name: "Canva", url: "https://www.canva.com", kind: "Application" },
  { name: "Airbnb", url: "https://www.airbnb.fr", kind: "Application" },
  { name: "Uber", url: "https://www.uber.com", kind: "Application" },
  { name: "BlaBlaCar", url: "https://www.blablacar.fr", kind: "Application" },
  { name: "SNCF Connect", url: "https://www.sncf-connect.com", kind: "Application" },
  { name: "Citymapper", url: "https://citymapper.com", kind: "Application" },
  { name: "Google Maps", url: "https://maps.google.com", kind: "Application" },
  { name: "Duolingo", url: "https://www.duolingo.com", kind: "Application" },
  { name: "Headspace", url: "https://www.headspace.com", kind: "Application" },
  { name: "Strava", url: "https://www.strava.com", kind: "Application" },
  { name: "LinkedIn", url: "https://www.linkedin.com", kind: "Application" },
  { name: "Meetup", url: "https://www.meetup.com", kind: "Site" },
  { name: "Eventbrite", url: "https://www.eventbrite.fr", kind: "Site" },
  { name: "Vinted", url: "https://www.vinted.fr", kind: "Application" },
  { name: "Leboncoin", url: "https://www.leboncoin.fr", kind: "Site" },
  { name: "Doctolib", url: "https://www.doctolib.fr", kind: "Application" },
  { name: "PayPal", url: "https://www.paypal.com", kind: "Application" },
  { name: "Lydia", url: "https://lydia-app.com", kind: "Application" },
  { name: "Revolut", url: "https://www.revolut.com", kind: "Application" },
  { name: "Wikipédia", url: "https://fr.wikipedia.org", kind: "Site" },
  { name: "YouTube", url: "https://www.youtube.com", kind: "Application" },
  { name: "Pinterest", url: "https://www.pinterest.fr", kind: "Application" },
  { name: "Reddit", url: "https://www.reddit.com", kind: "Site" },
  { name: "GitHub", url: "https://github.com", kind: "Site" },
  { name: "Medium", url: "https://medium.com", kind: "Site" },
  { name: "Substack", url: "https://substack.com", kind: "Site" },
  { name: "Dropbox", url: "https://www.dropbox.com", kind: "Application" },
  { name: "Google Drive", url: "https://drive.google.com", kind: "Application" },
  { name: "Zoom", url: "https://zoom.us", kind: "Application" },
  { name: "Calendly", url: "https://calendly.com", kind: "Site" },
  { name: "Trello", url: "https://trello.com", kind: "Application" },
  { name: "Asana", url: "https://asana.com", kind: "Application" },
  { name: "Amazon", url: "https://www.amazon.fr", kind: "Site" },
  { name: "Netflix", url: "https://www.netflix.com", kind: "Application" },
  { name: "Deezer", url: "https://www.deezer.com", kind: "Application" },
  { name: "SoundCloud", url: "https://soundcloud.com", kind: "Application" },
  { name: "Twitch", url: "https://www.twitch.tv", kind: "Application" },
  { name: "BeReal", url: "https://bere.al", kind: "Application" },
  { name: "Mastodon", url: "https://mastodon.social", kind: "Site" },
  { name: "Proton Mail", url: "https://proton.me", kind: "Application" },
];

function hostName(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}

const knownSites = [...testerProjects, ...testerServices];

export const exploreWeb = exploreCatalog.map((item) => {
  const known = knownSites.find((project) => hostName(project.website) === hostName(item.url));
  if (known) {
    return {
      ...known,
      image: known.cover,
      badge: "Communauté",
      kind: "tester",
    };
  }
  const cover = webShot(item.url);
  return {
    id: `web-${hostName(item.url).replace(/\./g, "-")}`,
    name: item.name,
    pitch: item.kind,
    description: item.name,
    tags: [item.kind],
    website: item.url,
    social: { label: "Instagram", href: null },
    likes: 0,
    logo: webIcon(item.url),
    cover,
    screenshots: [cover],
    fallback: webIcon(item.url),
    image: cover,
    badge: item.kind,
    kind: "web",
  };
});

export const browseProjects = [...testerRail, ...exploreWeb.filter((item) => !testerRail.some((project) => project.id === item.id))];

export { seedRanking as ranking } from "../../lib/seedRanking.js";

export const demoReports = [
  {
    id: "slot-clarity",
    title: "Le créneau 11 h – 17 h n’est pas clair",
    screen: "Autour de toi",
    testers: 12,
    steps: ["Ouvrez Bed Hop.", "Cherchez une chambre entre 11 h et 17 h.", "Dites si la réservation est claire."],
    expected: "Les chambres disponibles entre 11 h et 17 h s’affichent.",
    observed: "Le créneau n’est pas compris du premier coup.",
    photo: "/visuels/iphone-autour.png",
    defaultQuestion: "Le créneau 11 h – 17 h est-il plus clair après une seconde tentative ?",
  },
  {
    id: "company-path",
    title: "Le parcours entreprise demande trop d’étapes",
    screen: "Comment ça marche",
    testers: 8,
    steps: ["Ouvrez Bed Hop.", "Lisez Comment ça marche.", "Dites si le paiement par l’entreprise est clair."],
    expected: "Le paiement par l’entreprise se comprend du premier coup.",
    observed: "Le parcours demande trop d’étapes avant d’entrer.",
    photo: "/visuels/iphone-comment.png",
    defaultQuestion: "Le parcours entreprise est-il plus clair après une seconde lecture ?",
  },
  {
    id: "map-slow",
    title: "La carte autour de toi répond lentement",
    screen: "Autour de toi",
    testers: 5,
    steps: ["Ouvrez Bed Hop.", "Ouvrez Autour de toi.", "Attendez l’affichage des chambres."],
    expected: "Les chambres autour de vous s’affichent tout de suite.",
    observed: "La carte met trop de temps à répondre.",
    photo: "/visuels/iphone-autour.png",
    defaultQuestion: "La carte a-t-elle répondu plus vite à la seconde tentative ?",
  },
];

export { OFFERS as offers, formatOfferPrice, formatStoredOfferPrice } from "../../lib/offers.js";
