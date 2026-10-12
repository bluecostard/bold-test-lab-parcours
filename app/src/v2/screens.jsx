import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SignIn, SignUp, useAuth, useClerk, useSignIn, useUser } from "@clerk/react";
import { slotAvailable } from "../../lib/availability.js";
import { apply, campaignDeadlineLabel, campaignPeriodLabel, campaignRemainingMsFor, campaignTimerParts, campaignTimerProgress, canManageBooking, demoOfferDays, formattedDate, isCampaignSlotActive, isIsoDate, localToday } from "./booking.js";
import { useCampaignCatalog } from "./catalog.js";
import { campaigns, formatOfferPrice, formatStoredOfferPrice, offers, ranking, testerComments, testerRail } from "./data.js";
import { isNativeIos } from "./nativePay.js";
import { readAccount, writeAccount } from "../screens/account.js";
import { readQuestion, answerQuestion } from "./questionsApi.js";
import { forgetFile, isHostedMedia, rememberFile, uploadMedia } from "./mediaApi.js";
import { flagReview, getReview, likeReview, listReviews } from "./reviewsApi.js";
import { projectsInTop10, useRanking } from "./rankingApi.js";
import { blockAuthor, hasPaidCampaign, isAuthorBlocked, readProfile, readPublicPseudo, readV2State, savePublicPseudo, setLocalUser, unblockAuthor, updateLocalProfile, updateV2State, visibleReviews } from "./state.js";
import { ShellWithNav } from "./chrome.jsx";
import {
  BackButton,
  Button,
  CampaignInstructions,
  Card,
  ExpandIcon,
  Field,
  FlowHeader,
  Header,
  PageShell,
  ProjectIdentity,
  SectionTitle,
  Tags,
} from "./primitives.jsx";
import { CampaignSocialList } from "./socialIcons.jsx";

function scrollRailTo(rail, index) {
  if (!rail) return;
  const width = rail.clientWidth;
  if (width) rail.scrollLeft = index * width;
}

function railIndex(rail) {
  if (!rail) return 0;
  return Math.round(rail.scrollLeft / Math.max(1, rail.clientWidth));
}

function useCampaignDeadline(campaign) {
  const [label, setLabel] = useState(() => campaignDeadlineLabel(Date.now(), campaign));
  useEffect(() => {
    const id = window.setInterval(() => setLabel(campaignDeadlineLabel(Date.now(), campaign)), 1000);
    return () => window.clearInterval(id);
  }, [campaign?.id, campaign?.offerDate, campaign?.offerLabel]);
  return label;
}

function useCampaignTimer(campaign) {
  const [state, setState] = useState(() => ({
    ...campaignTimerParts(campaignRemainingMsFor(campaign)),
    progress: campaignTimerProgress(campaign),
  }));
  useEffect(() => {
    const tick = () => setState({
      ...campaignTimerParts(campaignRemainingMsFor(campaign)),
      progress: campaignTimerProgress(campaign),
    });
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [campaign?.id, campaign?.offerDate, campaign?.offerLabel, campaign?.offerRange]);
  return state;
}

function railDotIndex(rail, dots) {
  if (!rail || dots <= 1) return 0;
  const max = rail.scrollWidth - rail.clientWidth;
  if (max <= 1) return 0;
  return Math.min(dots - 1, Math.max(0, Math.round((rail.scrollLeft / max) * (dots - 1))));
}

function TesterAppsRail({ navigate }) {
  const { ranking: rows } = useRanking(null);
  const projects = projectsInTop10(rows);
  const list = projects.length ? projects : testerRail;
  const dots = Math.min(4, Math.max(1, list.length));
  const railRef = useRef(null);
  const [dot, setDot] = useState(0);

  function sync() {
    setDot(railDotIndex(railRef.current, dots));
  }

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    sync();
    rail.addEventListener("scroll", sync, { passive: true });
    return () => rail.removeEventListener("scroll", sync);
  }, [dots, list.length]);

  return (
    <>
      <div className="v2-project-rail-wrap">
        <div ref={railRef} className="v2-project-rail" role="list" aria-label="Projets des testeurs du top 10">
          {list.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => navigate("browse", { campaignId: project.id })}
              aria-label={`Découvrir ${project.name}`}
            >
              <span className="v2-project-rail-logo">
                <img
                  src={project.logo || project.fallback}
                  alt=""
                  onError={(event) => {
                    if (project.fallback && event.currentTarget.src !== project.fallback) event.currentTarget.src = project.fallback;
                  }}
                />
              </span>
              <strong>{project.name}</strong>
              <span>{project.pitch}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="v2-project-rail-dots" aria-hidden="true">
        {Array.from({ length: dots }, (_, index) => (
          <i key={index} className={index === dot ? "is-on" : ""} />
        ))}
      </div>
    </>
  );
}

function ScreenshotRail({ name, screenshots, slide, onSlide, onOpen, railRef }) {
  return (
    <>
      <div ref={railRef} className="v2-screenshot-rail" aria-label={`Captures de ${name}`} onScroll={() => onSlide(railIndex(railRef.current))}>
        {screenshots.map((src, index) => (
          <figure key={src}>
            {onOpen ? (
              <button type="button" className="v2-phone-frame" aria-label={`Voir la capture ${index + 1} de ${name} en grand`} onClick={() => onOpen(index)}>
                <img src={src} alt={`Capture ${index + 1} de ${name}`} />
              </button>
            ) : (
              <div className="v2-phone-frame"><img src={src} alt={`Capture ${index + 1} de ${name}`} /></div>
            )}
          </figure>
        ))}
      </div>
      <p className="v2-slide-counter" aria-live="polite">{slide + 1} / {screenshots.length}</p>
    </>
  );
}

function pitchDurationLabel(duration) {
  const match = String(duration || "").match(/^(\d+):(\d{1,2})$/);
  if (!match) return "1:00";
  if (Number(match[1]) * 60 + Number(match[2]) > 60) return "1:00";
  return duration;
}

function capPitchPlayback(event) {
  if (event.currentTarget.currentTime <= 60) return;
  event.currentTarget.pause();
  event.currentTarget.currentTime = 60;
}

