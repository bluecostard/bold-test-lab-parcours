import { useEffect, useState } from "react";
import { Menu } from "./Menu.jsx";
import { products } from "./Home.jsx";
import { Fields } from "./Fields.jsx";
import { OfferPick } from "./Offer.jsx";

/* Centres des pictos maquette 02 (y ~67.5 %) — hit-target circulaire, sans pastille */
const networks = [
  ["Instagram", 10.0],
  ["TikTok", 27.9],
  ["Facebook", 45.8],
  ["LinkedIn", 63.8],
  ["YouTube", 81.8],
];

const screens = [
  {
    file: "/ecrans/01.png",
    title: "Accueil",
    zones: [
      [43, 7, 8, 84, 2, "Tester cette appli"],
      [91, 9, 0, 25, 1, "Découvrir"],
      [91, 9, 25, 25, 9, "Testeurs"],
      [91, 9, 50, 25, 10, "Classement"],
      [91, 9, 75, 25, 11, "Profil"],
    ],
  },
  {
    file: "/ecrans/02.png",
    title: "Campagne",
    zones: [
      [0, 8, 0, 28, 1, "Retour"],
      [91, 6, 6, 88, 3, "Donner mon avis"],
    ],
  },
  {
    file: "/ecrans/03.png",
    title: "Rédiger l’avis",
    zones: [
      [0, 8, 0, 46, 2, "Retour à la campagne"],
      [88.5, 6, 4, 92, 4, "Publier mon avis"],
    ],
  },
  {
    file: "/ecrans/04.png",
    title: "Compte rendu",
    zones: [
      [6, 5, 0, 24, 3, "Retour"],
      [94.5, 5, 4, 92, 5, "Continuer"],
    ],
  },
  {
    file: "/ecrans/05.png",
    title: "Vérification",
    zones: [
      [0, 7, 0, 22, 4, "Retour"],
      [88.2, 2.6, 4, 92, 6, "Compléter et publier"],
      [90.8, 2.6, 4, 92, 11, "Enregistrer le brouillon"],
    ],
  },
  {
    file: "/ecrans/06.png",
    title: "Avis publié",
    zones: [
      [0, 8, 0, 22, 2, "Retour"],
      [64, 5, 6, 42, "Le like ne modifie pas le classement dans ce parcours.", "J’aime"],
      [64, 5, 52, 42, "Le partage n’est pas branché.", "Partager"],
      [82.5, 5, 58, 36, "login", "Se connecter"],
    ],
  },
  {
    file: "/ecrans/07.png",
    title: "Signalement",
    zones: [
      [0, 7, 0, 24, 16, "Retour"],
      [78, 6, 6, 88, 8, "Envoyer la question"],
      [88, 8, 4, 92, 12, "Lancer un test ciblé"],
    ],
  },
  {
    file: "/ecrans/08.png",
    title: "Question au testeur",
    zones: [
      [0, 8, 0, 28, 7, "Retour"],
      [61, 7, 6, 88, 6, "Répondre"],
      [69, 6, 6, 88, 6, "Passer pour le moment"],
      [80, 6, 4, 92, 6, "Relire mon avis"],
    ],
  },
  {
    file: "/ecrans/09.png",
    title: "Applis des testeurs",
    zones: [
      [0, 8, 72, 28, 1, "Fermer"],
      [31.5, 6, 48, 48, "detail:Plantae", "Découvrir Plantae"],
      [51, 6, 48, 48, "detail:MindFlow", "Découvrir MindFlow"],
      [70.5, 6, 48, 48, "detail:GoodSpot", "Découvrir GoodSpot"],
      [89.5, 6, 48, 48, "detail:Alba", "Découvrir Alba"],
    ],
  },
  {
    file: "/ecrans/10.png",
    title: "Classement",
    zones: [
      [77.5, 6, 6, 88, 2, "Tester un projet"],
      [91, 9, 0, 25, 1, "Découvrir"],
      [91, 9, 25, 25, 9, "Communauté"],
      [91, 9, 50, 25, 10, "Classement"],
      [91, 9, 75, 25, 11, "Profil"],
    ],
  },
  {
    file: "/ecrans/11.png",
    title: "Profil",
    zones: [
      [69, 7, 6, 88, "Les maquettes ne contiennent pas le formulaire du projet.", "Ajouter ou modifier mon projet"],
      [78.5, 8, 4, 92, "campagne", "Faire tester mon service"],
      [91, 9, 0, 25, 1, "Découvrir"],
      [91, 9, 25, 25, 9, "Communauté"],
      [91, 9, 50, 25, 10, "Classement"],
      [91, 9, 75, 25, 11, "Profil"],
    ],
  },
  {
    file: "/ecrans/12.png",
    title: "Offre et créneau",
    zones: [
      [0, 7, 0, 22, 11, "Retour"],
      [92.5, 6, 42, 56, 13, "Continuer vers le paiement"],
    ],
  },
  {
    file: "/ecrans/13.png",
    title: "Récapitulatif",
    zones: [
      [0, 8, 0, 28, 12, "Retour"],
      [26, 5, 58, 38, 12, "Modifier le créneau"],
      [89, 6.5, 4, 92, 14, "Payer avec Stripe"],
    ],
  },
  {
    file: "/ecrans/14.png",
    title: "Paiement confirmé",
    zones: [
      [83.5, 7, 5, 90, 15, "Voir ma campagne"],
      [90.5, 5, 18, 64, "Les maquettes ne contiennent pas le reçu.", "Voir mon reçu"],
    ],
  },
  {
    file: "/ecrans/15.png",
    title: "Résultats",
    zones: [
      [53, 6, 6, 88, 16, "Ouvrir le rapport"],
      [64, 5, 4, 42, 6, "Lire tous les avis"],
      [64, 5, 50, 46, "Les maquettes ne contiennent pas le fichier PDF.", "Télécharger le rapport PDF"],
      [84, 6, 6, 88, 16, "Suivre les retours"],
      [91, 9, 0, 25, 1, "Accueil"],
      [91, 9, 25, 25, 12, "Campagnes"],
      [91, 9, 50, 25, 15, "Résultats"],
      [91, 9, 75, 25, 11, "Profil"],
    ],
  },
  {
    file: "/ecrans/16.png",
    title: "Rapport",
    zones: [
      [48, 7, 55, 42, 7, "Voir le premier détail"],
      [55.5, 7, 55, 42, 7, "Voir le deuxième détail"],
      [62.5, 7, 55, 42, 7, "Voir le troisième détail"],
      [92.5, 6, 2, 32, 6, "Lire les avis"],
      [92.5, 6, 34, 32, "Les maquettes ne contiennent pas le fichier PDF.", "Rapport PDF"],
      [92.5, 6, 66, 32, "Les maquettes ne contiennent pas le fichier CSV.", "Exporter CSV"],
    ],
  },
];

