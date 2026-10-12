const BASE_KEY = "gemelo-account-v1";
let accountScope = "guest";

export function setAccountScope(id) {
  accountScope = id || "guest";
}

function accountKey() {
  return accountScope === "guest" ? BASE_KEY : `${BASE_KEY}:${accountScope}`;
}

const empty = {
  user: null,
  reviewText: "",
  reviewPhoto: "",
  reviewVideoName: "",
  projectName: "",
  projectPitch: "",
  projectLink: "",
  projectAppStore: "",
  projectPlayStore: "",
  projectSteps: "",
  category: "",
  tags: [],
  projectLogo: "",
  projectScreens: [],
  projectSocials: [],
  projectInstructions: [],
  offerHours: 24,
  offerLabel: "24 heures",
  offerRange: "24 h",
  offerPrice: 149,
  offerDate: "",
  campaignPaid: false,
};

function normalizeTags(account) {
  const fromTags = Array.isArray(account.tags)
    ? account.tags.map((tag) => (typeof tag === "string" ? tag.trim() : "")).filter(Boolean)
    : [];
  if (fromTags.length) return fromTags.slice(0, 6);
  return account.category ? [account.category] : [];
}

export function readAccount() {
  try {
    const saved = JSON.parse(localStorage.getItem(accountKey()) || "null");
    const account = saved && typeof saved === "object" ? { ...empty, ...saved } : { ...empty };
    const tags = normalizeTags(account);
    return {
      ...account,
      tags,
      category: account.category || tags[0] || "",
      projectAppStore: typeof account.projectAppStore === "string" ? account.projectAppStore : "",
      projectPlayStore: typeof account.projectPlayStore === "string" ? account.projectPlayStore : "",
      projectScreens: Array.isArray(account.projectScreens) ? account.projectScreens : [],
      projectSocials: Array.isArray(account.projectSocials) ? account.projectSocials : [],
      projectInstructions: Array.isArray(account.projectInstructions) ? account.projectInstructions : [],
    };
  } catch {
    return { ...empty, tags: [], projectScreens: [], projectSocials: [], projectInstructions: [] };
  }
}

export function writeAccount(account) {
  const stored = { ...account };
  localStorage.setItem(accountKey(), JSON.stringify(stored));
}