function PitchViewer({ pitch, name, onClose, navigate, openDrawer }) {
  const closeRef = useRef(null);
  const videoRef = useRef(null);
  useLayoutEffect(() => {
    closeRef.current?.focus();
    videoRef.current?.play?.().catch(() => {});
  }, []);
  useEffect(() => {
    function onKey(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <FlowHeader navigate={navigate} openDrawer={openDrawer} />
      <main className="v2-stack v2-screenshot-viewer v2-pitch-viewer">
        <div className="v2-community-head">
          <BackButton onClick={onClose} />
          <button ref={closeRef} type="button" className="v2-icon-button" aria-label="Fermer" onClick={onClose}>×</button>
        </div>
        <div className="v2-phone-frame">
          <video
            ref={videoRef}
            src={pitch.src}
            poster={pitch.poster}
            controls
            playsInline
            onTimeUpdate={capPitchPlayback}
            aria-label={`Pitch du fondateur, ${name}`}
          />
        </div>
      </main>
    </>
  );
}

function ScreenshotViewer({ name, screenshots, slide, onSlide, onClose, navigate, openDrawer }) {
  const railRef = useRef(null);
  const closeRef = useRef(null);
  const start = useRef(slide);
  useLayoutEffect(() => {
    scrollRailTo(railRef.current, start.current);
    closeRef.current?.focus();
  }, []);
  useEffect(() => {
    function onKey(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <FlowHeader navigate={navigate} openDrawer={openDrawer} />
      <main className="v2-stack v2-screenshot-viewer">
        <div className="v2-community-head">
          <BackButton onClick={onClose} />
          <button ref={closeRef} type="button" className="v2-icon-button" aria-label="Fermer" onClick={onClose}>×</button>
        </div>
        <ScreenshotRail name={name} screenshots={screenshots} slide={slide} onSlide={onSlide} railRef={railRef} />
      </main>
    </>
  );
}

function useScreenshotGallery(interceptBack) {
  const [slide, setSlide] = useState(0);
  const [viewer, setViewer] = useState(false);
  const railRef = useRef(null);
  const hadViewer = useRef(false);
  const slideRef = useRef(0);
  slideRef.current = slide;
  useLayoutEffect(() => {
    if (viewer) {
      hadViewer.current = true;
      return;
    }
    if (!hadViewer.current) return;
    const index = slideRef.current;
    scrollRailTo(railRef.current, index);
    railRef.current?.querySelectorAll("button")[index]?.focus({ preventScroll: true });
  }, [viewer]);
  useEffect(() => {
    if (!interceptBack) return undefined;
    interceptBack.current = viewer
      ? () => {
          setViewer(false);
          return true;
        }
      : null;
    return () => {
      interceptBack.current = null;
    };
  }, [interceptBack, viewer]);
  return {
    slide,
    setSlide,
    viewer,
    railRef,
    open: (index) => {
      setSlide(index);
      setViewer(true);
    },
    close: () => setViewer(false),
  };
}

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const clerkAppearance = {
  variables: {
    colorPrimary: "#d6ff4a",
    colorBackground: "#10243a",
    colorText: "#f4f7fb",
    colorInputBackground: "#07111c",
    colorInputText: "#f4f7fb",
    colorNeutral: "#d5e2ef",
    borderRadius: "16px",
    fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif",
  },
  elements: {
    card: { background: "#10243a", boxShadow: "none", width: "100%" },
    formButtonPrimary: { background: "#d6ff4a", color: "#142000", fontWeight: 800 },
    footerActionLink: { color: "#d6ff4a", fontSize: "16px" },
    socialButtonsBlockButton: { background: "#07111c", color: "#f4f7fb", border: "0" },
    formFieldInput: { background: "#07111c", color: "#f4f7fb" },
    headerTitle: { color: "#ffffff" },
    headerSubtitle: { color: "#9aafc4" },
    formFieldAction: { color: "#d6ff4a", fontSize: "16px", fontWeight: 800 },
    formFieldAction__forgotPassword: { color: "#d6ff4a", fontSize: "16px", fontWeight: 800 },
  },
};

function padTime(value) {
  return String(value).padStart(2, "0");
}

function FeaturedCampaignCard({ campaign, navigate }) {
  const shot = campaign.screenshots?.[0] || campaign.cover || campaign.logo;
  const timer = useCampaignTimer(campaign);
  const period = campaignPeriodLabel(campaign);
  return (
    <Card className="v2-feature">
      <div className="v2-campaign-strip"><span aria-hidden="true">📣</span><strong>Campagne · {period}</strong></div>
      <div className="v2-feature-timer" aria-live="polite" aria-label={timer.ended ? "Campagne terminée" : `Temps restant ${timer.hours} heures ${timer.minutes} minutes ${timer.seconds} secondes`}>
        {timer.ended ? (
          <p>Campagne terminée</p>
        ) : (
          <>
            <div className="v2-feature-timer-face">
              <span><b>{padTime(timer.hours)}</b><small>h</small></span>
              <i aria-hidden="true">:</i>
              <span><b>{padTime(timer.minutes)}</b><small>min</small></span>
              <i aria-hidden="true">:</i>
              <span><b>{padTime(timer.seconds)}</b><small>s</small></span>
            </div>
            <div className="v2-feature-timer-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(timer.progress * 100)}>
              <i style={{ width: `${Math.max(2, timer.progress * 100)}%` }} />
            </div>
          </>
        )}
      </div>
      <div className="v2-feature-body">
        <div><ProjectIdentity campaign={campaign} /><Tags items={campaign.tags} /><p className="v2-description">{campaign.description || campaign.pitch}</p></div>
        {shot ? <div className="v2-phone-frame"><img src={shot} alt={`Aperçu de ${campaign.name}`} /></div> : null}
      </div>
      <Button type="button" onClick={() => navigate("campaign", { campaignId: campaign.id })}>Tester cette appli <span aria-hidden="true">→</span></Button>
      <p className="v2-helper">Créez un compte pour tester et donner votre avis.</p>
    </Card>
  );
}

export function DiscoverScreen({ navigate, pageRef, openDrawer }) {
  const catalog = useCampaignCatalog();
  const seedIds = new Set(campaigns.map((item) => item.id));
  const apiLive = catalog.filter((item) => !seedIds.has(item.id) && item.live !== false);
  // Accueil : seed Bed Hop seulement si aucune campagne API live ; sinon créneaux en cours uniquement.
  const homePool = apiLive.length
    ? apiLive.filter((item) => isCampaignSlotActive(item))
    : catalog.filter((item) => seedIds.has(item.id) && item.live !== false);
  const featured = homePool[0] || null;
  const extraLive = homePool.slice(1);
  const reviewSource = featured;
  const [liveReviews, setLiveReviews] = useState([]);
  useEffect(() => {
    if (!reviewSource) return;
    listReviews(reviewSource.id).then(setLiveReviews).catch(() => setLiveReviews([]));
  }, [reviewSource?.id]);
  const reviews = visibleReviews(liveReviews).slice(0, 5);
  return (
    <ShellWithNav active="discover" navigate={navigate} pageRef={pageRef} openDrawer={openDrawer}>
      <main className="v2-stack">
        {featured ? (
          <>
            <FeaturedCampaignCard campaign={featured} navigate={navigate} />
            {extraLive.map((item) => (
              <FeaturedCampaignCard key={item.id} campaign={item} navigate={navigate} />
            ))}
          </>
        ) : (
          <Card className="v2-feature">
            <div className="v2-campaign-strip"><span aria-hidden="true">📣</span><strong>Aucune campagne en cours</strong></div>
            <SectionTitle
              title="Prochaine fenêtre bientôt"
              description="Aucune appli n’est à tester aujourd’hui. On découvre la communauté des testeurs. La prochaine campagne s’affichera ici."
            />
            <Button type="button" onClick={() => navigate("explore")}>Explorer <span aria-hidden="true">→</span></Button>
            <Button type="button" variant="outline" onClick={() => navigate("offer")}>Faire tester mon service</Button>
            <p className="v2-helper">Les avis se déposent uniquement sur une campagne entrepreneur.</p>
          </Card>
        )}
        <Card>
          <SectionTitle
            icon="✳"
            title="Les applis des testeurs"
            description="Découvrez librement les projets des 10 meilleurs testeurs."
            action={<button type="button" className="v2-icon-button" aria-label="Ouvrir en plein écran" onClick={() => navigate("community")}><ExpandIcon /></button>}
          />
          <TesterAppsRail navigate={navigate} />
        </Card>
        {reviewSource && reviews.length ? (
          <Card>
            <SectionTitle
              icon="●"
              title={featured ? `Avis sur ${reviewSource.name}` : `Derniers avis · ${reviewSource.name}`}
              description="Cinq retours de testeurs. Touchez un avis pour l’ouvrir."
            />
            <ul className="v2-comments v2-comments--open">
              {reviews.map((review) => {
                const liked = readV2State().likedReviewIds.includes(review.id);
                const likes = review.likes + (liked ? 1 : 0);
                return (
                  <li key={review.id}>
                    <button type="button" onClick={() => navigate("review-published", { campaignId: reviewSource.id, reportId: review.id })}>
                      <img className="v2-avatar" src={review.photo || "/icon-app.png"} alt={review.author || "Testeur"} />
                      <p><strong>{review.author} · {reviewSource.name}</strong><q>{review.text}</q></p>
                      <span aria-label={`${likes} mentions J’aime`}>♥ {likes}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : null}
      </main>
    </ShellWithNav>
  );
}

export function CampaignScreen({ campaign, navigate, back, pageRef, interceptBack, openDrawer }) {
  const deadline = useCampaignDeadline(campaign);
  const gallery = useScreenshotGallery(interceptBack);
  const [pitchOpen, setPitchOpen] = useState(false);
  useEffect(() => {
    if (!interceptBack || !pitchOpen) return undefined;
    interceptBack.current = () => {
      setPitchOpen(false);
      return true;
    };
    return () => {
      interceptBack.current = null;
    };
  }, [interceptBack, pitchOpen]);
  if (pitchOpen && campaign.founderPitch) {
    return (
      <PageShell pageRef={pageRef}>
        <PitchViewer pitch={campaign.founderPitch} name={campaign.name} onClose={() => setPitchOpen(false)} navigate={navigate} openDrawer={openDrawer} />
      </PageShell>
    );
  }
  if (gallery.viewer) {
    return (
      <PageShell pageRef={pageRef}>
        <ScreenshotViewer name={campaign.name} screenshots={campaign.screenshots} slide={gallery.slide} onSlide={gallery.setSlide} onClose={gallery.close} navigate={navigate} openDrawer={openDrawer} />
      </PageShell>
    );
  }
  return (
    <PageShell pageRef={pageRef}>
      <FlowHeader navigate={navigate} openDrawer={openDrawer} />
      <main className="v2-stack v2-detail">
        <BackButton onClick={back} />
        <div><h1>Tester <span>{campaign.name}</span></h1><p className="v2-status">📣 Campagne de 24 h</p><p className="v2-deadline" aria-live="polite">◷ {deadline}</p></div>
        <section className="v2-detail-intro">
          <div><ProjectIdentity campaign={campaign} linked /><Tags items={campaign.tags} /><p className="v2-description">{campaign.description}</p></div>
          <div>
            <ScreenshotRail name={campaign.name} screenshots={campaign.screenshots} slide={gallery.slide} onSlide={gallery.setSlide} onOpen={gallery.open} railRef={gallery.railRef} />
          </div>
        </section>
        {campaign.founderPitch ? (
          <Card>
            <SectionTitle icon="▶" title="Pitch du fondateur" description={`Le fondateur présente ${campaign.name} en une minute.`} />
            <button
              type="button"
              className="v2-avis-frame v2-pitch-thumb"
              aria-label={`Lire le pitch du fondateur, ${campaign.name}`}
              onClick={() => setPitchOpen(true)}
            >
              <img src={campaign.founderPitch.poster} alt="" />
              <span className="v2-avis-play" aria-hidden="true"><i>▶</i></span>
              <span className="v2-avis-duration">{pitchDurationLabel(campaign.founderPitch.duration)}</span>
            </button>
          </Card>
        ) : null}
        {campaign.productLinks ? <Card><SectionTitle icon="↗" title="Accéder au produit" description={`Ouvrez ${campaign.name} sur la plateforme de votre choix.`} /><ul className="v2-link-list">{campaign.productLinks.map((link) => <li key={link.label}><a href={link.href} target="_blank" rel="noreferrer"><span className="v2-link-icon" aria-hidden="true">{link.icon}</span><span><strong>{link.label}</strong><small>{link.detail}</small></span><span aria-hidden="true">↗</span></a></li>)}</ul></Card> : null}
        <Card>
          <SectionTitle icon="⌘" title="Réseaux de l’entrepreneur" description={`Suivez ${campaign.name} sur ses réseaux pour rester informé.`} />
          <CampaignSocialList socials={campaign.socials} name={campaign.name} />
        </Card>
        <CampaignInstructions campaign={campaign} />
        <Card><SectionTitle icon="●" title="Votre retour" description="Une fois votre test réalisé, partagez votre avis." /><Button type="button" onClick={() => navigate("review", { campaignId: campaign.id })}>Donner mon avis <span aria-hidden="true">→</span></Button><p className="v2-helper">Votre brouillon reste sur cet appareil.</p></Card>
      </main>
    </PageShell>
  );
}

export function TesterProjectScreen({ project, back, pageRef, interceptBack, navigate, openDrawer }) {
  const gallery = useScreenshotGallery(interceptBack);
  const [state, setState] = useState(readV2State);
  const liked = Boolean(state.projectLikes[project.id]);
  function like() {
    if (liked) return;
    setState(updateV2State((current) => ({ ...current, projectLikes: { ...current.projectLikes, [project.id]: true } })));
  }
  if (gallery.viewer) {
    return (
      <PageShell pageRef={pageRef}>
        <ScreenshotViewer name={project.name} screenshots={project.screenshots} slide={gallery.slide} onSlide={gallery.setSlide} onClose={gallery.close} navigate={navigate} openDrawer={openDrawer} />
      </PageShell>
    );
  }
  return (
    <PageShell pageRef={pageRef}>
      <FlowHeader navigate={navigate} openDrawer={openDrawer} />
      <main className="v2-stack v2-detail">
        <BackButton onClick={back} />
        <div><h1>Découvrir <span>{project.name}</span></h1></div>
        <section className="v2-detail-intro">
          <div><ProjectIdentity campaign={project} /><Tags items={project.tags} /><p className="v2-description">{project.description}</p></div>
          <div>
            <ScreenshotRail name={project.name} screenshots={project.screenshots} slide={gallery.slide} onSlide={gallery.setSlide} onOpen={gallery.open} railRef={gallery.railRef} />
          </div>
        </section>
        <Card>
          <ul className="v2-link-list">
            <li>
              <a href={project.website} target="_blank" rel="noreferrer">
                <span className="v2-link-icon" aria-hidden="true">◎</span>
                <span><strong>Site internet</strong><small>{project.website.replace(/^https?:\/\//, "")}</small></span>
                <span aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              {project.social?.href ? (
                <a href={project.social.href} target="_blank" rel="noreferrer" aria-label={`${project.social.label} de ${project.name}`}>
                  <span className="v2-link-icon" aria-hidden="true">◎</span>
                  <span><strong>{project.social.label}</strong><small>Réseau social</small></span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <span className="is-disabled" aria-disabled="true">
                  <span className="v2-link-icon" aria-hidden="true">◎</span>
                  <span><strong>{project.social?.label || "Réseau social"}</strong><small>Lien non fourni</small></span>
                </span>
              )}
            </li>
          </ul>
        </Card>
        <button type="button" className="v2-like" aria-pressed={liked} disabled={liked} onClick={like}>
          {liked ? "♥" : "♡"} {project.likes + (liked ? 1 : 0)}
        </button>
      </main>
    </PageShell>
  );
}

function photosFromDraft(saved) {
  const list = saved.photos?.length ? saved.photos : saved.photoUrl ? [{ name: saved.photoName || "capture", url: saved.photoUrl }] : [];
  return list.filter((photo) => photo?.url && (isHostedMedia(photo.url) || photo.url.startsWith("blob:")));
}

function persistablePhotos(photos) {
  return photos.filter((photo) => isHostedMedia(photo.url)).map((photo) => ({ name: photo.name || "capture", url: photo.url }));
}

export function ReviewFormScreen(props) {
  return clerkKey ? <ReviewFormAuthed {...props} /> : <ReviewFormBody {...props} getToken={null} />;
}

function ReviewFormAuthed(props) {
  const { getToken } = useAuth();
  return <ReviewFormBody {...props} getToken={getToken} />;
}

function ReviewFormBody({ campaign, navigate, pageRef, openDrawer, getToken }) {
  const saved = readV2State().reviewDrafts[campaign.id] || {};
  const [text, setText] = useState(saved.text || "");
  const [photos, setPhotos] = useState(() => photosFromDraft(saved));
  const [videoName, setVideoName] = useState(saved.videoName || "");
  const [videoUrl, setVideoUrl] = useState(isHostedMedia(saved.videoUrl) ? saved.videoUrl : "");
  const [videoBusy, setVideoBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const hosted = persistablePhotos(photos);
    updateV2State((state) => ({
      ...state,
      reviewDrafts: {
        ...state.reviewDrafts,
        [campaign.id]: {
          text,
          photos: hosted,
          photoName: hosted[0]?.name || "",
          photoUrl: hosted[0]?.url || "",
          videoName,
          videoUrl: isHostedMedia(videoUrl) ? videoUrl : "",
        },
      },
    }));
  }, [campaign.id, photos, text, videoName, videoUrl]);
  async function addPhotos(event) {
    const files = [...(event.target.files || [])].filter((file) => file.type.startsWith("image/"));
    event.target.value = "";
    for (const file of files) {
      const key = `${file.name}-${file.size}-${Date.now()}`;
      rememberFile(key, file);
      const preview = URL.createObjectURL(file);
      setPhotos((current) => [...current, { name: file.name, url: preview, key, uploading: true }]);
      try {
        const uploaded = await uploadMedia(getToken, file, "image");
        forgetFile(key);
        setPhotos((current) => current.map((photo) => photo.key === key ? { name: uploaded.name, url: uploaded.url } : photo));
      } catch (uploadError) {
        setPhotos((current) => current.map((photo) => photo.key === key ? { ...photo, uploading: false, error: uploadError.message } : photo));
        setError(uploadError.message);
      }
    }
  }
  async function addVideo(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const key = `video-${file.size}-${Date.now()}`;
    rememberFile(key, file);
    setVideoName(file.name);
    setVideoBusy(true);
    setError("");
    try {
      const uploaded = await uploadMedia(getToken, file, "video");
      forgetFile(key);
      setVideoName(uploaded.name);
      setVideoUrl(uploaded.url);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setVideoBusy(false);
    }
  }
  function continueReview(event) {
    event.preventDefault();
    if (text.trim().length < 20) return setError("Décrivez votre expérience en au moins 20 caractères.");
    if (photos.some((photo) => photo.uploading) || videoBusy) return setError("Patientez, envoi des fichiers…");
    setError("");
    navigate("report-form", { campaignId: campaign.id });
  }
  return (
    <PageShell pageRef={pageRef}>
      <FlowHeader navigate={navigate} openDrawer={openDrawer} />
      <form className="v2-stack v2-review-form" onSubmit={continueReview} noValidate>
        <BackButton onClick={() => navigate("campaign", { campaignId: campaign.id })}>Retour à la campagne</BackButton>
        <div className="v2-identity">
          <span className="v2-project-logo"><img src={campaign.logo} alt={`Logo ${campaign.name}`} /></span>
          <div>
            <h1>Mon avis sur <span className="v2-accent">{campaign.name}</span></h1>
            <p>Décrivez ce que vous avez réellement essayé.</p>
          </div>
        </div>
        <Tags items={campaign.tags} />
        <Card><Field label="Votre expérience" error={error}><textarea rows={7} maxLength={10000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Ce qui fonctionne, ce qui bloque, votre suggestion…" aria-describedby="review-count" /></Field><p id="review-count" className="v2-count">{text.length} / 10000</p></Card>
        <Card>
          <SectionTitle title="Ajouter des preuves" description="Ajoutez des captures d’écran et/ou une vidéo pour rendre votre avis plus utile et crédible." />
          <div className="v2-upload-grid">
            {photos.map((photo, index) => (
              <div key={`${photo.name}-${index}`} className="v2-upload v2-upload--preview">
                <img src={photo.url} alt="" />
                <button type="button" className="v2-upload-remove" aria-label={`Retirer ${photo.name}`} onClick={() => { forgetFile(photo.key); setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index)); }}>×</button>
              </div>
            ))}
            <label className="v2-upload"><span aria-hidden="true">▣</span><strong>Capture d’écran</strong><small>JPG, PNG jusqu’à 10 Mo</small><input type="file" accept="image/*" multiple onChange={addPhotos} /></label>
            <label className="v2-upload"><span aria-hidden="true">▶</span><strong>Vidéo</strong><small>{videoBusy ? "Envoi…" : videoName || "MP4, MOV jusqu’à 100 Mo"}</small><input type="file" accept="video/*" onChange={addVideo} /></label>
          </div>
          <p className="v2-info">Masquez vos informations personnelles avant de publier. Ne partagez pas votre nom, e-mail, numéro de téléphone ou toute information sensible.</p>
        </Card>
        <Button type="submit">Publier mon avis <span aria-hidden="true">→</span></Button>
        <p className="v2-helper">Votre avis sera visible par la communauté.</p>
      </form>
    </PageShell>
  );
}

export function ReviewSummaryScreen({ campaign, navigate, back, pageRef }) {
  const draft = readV2State().reviewDrafts[campaign.id] || {};
  function publish() {
    updateV2State((state) => ({ ...state, publishedReviews: { ...state.publishedReviews, [campaign.id]: { ...draft, author: "Vous", publishedAt: new Date().toISOString(), likes: 0 } } }));
    navigate("review-published", { campaignId: campaign.id, reportId: null }, true);
  }
  return (
    <PageShell pageRef={pageRef}>
      <main className="v2-stack">
        <BackButton onClick={back} />
        <div><h1>Vérifier <span className="v2-accent">mon avis</span></h1><p className="v2-muted">Avant publication</p></div>
        <Card><ProjectIdentity campaign={campaign} /><Tags items={campaign.tags} /></Card>
        <Card><SectionTitle icon="✓" title="Votre expérience" /><p className="v2-review-copy">{draft.text}</p></Card>
        <Card><SectionTitle icon="▣" title="Preuves jointes" /><ul className="v2-proof-list"><li>Photo : {draft.photoName || "Aucune"}</li><li>Vidéo : {draft.videoName || "Aucune"}</li></ul></Card>
        <p className="v2-info">Votre avis aide l’entrepreneur même si vous ne revenez pas répondre plus tard.</p>
        <Button type="button" onClick={publish}>Publier mon avis <span aria-hidden="true">→</span></Button>
        <Button type="button" variant="outline" onClick={back}>Modifier</Button>
      </main>
    </PageShell>
  );
}

function formatReviewDate(iso) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(iso ? new Date(iso) : new Date());
}

function ownPhotos(review) {
  if (review.photos?.length) return review.photos.filter((photo) => photo.url);
  if (review.photoUrl) return [{ name: review.photoName || "capture", url: review.photoUrl }];
  return [];
}

function reviewMedia(review, campaign) {
  const shots = campaign.screenshots || [];
  const photos = ownPhotos(review);
  const screenshot = review.screenshot || photos[0]?.url || shots[0];
  const videoUrl = review.videoUrl || "";
  return {
    screenshot,
    videoThumb: review.videoThumb || photos[1]?.url || shots[1] || shots[0],
    videoUrl,
    videoDuration: review.videoDuration || "",
  };
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {filled
        ? <path fill="currentColor" d="M12 20.4 10.6 19C5.4 14.4 2 11.3 2 7.5 2 4.4 4.4 2 7.5 2c1.7 0 3.4.8 4.5 2.1C13.1 2.8 14.8 2 16.5 2 19.6 2 22 4.4 22 7.5c0 3.8-3.4 6.9-8.6 11.5L12 20.4Z" />
        : <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M12 20.4 10.6 19C5.4 14.4 2 11.3 2 7.5 2 4.4 4.4 2 7.5 2c1.7 0 3.4.8 4.5 2.1C13.1 2.8 14.8 2 16.5 2 19.6 2 22 4.4 22 7.5c0 3.8-3.4 6.9-8.6 11.5L12 20.4Z" />}
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="18" cy="5" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path fill="none" stroke="currentColor" strokeWidth="1.8" d="m8.7 10.7 6.6-4.2M8.7 13.3l6.6 4.2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H12l-4 3.2V16H7.5A2.5 2.5 0 0 1 5 13.5Z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M5 19V11M12 19V6M19 19v-5M3 19h18" />
    </svg>
  );
}

export function PublishedReviewScreen(props) {
  return clerkKey ? <PublishedReviewAuthed {...props} /> : <PublishedReviewBody {...props} getToken={null} user={null} />;
}

function PublishedReviewAuthed(props) {
  const { getToken } = useAuth();
  const { user } = useUser();
  return <PublishedReviewBody {...props} getToken={getToken} user={user} />;
}

function PublishedReviewBody({ campaign, reportId, navigate, back, pageRef, openDrawer, getToken, user }) {
  const [savedState, setSavedState] = useState(readV2State);
  const [shared, setShared] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  const [live, setLive] = useState(null);
  const [liveReady, setLiveReady] = useState(false);
  useEffect(() => {
    if (!campaign?.id) return;
    setLiveReady(false);
    const load = reportId
      ? getReview(campaign.id, reportId)
      : listReviews(campaign.id).then((items) => items.find((item) => item.authorId && user?.id && item.authorId === user.id) || null);
    load.then((item) => setLive(item || null)).catch(() => setLive(null)).finally(() => setLiveReady(true));
  }, [campaign.id, reportId, user?.id]);
  const own = savedState.publishedReviews[campaign.id] || savedState.reviewDrafts[campaign.id] || {};
  const removed = Boolean(reportId && liveReady && !live);
  const review = removed ? {} : (live || own);
  const isOwn = live ? Boolean(live.authorId && user?.id === live.authorId) : true;
  const liked = Boolean(review.id && savedState.likedReviewIds.includes(review.id));
  const likes = (live?.likes ?? own.likes ?? 0) + (liked && !live ? 1 : 0);
  const profile = readProfile();
  const authorName = live?.author || profile.name || "Vous";
  const authorPhoto = live?.photo || profile.avatar;
  const authorSince = "Testeur depuis aujourd’hui";
  const publishedDate = formatReviewDate(live?.publishedAt || own.publishedAt);
  const title = live?.title || "Mon retour d’expérience";
  const body = live?.body || review.text || "Votre avis est enregistré sur cet appareil.";
  const media = reviewMedia(review, campaign);
  const [question, setQuestion] = useState(null);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("illicite");
  const [flagDetail, setFlagDetail] = useState("");
  const [flagStatus, setFlagStatus] = useState("");
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    setBlocked(Boolean(live?.authorId && isAuthorBlocked(live.authorId)));
  }, [live?.authorId]);
  useEffect(() => {
    const id = live?.id || reportId;
    if (!id) return;
    readQuestion(id).then(setQuestion).catch(() => setQuestion(null));
  }, [live?.id, reportId]);
  const replyText = question?.text || "";
  const replyDate = formatReviewDate(question?.sentAt || live?.publishedAt || own.publishedAt);
  async function like() {
    if (isOwn || liked || !review.id) return;
    setSavedState(updateV2State((current) => ({
      ...current,
      likedReviewIds: current.likedReviewIds.includes(review.id) ? current.likedReviewIds : [...current.likedReviewIds, review.id],
    })));
    if (live) setLive({ ...live, likes: (live.likes || 0) + 1 });
    if (getToken) {
      try {
        const result = await likeReview(getToken, review.id, campaign.id);
        if (live && Number.isFinite(result.likes)) setLive({ ...live, likes: result.likes });
      } catch {
        /* le compteur local reste */
      }
    }
  }
  async function share() {
    const message = isOwn ? `Mon avis sur ${campaign.name}` : `Avis de ${authorName} sur ${campaign.name}`;
    const copy = `${message}\n${body}`;
    if (navigator.share) await navigator.share({ title: message, text: body });
    else if (navigator.clipboard) await navigator.clipboard.writeText(copy);
    setShared(true);
  }
  if (!isOwn && blocked && live?.authorId) {
    return (
      <PageShell pageRef={pageRef}>
        <FlowHeader navigate={navigate} openDrawer={openDrawer} />
        <main className="v2-stack v2-avis">
          <div className="v2-page-title">
            <BackButton onClick={back}>{""}</BackButton>
            <div>
              <h1>Auteur bloqué</h1>
              <p className="v2-muted">Les avis de {authorName} sont masqués sur cet appareil.</p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => { unblockAuthor(live.authorId); setBlocked(false); }}>Débloquer</Button>
          <Button type="button" onClick={() => navigate("discover")}>Retour à l’accueil</Button>
        </main>
      </PageShell>
    );
  }
  if (removed) {
    return (
      <PageShell pageRef={pageRef}>
        <FlowHeader navigate={navigate} openDrawer={openDrawer} />
        <main className="v2-stack v2-avis">
          <div className="v2-page-title">
            <BackButton onClick={back}>{""}</BackButton>
            <div>
              <h1>Avis indisponible</h1>
              <p className="v2-muted">Cet avis n’est plus affiché.</p>
            </div>
          </div>
          <Button type="button" onClick={() => navigate("discover")}>Retour à l’accueil</Button>
        </main>
      </PageShell>
    );
  }
  return (
    <PageShell pageRef={pageRef}>
      <FlowHeader navigate={navigate} openDrawer={openDrawer} />
      <main className="v2-stack v2-avis">
        <div className="v2-page-title">
          <BackButton onClick={back}>{""}</BackButton>
          <div>
            <h1>Avis sur <span className="v2-accent">{campaign.name}</span></h1>
            <p className="v2-muted">Des retours authentiques de testeurs</p>
          </div>
        </div>
        <section className="v2-avis-author">
          {authorPhoto ? <img src={authorPhoto} alt={authorName} /> : <span className="v2-avis-fallback" aria-hidden="true">{authorName.charAt(0)}</span>}
          <div>
            <strong>{authorName}</strong>
            <span>{authorSince}</span>
          </div>
          <time dateTime={publishedDate}>{publishedDate}</time>
        </section>
        <Tags items={campaign.tags} />
        <h2 className="v2-avis-title">{title}</h2>
        <p className="v2-avis-body">{body}</p>
        <div className="v2-avis-media">
          <figure>
            <div className="v2-avis-frame">
              <img src={media.screenshot} alt="" />
            </div>
            <figcaption>Capture d’écran de ma recherche</figcaption>
          </figure>
          <figure>
            <div className="v2-avis-frame">
              {media.videoUrl ? (
                <video src={media.videoUrl} controls playsInline preload="metadata" />
              ) : (
                <>
                  <img src={media.videoThumb} alt="" />
                  <span className="v2-avis-play" aria-hidden="true"><i>▶</i></span>
                  {media.videoDuration ? <span className="v2-avis-duration">{media.videoDuration}</span> : null}
                </>
              )}
            </div>
            <figcaption>Petite vidéo de mon expérience</figcaption>
          </figure>
        </div>
        <div className="v2-avis-pills">
          <button
            type="button"
            className="v2-avis-pill"
            onClick={like}
            disabled={isOwn || liked}
            aria-pressed={liked}
            title={isOwn ? "Vous ne pouvez pas aimer votre propre avis" : undefined}
          >
            <HeartIcon filled={liked} />
            J’aime ({likes})
          </button>
          <button type="button" className="v2-avis-pill" onClick={share}>
            <ShareIcon />
            Partager
          </button>
        </div>
        {shared ? <p role="status" className="v2-helper">Avis partagé ou copié.</p> : null}
        {!isOwn ? (
          <div className="v2-flag">
            {flagStatus === "ok" ? (
              <p className="v2-helper" role="status">Signalement envoyé. Nous le regarderons.</p>
            ) : (
              <>
                <button type="button" className="v2-text-button" onClick={() => {
                  if (!user) {
                    navigate("login", { campaignId: campaign.id, from: "review-published" });
                    return;
                  }
                  setFlagOpen((open) => !open);
                }}>
                  Signaler cet avis
                </button>
                {flagOpen ? (
                  <form
                    className="v2-flag-form"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      setFlagStatus("working");
                      try {
                        await flagReview(getToken, {
                          reviewId: review.id,
                          campaignId: campaign.id,
                          reason: flagReason,
                          detail: flagDetail,
                        });
                        setFlagStatus("ok");
                        setFlagOpen(false);
                      } catch (error) {
                        setFlagStatus(error.message || "Signalement impossible.");
                      }
                    }}
                  >
                    <fieldset className="v2-choice">
                      <legend>Motif</legend>
                      {[
                        ["illicite", "Contenu illicite ou haineux"],
                        ["spam", "Spam ou publicité"],
                        ["hors-sujet", "Hors sujet"],
                        ["autre", "Autre"],
                      ].map(([id, label]) => (
                        <label key={id} className={flagReason === id ? "is-on" : ""}>
                          <input type="radio" name="flag" checked={flagReason === id} onChange={() => setFlagReason(id)} />
                          {label}
                        </label>
                      ))}
                    </fieldset>
                    <Field label="Précision (facultatif)">
                      <textarea rows={3} maxLength={400} value={flagDetail} onChange={(event) => setFlagDetail(event.target.value)} />
                    </Field>
                    <Button type="submit" disabled={flagStatus === "working" || !review.id}>
                      {flagStatus === "working" ? "Envoi…" : "Envoyer le signalement"}
                    </Button>
                    {flagStatus && flagStatus !== "working" && flagStatus !== "ok" ? (
                      <p className="v2-helper" role="alert">{flagStatus}</p>
                    ) : null}
                  </form>
                ) : null}
              </>
            )}
            {live?.authorId ? (
              <button
                type="button"
                className="v2-text-button"
                onClick={() => {
                  if (!user) {
                    navigate("login", { campaignId: campaign.id, from: "review-published" });
                    return;
                  }
                  blockAuthor({ id: live.authorId, name: authorName });
                  setBlocked(true);
                }}
              >
                Bloquer cet auteur
              </button>
            ) : null}
          </div>
        ) : null}
        <section className="v2-avis-thread">
          <div className="v2-avis-thread-head">
            <h2><ChatIcon /> Discussion utile</h2>
            <p>Trier par : Les plus utiles</p>
          </div>
          {replyText ? (
          <article className="v2-avis-reply">
            <div className="v2-avis-reply-head">
              <span className="v2-avis-brand">
                <img src={campaign.logo} alt={campaign.name} />
              </span>
              <div>
                <strong>{campaign.name}</strong>
                <span>Entrepreneur</span>
              </div>
              <time dateTime={replyDate}>{replyDate}</time>
            </div>
            <p className="v2-avis-bubble">{replyText}</p>
          </article>
          ) : null}
          {isOwn && question && !question.answer ? (
            <Button type="button" onClick={() => navigate("optional-question", { campaignId: campaign.id, reportId: question.reviewId || live?.id || reportId })}>
              Répondre à la question <span aria-hidden="true">→</span>
            </Button>
          ) : null}
          <div className="v2-avis-login">
            <span className="v2-avis-fallback" aria-hidden="true" />
            <p className="v2-avis-login-field">Connectez-vous pour répondre à cet…</p>
            <Button type="button" onClick={() => navigate("login", { campaignId: campaign.id, from: "review-published" })}>Se connecter</Button>
          </div>
        </section>
        {bannerOpen ? (
          <aside className="v2-avis-banner">
            <span className="v2-avis-banner-icon" aria-hidden="true"><ChartIcon /></span>
            <div>
              <strong>Les avis utiles et appréciés font progresser les testeurs dans le classement.</strong>
              <p>Un like indique que l’avis vous a été utile, pas forcément que vous êtes d’accord sur son contenu.</p>
            </div>
            <button type="button" className="v2-avis-banner-close" aria-label="Fermer" onClick={() => setBannerOpen(false)}>×</button>
          </aside>
        ) : null}
      </main>
    </PageShell>
  );
}

function formatQuestionTime(iso) {
  const date = iso ? new Date(iso) : new Date();
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `Aujourd’hui à ${time}`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function OptionalQuestionScreen(props) {
  return clerkKey ? <OptionalQuestionAuthed {...props} /> : <OptionalQuestionBody {...props} getToken={null} />;
}

function OptionalQuestionAuthed(props) {
  const { getToken } = useAuth();
  return <OptionalQuestionBody {...props} getToken={getToken} />;
}

function OptionalQuestionBody({ campaign, reportId, navigate, pageRef, openDrawer, getToken }) {
  const saved = readV2State();
  const sent = saved.sentQuestions[campaign.id] || {};
  const [remote, setRemote] = useState(null);
  const [choice, setChoice] = useState("Oui");
  const [detail, setDetail] = useState("");
  useEffect(() => {
    const id = reportId || sent.reportId;
    if (!id) return;
    readQuestion(id).then(setRemote).catch(() => setRemote(null));
  }, [reportId, sent.reportId]);
  const questionText = remote?.text || sent.text || "Pouvez-vous préciser ce point ?";
  const questionTitle = remote?.bugTitle || sent.bugTitle || "Question de l’entrepreneur";
  function goPublished() {
    navigate("review-published", { campaignId: campaign.id, reportId: remote?.reviewId || reportId || sent.reportId || null }, true);
  }
  async function finish(status) {
    updateV2State((state) => ({
      ...state,
      optionalAnswers: {
        ...state.optionalAnswers,
        [campaign.id]: status === "skipped" ? { status, label: "Précision non obtenue" } : { status, choice, detail },
      },
    }));
    if (getToken && (remote?.reviewId || reportId)) {
      try {
        await answerQuestion(getToken, {
          reviewId: remote?.reviewId || reportId,
          campaignId: campaign.id,
          status,
          choice,
          detail,
        });
      } catch {
        /* la réponse reste aussi sur cet appareil */
      }
    }
    goPublished();
  }
  return (
    <PageShell pageRef={pageRef}>
      <FlowHeader navigate={navigate} openDrawer={openDrawer} />
      <main className="v2-stack">
        <BackButton onClick={goPublished} />
        <div>
          <h1>Une <span className="v2-accent">question</span> sur votre avis</h1>
          <p className="v2-muted">L’entrepreneur souhaite en savoir un peu plus sur votre expérience.</p>
        </div>
        <Card className="v2-sender">
          <div className="v2-sender-head">
            <a className="v2-project-logo" href={campaign.website} target="_blank" rel="noreferrer" aria-label={`Ouvrir le site de ${campaign.name}`}>
              <img src={campaign.logo} alt={`Logo ${campaign.name}`} />
            </a>
            <div>
              <h2>{campaign.name}</h2>
              <p>Entrepreneur</p>
            </div>
            <time dateTime={remote?.sentAt || sent.sentAt || undefined}>{formatQuestionTime(remote?.sentAt || sent.sentAt)}</time>
          </div>
          <button type="button" className="v2-link-row" onClick={goPublished}>
            <span>
              <small>Votre signalement :</small>
              <strong>{questionTitle}</strong>
            </span>
            <b aria-hidden="true">›</b>
          </button>
        </Card>
        <h2 className="v2-question-title">{questionText}</h2>
        <fieldset className="v2-choice v2-choice--pair">
          <legend className="v2-sr">Votre réponse</legend>
          {["Oui", "Non"].map((option) => (
            <label key={option} className={choice === option ? "is-on" : ""}>
              <input type="radio" name="answer" checked={choice === option} onChange={() => setChoice(option)} />
              {option}
            </label>
          ))}
        </fieldset>
        <Field label="Votre précision (facultatif)">
          <textarea rows={4} maxLength={500} value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="Vous pouvez ajouter un détail ici (message d’erreur, appareil utilisé, moment de la journée…)." aria-describedby="precision-count" />
        </Field>
        <p id="precision-count" className="v2-count">{detail.length} / 500</p>
        <Button type="button" onClick={() => finish("answered")}>Répondre à la question <span aria-hidden="true">→</span></Button>
        <Button type="button" variant="outline" onClick={() => finish("skipped")}>Passer pour le moment</Button>
        <p className="v2-info">La réponse est facultative. Votre avis et vos points restent inchangés si vous ne répondez pas.</p>
        <button type="button" className="v2-link-row v2-link-row--card" onClick={goPublished}>
          <span aria-hidden="true">◎</span>
          <span>
            <strong>Relire mon avis</strong>
            <small>Vous pouvez consulter à tout moment l’avis que vous avez publié.</small>
          </span>
          <b aria-hidden="true">›</b>
        </button>
        <div className="v2-link-row v2-link-row--card" role="note">
          <span aria-hidden="true">◐</span>
          <span>
            <strong>Si vous ne répondez pas</strong>
            <small>Si vous ne répondez pas, l’entrepreneur verra : « Précision non obtenue ».</small>
          </span>
        </div>
      </main>
    </PageShell>
  );
}

export function CommunityScreen({ navigate, back, pageRef, openDrawer }) {
  const { ranking: rows } = useRanking(null);
  const projects = projectsInTop10(rows);
  const list = projects.length ? projects : testerRail.map((item, index) => ({ ...item, rank: index + 1 }));
  return (
    <ShellWithNav active="community" navigate={navigate} pageRef={pageRef} openDrawer={openDrawer} header={false}>
      <main className="v2-stack">
        <div className="v2-community-head">
          <h1>Les applis <span className="v2-accent">des testeurs</span></h1>
          <button type="button" className="v2-icon-button" aria-label="Fermer" onClick={back}>×</button>
        </div>
        <p className="v2-muted">Les 10 meilleurs contributeurs</p>
        <p className="v2-info">Ces projets gagnent en visibilité grâce aux avis utiles de notre communauté, pas par l’achat d’espace publicitaire.</p>
        <p className="v2-description">Leurs projets restent ici tant qu’ils figurent dans le top 10.</p>
        <div className="v2-community-list">
          {list.map((project) => {
            const comment = testerComments.find((item) => item.projectId === project.id);
            return (
              <Card key={project.id} className="v2-community-card v2-community-card--row">
                <span className="v2-rank-badge">{project.rank || ""}</span>
                <img src={project.cover} alt={project.name} onError={(event) => { if (project.fallback && event.currentTarget.src !== project.fallback) event.currentTarget.src = project.fallback; }} />
                <div>
                  <ProjectIdentity campaign={project} size="compact" linked />
                  {comment ? <q>{comment.text}</q> : null}
                  <Tags items={project.tags} />
                  <Button type="button" onClick={() => navigate("browse", { campaignId: project.id })}>Découvrir <span aria-hidden="true">→</span></Button>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </ShellWithNav>
  );
}

function RankingCrown() {
  return (
    <svg className="v2-crown" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M5 16 3 8l5.2 3.2L12 5l3.8 6.2L21 8l-2 8H5Zm0 2h14v2H5v-2Z" />
    </svg>
  );
}

function RankingRow({ person, place, className = "" }) {
  return (
    <li className={className}>
      <span className="v2-position">{place}</span>
      <img className="v2-ranking-photo" src={person.photo || "/icon-app.png"} alt={person.name} width="76" height="76" />
      <span>
        <strong>
          {person.name}
          {place === 1 ? <RankingCrown /> : null}
          {person.live === false ? <em className="v2-seed-mark">Exemple</em> : null}
        </strong>
        <small>{person.phrase}</small>
      </span>
      <b>{person.points} pts</b>
    </li>
  );
}

export function RankingScreen(props) {
  return clerkKey ? <RankingAuthed {...props} /> : <RankingBody {...props} getToken={null} />;
}

function RankingAuthed(props) {
  const { getToken } = useAuth();
  return <RankingBody {...props} getToken={getToken} />;
}

function RankingBody({ navigate, pageRef, openDrawer, getToken }) {
  const { ranking: rows, me } = useRanking(getToken);
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const localReviews = Object.values(readV2State().publishedReviews || {});
  const localPoints = localReviews.reduce((sum, review) => sum + (Number(review.likes) || 0), 0);
  const points = me ? me.points : localPoints;
  const inTop = me ? me.inTop10 : false;
  const place = me?.place || 0;
  const rankLabel = me ? (inTop || place ? `${place}e` : "hors classement") : (points ? "hors classement" : null);
  const tenth = rows[9]?.points || 0;
  const need = inTop ? 0 : Math.max(0, tenth - points);
  return (
    <ShellWithNav active="ranking" navigate={navigate} pageRef={pageRef} openDrawer={openDrawer}>
      <main className="v2-stack">
        <div><h1>Classement <span className="v2-accent">des testeurs</span></h1><p className="v2-muted">30 derniers jours</p></div>
        <p className="v2-description">Les avis précis et appréciés font gagner des points. Un like sur votre propre avis ne compte pas. Les lignes marquées « Exemple » complètent le top 10 tant qu’il n’y a pas assez de testeurs.</p>
        <ol className="v2-ranking-podium">
          {podium.map((person) => (
            <RankingRow key={person.id || person.name} person={person} place={person.place} className={`is-podium is-${person.place}`} />
          ))}
        </ol>
        <ol className="v2-ranking-list" start={4}>
          {rest.map((person) => (
            <RankingRow key={person.id || person.name} person={person} place={person.place} className={person.place <= 5 ? "is-top5" : ""} />
          ))}
        </ol>
        <Card className="v2-user-rank">
          <span className="v2-ranking-photo" aria-hidden="true">V</span>
          <strong>{rankLabel ? `Vous · ${rankLabel}` : "Vous"}</strong>
          <b>{points} pts</b>
          <p>{inTop ? "Vous êtes dans le top 10." : (need ? `Encore ${need} points pour atteindre le top 10.` : "Publiez un avis pour entrer dans le classement.")}</p>
          <progress value={points} max={Math.max(tenth, 1)}>{points} sur {tenth}</progress>
          <Button type="button" onClick={() => navigate("discover")}>Tester la campagne <span aria-hidden="true">→</span></Button>
        </Card>
        <p className="v2-info">Les projets des membres du top 10 sont visibles dans la Communauté tant qu’ils y restent.</p>
      </main>
    </ShellWithNav>
  );
}

function BookingSlotCard() {
  const [account, setAccount] = useState(readAccount);
  const [panel, setPanel] = useState("");
  const [priceDelta, setPriceDelta] = useState(null);
  const catalog = useCampaignCatalog();
  const today = localToday();
  const offerLabel = account.offerLabel || "";
  const ignoreId = account.campaignId || "";
  const days = demoOfferDays(today, 4).map((day) => ({
    ...day,
    available: slotAvailable(day.value, offerLabel, catalog, ignoreId, today),
  }));
  const [pickOther, setPickOther] = useState(() => Boolean(isIsoDate(account.offerDate) && !days.some((day) => day.value === account.offerDate)));
  if (!hasPaidCampaign()) return null;
  const open = canManageBooking(account);
  const selectedOfferIndex = offers.findIndex((offer) => offer.label === account.offerLabel);
  const customSelected = pickOther && isIsoDate(account.offerDate) && !days.some((day) => day.value === account.offerDate);
  const chosenAvailable = slotAvailable(account.offerDate, offerLabel, catalog, ignoreId, today);
  const dateInputValue = isIsoDate(account.offerDate) ? account.offerDate : "";

  function toggle(next) {
    setPanel((current) => (current === next ? "" : next));
    if (next !== "period") setPriceDelta(null);
  }

  function changeOffer(index) {
    const { account: next, priceDelta: delta } = apply({ offer: offers[index] });
    setAccount(next);
    setPriceDelta(delta);
  }

  function changeDay(value) {
    if (!isIsoDate(value)) return;
    const { account: next } = apply({ date: value });
    setAccount(next);
  }

  function cancelCampaign() {
    writeAccount({ ...readAccount(), campaignPaid: false });
    setAccount(readAccount());
    setPanel("");
  }

  return (
    <Card>
      <SectionTitle icon="▦" title="Mon créneau" />
      <p className="v2-review-copy">
        <strong>{account.offerLabel}</strong> · {formatStoredOfferPrice(account.offerPrice, isNativeIos())}
        <br />
        {formattedDate(account.offerDate)} · {account.offerRange}
      </p>
      {open ? (
        <>
          <Button type="button" variant="outline" onClick={() => toggle("period")}>Modifier la période</Button>
          <Button type="button" variant="outline" onClick={() => toggle("day")}>Modifier le jour</Button>
          <button type="button" className="v2-text-button" onClick={() => toggle("cancel")}>Annuler la campagne</button>
          {panel === "period" ? (
            <>
              <div className="v2-offer-list" role="radiogroup" aria-label="Offres de campagne">
                {offers.map((offer, index) => (
                  <button
                    key={offer.label}
                    type="button"
                    role="radio"
                    aria-checked={selectedOfferIndex === index}
                    className={selectedOfferIndex === index ? "is-selected" : ""}
                    onClick={() => changeOffer(index)}
                  >
                    <span><strong>{offer.label}</strong><small>{offer.range}</small></span>
                    <b>{formatOfferPrice(offer, isNativeIos())}</b>
                    <i aria-hidden="true" />
                  </button>
                ))}
              </div>
              {priceDelta ? (
                <p className="v2-info" role="status">
                  Écart simulé : {priceDelta > 0 ? `+${priceDelta}` : priceDelta} €. {priceDelta > 0 ? "Aucun paiement réel." : "Aucun remboursement réel."}
                </p>
              ) : null}
            </>
          ) : null}
          {panel === "day" ? (
            <>
              <div className="v2-day-list" role="radiogroup" aria-label="Jours disponibles">
                {days.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    role="radio"
                    aria-checked={!customSelected && account.offerDate === day.value}
                    disabled={!day.available}
                    className={!customSelected && account.offerDate === day.value ? "is-selected" : ""}
                    onClick={() => { setPickOther(false); changeDay(day.value); }}
                  >
                    <span>{day.label}</span>
                    <em className={day.available ? "is-open" : "is-full"}>{day.available ? "Disponible" : "Complet"}</em>
                  </button>
                ))}
              </div>
              {pickOther ? (
                <>
                  <Field label="Indiquez le jour souhaité">
                    <input
                      type="date"
                      min={today}
                      value={dateInputValue}
                      onChange={(event) => {
                        const next = event.target.value;
                        if (!isIsoDate(next)) return;
                        setPickOther(true);
                        changeDay(next);
                      }}
                    />
                  </Field>
                  {customSelected ? (
                    <div className={`v2-picked-day${chosenAvailable ? " is-open" : " is-full"}`}>
                      <span>{formattedDate(account.offerDate)}</span>
                      <em className={chosenAvailable ? "is-open" : "is-full"}>{chosenAvailable ? "Disponible" : "Complet"}</em>
                    </div>
                  ) : null}
                </>
              ) : (
                <button type="button" className="v2-text-button" onClick={() => setPickOther(true)}>Autres dates</button>
              )}
              <p className="v2-info">Disponible ou Complet se calcule sur les campagnes déjà payées pour le même créneau.</p>
            </>
          ) : null}
          {panel === "cancel" ? (
            <>
              <p className="v2-info">Confirmer l’annulation ? Le projet est conservé. Paiement simulé : aucun remboursement réel.</p>
              <Button type="button" onClick={cancelCampaign}>Confirmer l’annulation</Button>
              <button type="button" className="v2-text-button" onClick={() => setPanel("")}>Ne pas annuler</button>
            </>
          ) : null}
        </>
      ) : (
        <p className="v2-info">Modification et annulation fermées — moins de 72 h avant le début.</p>
      )}
    </Card>
  );
}

function testerSinceLabel(createdAt) {
  if (!createdAt) return "Testeur";
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Testeur";
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `Testeur depuis ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function ProfileBody({ navigate, pageRef, openDrawer, signedIn, name, avatar, since, onAvatar, onSignOut, onSavePseudo, getToken }) {
  const [showReviews, setShowReviews] = useState(false);
  const [pseudo, setPseudo] = useState(name || "");
  const [pseudoError, setPseudoError] = useState("");
  const [pseudoBusy, setPseudoBusy] = useState(false);
  const [editingPseudo, setEditingPseudo] = useState(!name);
  const profile = readProfile();
  const hasProject = Boolean(profile.projectName?.trim());
  const projectName = hasProject ? profile.projectName : "Aucun projet configuré";
  const reviews = Object.entries(readV2State().publishedReviews);
  const { me } = useRanking(getToken || null);
  const avis = me?.tested ?? reviews.length;
  const points = me?.points ?? reviews.reduce((sum, [, review]) => sum + (Number(review.likes) || 0), 0);
  const seedIndex = ranking.findIndex((row) => row.name === name);
  const rankLabel = me?.place ? `${me.place}e` : (seedIndex >= 0 ? `${seedIndex + 1}e` : "—");
  const inTop = Boolean(me?.inTop10 || (seedIndex >= 0 && seedIndex < 10));
  return (
    <ShellWithNav navigate={navigate} pageRef={pageRef} openDrawer={openDrawer}>
      <main className="v2-stack v2-profile">
        <section className="v2-profile-identity">
          <label className="v2-avatar-editor">
            {avatar ? <img src={avatar} alt={name || "Photo de profil"} /> : <span aria-hidden="true">{signedIn && name ? name.charAt(0) : ""}</span>}
            <input type="file" accept="image/*" onChange={onAvatar} disabled={!signedIn} />
            {signedIn ? <span>Modifier</span> : null}
          </label>
          <div>
            <p>Bonjour</p>
            {signedIn && name && !editingPseudo ? <h1>{name}</h1> : null}
            {signedIn && (editingPseudo || !name) ? (
              <Field label="Votre pseudo" hint="Nom visible sur vos avis et le classement." error={pseudoError}>
                <input value={pseudo} onChange={(event) => setPseudo(event.target.value)} maxLength={24} autoComplete="nickname" />
              </Field>
            ) : null}
            <p>{signedIn ? since : "Connectez-vous pour publier un avis."}</p>
            {signedIn ? (
              <>
                {onSavePseudo && (editingPseudo || !name) ? (
                  <button
                    type="button"
                    className="v2-text-button"
                    disabled={pseudoBusy}
                    onClick={async () => {
                      setPseudoBusy(true);
                      setPseudoError("");
                      try {
                        await onSavePseudo(pseudo);
                        setEditingPseudo(false);
                      } catch (error) {
                        setPseudoError(error.message || "Impossible d’enregistrer le pseudo.");
                      } finally {
                        setPseudoBusy(false);
                      }
                    }}
                  >
                    {pseudoBusy ? "Enregistrement…" : "Enregistrer le pseudo"}
                  </button>
                ) : name ? (
                  <button type="button" className="v2-text-button" onClick={() => { setPseudo(name); setEditingPseudo(true); }}>Modifier le pseudo</button>
                ) : null}
                <button type="button" className="v2-text-button" onClick={onSignOut}>Se déconnecter</button>
              </>
            ) : (
              <button type="button" className="v2-text-button" onClick={() => navigate("login")}>Se connecter</button>
            )}
          </div>
        </section>
        <Card>
          <SectionTitle
            icon="▥"
            title="Ma contribution"
            description="Un grand merci pour votre engagement ! Voici votre activité des 30 derniers jours."
            action={<button type="button" className="v2-inline-link" onClick={() => setShowReviews((open) => !open)}>Voir mes avis →</button>}
          />
          <div className="v2-stats">
            <div><span className="v2-stat-icon" aria-hidden="true">🏆</span><strong>{rankLabel}</strong><span>au classement des testeurs</span></div>
            <div><span className="v2-stat-icon" aria-hidden="true">📶</span><strong>{points}</strong><span>points gagnés</span></div>
            <div><span className="v2-stat-icon" aria-hidden="true">💬</span><strong>{avis}</strong><span>avis utiles publiés</span></div>
          </div>
          {showReviews ? (
            <ul className="v2-local-reviews">
              {reviews.length ? reviews.map(([id, review]) => {
                const campaign = campaigns.find((item) => item.id === id);
                return (
                  <li key={id}>
                    {campaign ? (
                      <button type="button" onClick={() => navigate("review-published", { campaignId: id, reportId: null })}>
                        <strong>{campaign.name}</strong>
                        <span>{review.text}</span>
                      </button>
                    ) : (
                      <p>Avis conservé localement, hors campagne entrepreneur.</p>
                    )}
                  </li>
                );
              }) : <li>Aucun avis publié sur cet appareil.</li>}
            </ul>
          ) : null}
        </Card>
        <Card>
          <SectionTitle
            icon="◇"
            title="Mon projet"
            action={hasProject ? <span className="v2-wait-chip">{inTop ? "Top 10" : "En attente du top 10"}</span> : null}
          />
          <div className="v2-profile-project">
            {profile.projectLogo ? <img className="v2-profile-project-logo" src={profile.projectLogo} alt={`Logo ${projectName}`} /> : <span className="v2-logo-placeholder" aria-hidden="true">◇</span>}
            <div>
              <h2>{projectName}</h2>
              <p>{profile.projectPitch || "Ajoutez votre projet pour le présenter à la communauté."}</p>
            </div>
          </div>
          {hasProject ? (
            <button type="button" className="v2-ghost-chip" onClick={() => navigate("project-edit")}>✎ Modifier mon projet</button>
          ) : (
            <Button type="button" onClick={() => navigate("project-edit")}>
              Ajouter mon projet <span aria-hidden="true">→</span>
            </Button>
          )}
          <p className="v2-helper v2-helper--left">
            Visibilité Communauté (top 10) — gratuit, sans offre ni paiement. Pour une campagne testeurs, utilisez « Faire tester mon service » plus bas.
          </p>
        </Card>
        <BookingSlotCard />
        <button className="v2-service-entry" type="button" onClick={() => navigate("offer")}>
          <span aria-hidden="true">📣</span>
          <span>
            <strong>Faire tester mon service</strong>
            <small>Campagne payante (offre + créneau) pour toucher des testeurs qualifiés, en complément de la visibilité Communauté ci-dessus.</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
        <button className="v2-service-entry" type="button" onClick={() => navigate("results")}>
          <span aria-hidden="true">⚡</span>
          <span>
            <strong>Mes résultats de test</strong>
            <small>Retrouvez votre campagne et ouvrez le rapport détaillé.</small>
          </span>
          <span aria-hidden="true">→</span>
        </button>
      </main>
    </ShellWithNav>
  );
}

function ClerkProfile(props) {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  if (!isLoaded) {
    return (
      <ShellWithNav navigate={props.navigate} pageRef={props.pageRef} openDrawer={props.openDrawer}>
        <main className="v2-stack v2-profile">
          <p className="v2-muted">Chargement du profil…</p>
        </main>
      </ShellWithNav>
    );
  }
  async function avatarChange(event) {
    const file = event.target.files?.[0];
    if (file && user?.setProfileImage) await user.setProfileImage({ file });
  }
  return (
    <ProfileBody
      {...props}
      signedIn={Boolean(isSignedIn)}
      name={readPublicPseudo(user)}
      avatar={user?.imageUrl || ""}
      since={testerSinceLabel(user?.createdAt)}
      onSignOut={async () => {
        setLocalUser(null);
        try {
          await signOut({ redirectUrl: "/" });
        } catch {
          props.navigate("discover");
        }
      }}
      onAvatar={avatarChange}
      onSavePseudo={(value) => savePublicPseudo(user, value)}
      getToken={getToken}
    />
  );
}

function LocalProfile(props) {
  const [profile, setProfile] = useState(readProfile);
  function avatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const user = { ...(profile.user || {}), name: profile.name, avatar: String(reader.result) };
      setLocalUser(user);
      setProfile(readProfile());
    };
    reader.readAsDataURL(file);
  }
  function signOut() {
    setLocalUser(null);
    props.navigate("discover");
  }
  return <ProfileBody {...props} signedIn={Boolean(profile.user)} name={readPublicPseudo()} avatar={profile.avatar} since="Testeur" onSignOut={signOut} onAvatar={avatarChange} onSavePseudo={(value) => savePublicPseudo(null, value)} />;
}

export function ProfileScreen(props) {
  return clerkKey ? <ClerkProfile {...props} /> : <LocalProfile {...props} />;
}

function LoginShell({ pageRef, children }) {
  return (
    <PageShell pageRef={pageRef}>
      <section className="v2-login">
        <img className="v2-login-logo" src="/logo-gemelo.png" alt="Gemelo" />
        {children}
      </section>
    </PageShell>
  );
}

function clerkLinkHref(link) {
  return `${link.getAttribute("href") || ""} ${link.href || ""}`;
}

function clerkLinkText(node) {
  return (node?.textContent || "").replace(/\s+/g, " ").trim();
}

function clerkErrorMessage(error) {
  return error?.errors?.[0]?.longMessage || error?.errors?.[0]?.message || "Cette étape n’a pas abouti.";
}

function clerkLinkTarget(link) {
  if (!link) return null;
  const href = clerkLinkHref(link);
  if (href.includes("go.clerk.com") || /oauth|accounts\.google|clerk\.shared|verify|factor|sso-callback/i.test(href)) return null;
  const text = clerkLinkText(link);
  if (/mot de passe oubli[eé]|^forgot password$/i.test(text)) return "forgot";
  if (/^s['’]inscrire$|^créer un compte$|^sign up$/i.test(text)) return "sign-up";
  if (/^se connecter$|^sign in$/i.test(text)) return "sign-in";
  return null;
}

function clerkIdentifierValue(root) {
  return root?.querySelector("input[name='identifier'], input[name='emailAddress'], input[type='email']")?.value?.trim() || "";
}

function clerkSignInResource(signIn) {
  return signIn || (typeof window !== "undefined" ? window.Clerk?.client?.signIn : null);
}

function ForgotPasswordCard({ initialEmail, onBack }) {
  const { signIn, setActive } = useSignIn();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(initialEmail || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode(event) {
    event.preventDefault();
    const resource = clerkSignInResource(signIn);
    if (!resource) {
      setError("Connexion indisponible. Réessayez dans un instant.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await resource.create({ strategy: "reset_password_email_code", identifier: email.trim() });
      setStep("code");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    const resource = clerkSignInResource(signIn);
    if (!resource) {
      setError("Connexion indisponible. Réessayez dans un instant.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await resource.attemptFirstFactor({ strategy: "reset_password_email_code", code: code.trim() });
      const done = await resource.resetPassword({ password });
      if (done.status === "complete" && done.createdSessionId) {
        await setActive({ session: done.createdSessionId });
        return;
      }
      onBack();
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="v2-login-reset">
      <h1>Mot de passe <span className="v2-accent">oublié</span></h1>
      <p className="v2-muted">{step === "email" ? "Indiquez l’e-mail du compte. Nous envoyons un code." : `Un code a été envoyé à ${email}.`}</p>
      {step === "email" ? (
        <form className="v2-stack" onSubmit={sendCode}>
          <Field label="Adresse e-mail">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </Field>
          {error ? <p className="v2-error" role="alert">{error}</p> : null}
          <Button type="submit" disabled={busy}>{busy ? "Envoi…" : "Envoyer le code"}</Button>
          <button type="button" className="v2-text-button" onClick={onBack}>Retour à la connexion</button>
        </form>
      ) : (
        <form className="v2-stack" onSubmit={savePassword}>
          <Field label="Code reçu">
            <input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} required />
          </Field>
          <Field label="Nouveau mot de passe">
            <input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
          </Field>
          {error ? <p className="v2-error" role="alert">{error}</p> : null}
          <Button type="submit" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer le mot de passe"}</Button>
          <button type="button" className="v2-text-button" onClick={() => { setStep("email"); setError(""); }}>Renvoyer un code</button>
          <button type="button" className="v2-text-button" onClick={onBack}>Retour à la connexion</button>
        </form>
      )}
    </Card>
  );
}

function PseudoCard({ user, onDone }) {
  const [pseudo, setPseudo] = useState(readPublicPseudo(user));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await savePublicPseudo(user, pseudo);
      onDone();
    } catch (err) {
      setError(err.message || "Impossible d’enregistrer le pseudo.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="v2-login-reset">
      <h1>Choisissez <span className="v2-accent">votre pseudo</span></h1>
      <p className="v2-muted">C’est le nom visible sur vos avis et le classement. Vous pourrez le modifier plus tard dans Profil.</p>
      <form className="v2-stack" onSubmit={save}>
        <Field label="Votre pseudo">
          <input value={pseudo} onChange={(event) => setPseudo(event.target.value)} required minLength={2} maxLength={24} autoComplete="nickname" />
        </Field>
        {error ? <p className="v2-error" role="alert">{error}</p> : null}
        <Button type="submit" disabled={busy}>{busy ? "Enregistrement…" : "Continuer"}</Button>
      </form>
    </Card>
  );
}

function requestWelcome(getToken, user) {
  const email = user?.primaryEmailAddress?.emailAddress || "";
  if (!getToken || !email) return;
  getToken()
    .then((token) => {
      if (!token) return;
      return fetch("/api/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, name: readPublicPseudo(user) || "" }),
      });
    })
    .catch(() => {});
}

function ClerkLogin({ navigate, pageRef, from, campaignId }) {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [mode, setMode] = useState(() => (/^#\/verify/i.test(window.location.hash) ? "sign-up" : "sign-in"));
  const [forgotEmail, setForgotEmail] = useState("");
  const [needPseudo, setNeedPseudo] = useState(false);
  const boxRef = useRef(null);
  useEffect(() => {
    function onClick(event) {
      const link = event.target.closest?.("a");
      if (!link?.closest(".cl-footer")) return;
      const target = clerkLinkTarget(link);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      setMode(target === "forgot" ? "forgot" : target);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  useEffect(() => {
    if (!isSignedIn) {
      setNeedPseudo(false);
      return;
    }
    if (!readPublicPseudo(user)) {
      setNeedPseudo(true);
      return;
    }
    requestWelcome(getToken, user);
    if (from === "report-check") navigate("report-check", { campaignId }, true);
    else if (from === "report-form") navigate("report-check", { campaignId }, true);
    else if (from === "review-published") navigate("review-published", { campaignId }, true);
    else if (from === "payment") navigate("payment", {}, true);
    else if (from === "messages") navigate("messages", {}, true);
    else navigate("profile", {}, true);
  }, [campaignId, from, getToken, isSignedIn, navigate, user]);
  function afterPseudo() {
    requestWelcome(getToken, user);
    setNeedPseudo(false);
    if (from === "report-check") navigate("report-check", { campaignId }, true);
    else if (from === "report-form") navigate("report-check", { campaignId }, true);
    else if (from === "review-published") navigate("review-published", { campaignId }, true);
    else if (from === "payment") navigate("payment", {}, true);
    else if (from === "messages") navigate("messages", {}, true);
    else navigate("profile", {}, true);
  }
  return (
    <LoginShell pageRef={pageRef}>
      <div className="v2-login-clerk" ref={boxRef}>
        {needPseudo ? (
          <PseudoCard user={user} onDone={afterPseudo} />
        ) : mode === "forgot" ? (
          <ForgotPasswordCard initialEmail={forgotEmail} onBack={() => setMode("sign-in")} />
        ) : mode === "sign-up" ? (
          <SignUp routing="virtual" appearance={clerkAppearance} />
        ) : (
          <>
            <SignIn routing="virtual" appearance={clerkAppearance} />
            <button
              type="button"
              className="v2-login-forgot"
              onClick={() => {
                setForgotEmail(clerkIdentifierValue(boxRef.current));
                setMode("forgot");
              }}
            >
              Mot de passe oublié ?
            </button>
          </>
        )}
      </div>
    </LoginShell>
  );
}

export function LoginScreen({ navigate, pageRef, from, campaignId }) {
  if (!clerkKey) {
    return (
      <LoginShell pageRef={pageRef}>
        <p className="v2-login-missing">La clé Clerk n’est pas encore enregistrée sur Gemelo.</p>
      </LoginShell>
    );
  }
  return <ClerkLogin navigate={navigate} pageRef={pageRef} from={from} campaignId={campaignId} />;
}

export function PlaceholderScreen({ title, back, pageRef }) {
  return <PageShell pageRef={pageRef}><main className="v2-stack"><BackButton onClick={back} /><Header /><Card><h1>{title}</h1><p className="v2-description">Ce flux sera reconstruit dans le prochain lot. Aucun paiement ni envoi serveur n’a lieu.</p></Card></main></PageShell>;
}