/* Slogans de 10.png, mesurés au pixel sur l’image source (853 × 1844).
   La maquette n’a pas la même structure en haut et en bas :
   - rangs 1–3 : le slogan occupe sa propre ligne, sous le prénom ;
   - rangs 4–10 : le slogan est à droite du prénom, sur une ligne de base plus basse.
   cacheX = le rectangle qui efface le slogan (jamais le prénom, jamais les points),
   textX = le x où commençait le slogan, midY = le centre de son x-height,
   em = la taille de police relevée, bg = le fond exact de la maquette à cet endroit. */
const RANK_IMG_W = 853;
const RANK_IMG_H = 1844;

const ranks = [
  { text: "48 applis testés", cacheX: [232, 593], textX: 238, midY: 310.5, boxH: 30, em: 23, bg: "#102535", ink: "#d6e7f8", cover: "/visuels/rank-covers/lea.png" },
  { text: "41 applis testés", cacheX: [232, 574], textX: 241, midY: 444.5, boxH: 28, em: 23, bg: "#0d2439", ink: "#d6e7f8", cover: "/visuels/rank-covers/thomas.png" },
  { text: "34 applis testés", cacheX: [232, 500], textX: 241, midY: 580.5, boxH: 28, em: 23, bg: "#0a2137", ink: "#d6e7f8", cover: "/visuels/rank-covers/camille.png" },
  { text: "29 applis testés", cacheX: [286, 653], textX: 303, midY: 708.0, boxH: 28, em: 22, bg: "#051d33", ink: "#cbdcf1", cover: "/visuels/rank-covers/alex.png" },
  { text: "25 applis testés", cacheX: [315, 556], textX: 324, midY: 791.0, boxH: 28, em: 22, bg: "#051e33", ink: "#cbdcf1", cover: "/visuels/rank-covers/sophie.png" },
  { text: "22 applis testés", cacheX: [303, 490], textX: 317, midY: 877.0, boxH: 28, em: 22, bg: "#051d32", ink: "#cbdcf1", cover: "/visuels/rank-covers/julien.png" },
  { text: "18 applis testés", cacheX: [312, 607], textX: 331, midY: 965.0, boxH: 28, em: 22, bg: "#051d32", ink: "#cbdcf1", cover: "/visuels/rank-covers/manon.png" },
  { text: "15 applis testés", cacheX: [318, 536], textX: 331, midY: 1051.5, boxH: 28, em: 22, bg: "#051e34", ink: "#cbdcf1", cover: "/visuels/rank-covers/nicolas.png" },
  { text: "12 applis testés", cacheX: [289, 526], textX: 307, midY: 1139.0, boxH: 28, em: 22, bg: "#051d33", ink: "#cbdcf1", cover: "/visuels/rank-covers/elise.png" },
  { text: "9 applis testés", cacheX: [325, 578], textX: 336, midY: 1233.0, boxH: 28, em: 22, bg: "#051d32", ink: "#cbdcf1", cover: "/visuels/rank-covers/maxime.png" },
];

