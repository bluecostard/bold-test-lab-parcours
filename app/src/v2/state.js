import { readAccount, writeAccount } from "../screens/account.js";

const V2_KEY = "gemelo-v2-state";

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
};

export function readV2State() {
  try {
    const saved = JSON.parse(localStorage.getItem(V2_KEY) || "{}");
    return { ...defaults, ...(saved && typeof saved === "object" ? saved : {}) };
  } catch {
    return { ...defaults };
  }
}

export function writeV2State(next) {
  localStorage.setItem(V2_KEY, JSON.stringify(next));
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
    name: account.user?.name || account.user?.firstName || "Alexandre",
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

export function hasPaidCampaign() {
  const account = readAccount();
  return Boolean(account.campaignPaid && account.offerDate && account.offerLabel);
}
