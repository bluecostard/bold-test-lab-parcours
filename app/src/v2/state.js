import { readAccount, setAccountScope, writeAccount } from "../screens/account.js";

const V2_BASE = "gemelo-v2-state";
let v2Scope = "guest";

export function setV2Scope(id) {
  v2Scope = id || "guest";
}

function v2Key() {
  return v2Scope === "guest" ? V2_BASE : `${V2_BASE}:${v2Scope}`;
}

export function setStorageScope(userId) {
  const scope = userId || "guest";
  setAccountScope(scope);
  setV2Scope(scope);
}

const defaults = {
  reviewDrafts: {},
  publishedReviews: {},
  likedReviewIds: [],
  commentLikes: {},
  projectLikes: {},
  optionalAnswers: {},
  reportDrafts: {},
  sentQuestions: {},
  messageThreads: {},
  blockedAuthors: [],
};

export function readV2State() {
  try {
    const saved = JSON.parse(localStorage.getItem(v2Key()) || "{}");
    return { ...defaults, ...(saved && typeof saved === "object" ? saved : {}) };
  } catch {
    return { ...defaults };
  }
}

export function writeV2State(next) {
  localStorage.setItem(v2Key(), JSON.stringify(next));
}

export function clearGemeloStorage() {
  const keys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith("gemelo")) keys.push(key);
  }
  keys.forEach((key) => localStorage.removeItem(key));
  setStorageScope("guest");
}

export function readBlockedAuthors() {
  const list = readV2State().blockedAuthors;
  return Array.isArray(list) ? list.filter((item) => item?.id) : [];
}

export function isAuthorBlocked(authorId) {
  if (!authorId) return false;
  return readBlockedAuthors().some((item) => item.id === authorId);
}

export function blockAuthor({ id, name }) {
  if (!id) return readV2State();
  return updateV2State((current) => {
    const list = Array.isArray(current.blockedAuthors) ? current.blockedAuthors : [];
    if (list.some((item) => item.id === id)) return current;
    return { ...current, blockedAuthors: [...list, { id, name: name || "Membre" }] };
  });
}

export function unblockAuthor(id) {
  return updateV2State((current) => ({
    ...current,
    blockedAuthors: (Array.isArray(current.blockedAuthors) ? current.blockedAuthors : []).filter((item) => item.id !== id),
  }));
}

export function visibleReviews(reviews) {
  const blocked = new Set(readBlockedAuthors().map((item) => item.id));
  if (!blocked.size) return reviews;
  return reviews.filter((review) => !review.authorId || !blocked.has(review.authorId));
}

export function updateV2State(change) {
  const current = readV2State();
  const next = typeof change === "function" ? change(current) : { ...current, ...change };
  writeV2State(next);
  return next;
}

export function readProfile() {
  const account = readAccount();
  return {
    account,
    user: account.user || null,
    name: account.user?.name || account.user?.firstName || "",
    avatar: account.user?.avatar || "",
    projectName: account.projectName || "",
    projectPitch: account.projectPitch || "",
    projectLogo: account.projectLogo || "",
  };
}

export function updateLocalProfile(change) {
  const account = readAccount();
  writeAccount({ ...account, ...change });
}

export function setLocalUser(user) {
  const account = readAccount();
  writeAccount({ ...account, user });
}

export function readPublicPseudo(clerkUser) {
  const meta = clerkUser?.unsafeMetadata?.gemeloPseudo;
  if (typeof meta === "string" && meta.trim()) return meta.trim().slice(0, 24);
  const local = readProfile().user;
  if (local?.gemelo && local.name) return String(local.name).trim().slice(0, 24);
  return "";
}

/** Photo de profil durable : métadonnée Gemelo → Clerk → stockage local. */
export function readAvatar(clerkUser) {
  const meta = clerkUser?.unsafeMetadata?.gemeloAvatar;
  if (typeof meta === "string" && /^https?:\/\//i.test(meta.trim())) return meta.trim();
  if (typeof clerkUser?.imageUrl === "string" && clerkUser.imageUrl.trim()) return clerkUser.imageUrl.trim();
  const local = readProfile().avatar;
  if (typeof local === "string" && local.trim() && !local.startsWith("blob:")) return local.trim();
  return "";
}

export async function saveAvatar(clerkUser, url) {
  const avatar = String(url || "").trim();
  if (!avatar || !/^https?:\/\//i.test(avatar)) throw new Error("URL de photo invalide.");
  setLocalUser({ ...(readProfile().user || {}), id: clerkUser?.id || readProfile().user?.id, avatar });
  if (clerkUser?.update) {
    await clerkUser.update({
      unsafeMetadata: { ...(clerkUser.unsafeMetadata || {}), gemeloAvatar: avatar },
    });
  }
  return avatar;
}

export async function savePublicPseudo(clerkUser, value) {
  const name = String(value || "").trim().slice(0, 24);
  if (name.length < 2) throw new Error("Le pseudo doit faire au moins 2 caractères.");
  setLocalUser({ ...(readProfile().user || {}), name, gemelo: true });
  if (clerkUser?.update) {
    await clerkUser.update({
      firstName: name,
      unsafeMetadata: { ...(clerkUser.unsafeMetadata || {}), gemeloPseudo: name },
    });
  }
  return name;
}

export function hasPaidCampaign() {
  const account = readAccount();
  return Boolean(account.campaignPaid && account.offerDate && account.offerLabel);
}