const cqw = (px) => ((px / RANK_IMG_W) * 100).toFixed(3) + "cqw";
const pctX = (px) => ((px / RANK_IMG_W) * 100).toFixed(3) + "%";
const pctY = (px) => ((px / RANK_IMG_H) * 100).toFixed(3) + "%";

function RankLines() {
  return (
    <div className="rank-layer">
      {ranks.map(({ text, cacheX, textX, midY, boxH, em, bg, ink, cover }) => (
        <p
          key={text}
          className="rank-line"
          style={{
            left: pctX(cacheX[0]),
            width: pctX(cacheX[1] - cacheX[0]),
            top: pctY(midY - boxH / 2),
            height: pctY(boxH),
            paddingLeft: cqw(textX - cacheX[0]),
            fontSize: cqw(em),
            backgroundColor: bg,
            backgroundImage: cover ? `url(${cover})` : undefined,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            color: ink,
          }}
        >
          {text}
        </p>
      ))}
    </div>
  );
}

function CampaignFace({ name }) {
  const product = products.find((item) => item.name === name) ?? products[0];
  // Jamais iphone-*.png (bandes empilées) : ecran-*.jpg dans le cadre téléphone.
  const preferred = product.screen || "/visuels/ecran-bedhop.jpg";
  const raw = product.screens?.length ? product.screens : [preferred];
  const shots = raw.filter((src) => !/iphone-/i.test(src));
  const frames = shots.length ? shots : [preferred];
  return (
    <>
      <p className="swap-title">Tester <b>{product.name}</b></p>
      <a className="swap-logo" href={product.url} target="_blank" rel="noreferrer" aria-label={`Ouvrir ${product.name}`}>
        <img src={product.logo} alt="" />
      </a>
      <p className="swap-name">{product.name}</p>
      <div className="swap-screen" aria-label={`Écrans de ${product.name}`}>
        {frames.map((src) => (
          <a key={src} href={product.url} target="_blank" rel="noreferrer">
            <img src={src} alt={`Écran de ${product.name}`} />
          </a>
        ))}
      </div>
      {networks.map(([label, left]) => {
        const href = product.socials.find((item) => item.label === label)?.href;
        return href ? (
          <a
            key={label}
            className="swap-net is-on"
            style={{ left: left + "%" }}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
          />
        ) : (
          <span key={label} className="swap-net is-off" style={{ left: left + "%" }} aria-label={`${label} non fourni`} />
        );
      })}
    </>
  );
}

export function Maquettes({ screen = 2, onOpen, campaignName }) {
  const [index, setIndex] = useState(screen - 1);
  const [note, setNote] = useState("");
  const current = screens[index];

  useEffect(() => {
    setIndex(screen - 1);
    setNote(screen === 14 ? "Paiement simulé. La page Stripe n’est pas ouverte." : "");
    window.scrollTo(0, 0);
  }, [screen]);

  function open(target) {
    if (typeof target === "number") {
      onOpen(target);
      return;
    }
    if (typeof target === "string" && target.startsWith("detail:")) {
      onOpen("detail", target.slice(7));
      return;
    }
    if (target === "login" || target === "campagne" || target === "reglages") {
      onOpen(target);
      return;
    }
    setNote(target);
  }

  if (screen === 12) return <OfferPick onOpen={onOpen} />;

  const hasOwnMenu = [10, 11, 15].includes(screen);

  return (
    <div className={hasOwnMenu ? "sheet" : "sheet has-menu"}>
      <div className="sheet-face">
        <img src={current.file + "?v=4"} alt={current.title} />
        {current.zones.map((zone) => (
          <button
            key={zone[5] + zone[0]}
            type="button"
            className="zone"
            style={{ top: zone[0] + "%", height: zone[1] + "%", left: zone[2] + "%", width: zone[3] + "%" }}
            aria-label={zone[5]}
            onClick={() => open(zone[4])}
          />
        ))}
        {note ? (
          <p className="toast" role="status">
            {note}
          </p>
        ) : null}
        {screen === 2 ? <CampaignFace name={campaignName} /> : null}
        {screen === 9 ? <span className="pager-cover" aria-hidden="true" /> : null}
        {screen === 10 ? <RankLines /> : null}
        <Fields screen={screen} onOpen={onOpen} />
      </div>
      {hasOwnMenu ? null : <Menu screen={screen} onOpen={onOpen} />}
    </div>
  );
}
