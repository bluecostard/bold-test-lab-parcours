const KEY = "gemelo-account-v1";

const empty = {
  user: null,
  reviewText: "",
  reviewPhoto: "",
  reviewVideoName: "",
  projectName: "",
  projectPitch: "",
  projectLink: "",
  projectSteps: "",
  category: "",
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

export function readAccount() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    const account = saved && typeof saved === "object" ? { ...empty, ...saved } : { ...empty };
    return {
      ...account,
      projectScreens: Array.isArray(account.projectScreens) ? account.projectScreens : [],
      projectSocials: Array.isArray(account.projectSocials) ? account.projectSocials : [],
      projectInstructions: Array.isArray(account.projectInstructions) ? account.projectInstructions : [],
    };
  } catch {
    return { ...empty, projectScreens: [], projectSocials: [], projectInstructions: [] };
  }
}

export function writeAccount(account) {
  const stored = { ...account };
  localStorage.setItem(KEY, JSON.stringify(stored));
}
