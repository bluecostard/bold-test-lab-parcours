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
      { label: "Google Play", detail: "Ouvrir sur Google Play", href: "https://play.google.com/store/apps/details?id=online.bedhop.app", icon: "▶" },
      { label: "Visiter le site", detail: "Découvrir Bed Hop sur le web", href: "https://bedhop.online", icon: "◎" },
    ],
    socials: [
      { label: "Instagram", href: "https://www.instagram.com/bedhop26", icon: "◎" },
      { label: "TikTok", href: null, icon: "♪" },
      { label: "Facebook", href: null, icon: "f" },
      { label: "LinkedIn", href: null, icon: "in" },
      { label: "YouTube", href: null, icon: "▶" },
    ],
    instructions: [
      "Ouvrez Bed Hop.",
      "Cherchez une chambre entre 11 h et 17 h.",
      "Dites si la réservation est claire.",
    ],
    appScreens: ["Accueil", "Autour de toi", "Comment ça marche"],
    kind: "app",
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

export const testerComments = [
  { id: 1, projectId: "bed-hop", project: "Bed Hop", author: "Léa", text: "La recherche entre 11 h et 17 h est claire. On comprend que l’entreprise paie.", likes: 12 },
  { id: 2, projectId: "du-rose-au-noir", project: "Du rose au noir", author: "Thomas", text: "Le parcours est simple et les deux formules sont bien distinctes.", likes: 7 },
  { id: 3, projectId: "comptoir-du-oui", project: "Comptoir du Oui", author: "Camille", text: "Le livret et la cagnotte se comprennent dès l’accueil.", likes: 4 },
];

export const bottomNavigation = [
  { id: "discover", label: "Découvrir", icon: "compass" },
  { id: "community", label: "Communauté", icon: "people" },
  { id: "explore", label: "Explorer", icon: "explore" },
  { id: "ranking", label: "Classement", icon: "ranking" },
  { id: "messages", label: "Message", icon: "message" },
];

export const ranking = [
  { name: "Léa", tested: 48, points: 420 },
  { name: "Thomas", tested: 41, points: 395 },
  { name: "Camille", tested: 34, points: 368 },
  { name: "Alex", tested: 29, points: 340 },
  { name: "Sophie", tested: 25, points: 312 },
  { name: "Julien", tested: 22, points: 290 },
  { name: "Manon", tested: 18, points: 276 },
  { name: "Nicolas", tested: 15, points: 258 },
  { name: "Élise", tested: 12, points: 241 },
  { name: "Maxime", tested: 9, points: 228 },
];

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

export const offers = [
  { label: "Nuit courte", range: "00 h – 6 h", price: 19 },
  { label: "Matinée", range: "6 h – 12 h", price: 39 },
  { label: "Après-midi", range: "12 h – 18 h", price: 55 },
  { label: "Soirée", range: "18 h – 00 h", price: 65 },
  { label: "Demi-journée (matin)", range: "00 h – 12 h", price: 49 },
  { label: "Demi-journée (après-midi)", range: "12 h – 00 h", price: 109 },
  { label: "24 heures", range: "24 h", price: 149 },
];
