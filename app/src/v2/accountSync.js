import { readAccount, writeAccount } from "../screens/account.js";

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * Restaure le projet / créneau local depuis la campagne payée serveur
 * (après réinstall ou nouvel appareil).
 */
export async function syncAccountFromServer(getToken) {
  if (!getToken) return { synced: false, reason: "no-token" };
  const token = await getToken();
  if (!token) return { synced: false, reason: "no-token" };

  const response = await fetch("/api/account", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await readJson(response);
  if (response.status === 401) return { synced: false, reason: "auth" };
  if (!response.ok) return { synced: false, reason: "error" };
  if (!data.paid) return { synced: false, reason: "unpaid" };

  const booking = data.booking || {};
  const campaign = data.campaign || {};
  const current = readAccount();

  const next = {
    ...current,
    campaignPaid: true,
    campaignId: booking.campaignId || campaign.id || current.campaignId || "",
    offerLabel: booking.offerLabel || current.offerLabel || "",
    offerRange: booking.offerRange || current.offerRange || "",
    offerPrice: booking.offerPrice ?? current.offerPrice,
    offerDate: booking.offerDate || current.offerDate || "",
  };

  if (campaign.name) {
    next.projectName = campaign.name;
    next.projectPitch = campaign.pitch || campaign.description || "";
    next.projectLink = campaign.website || "";
    next.projectAppStore = campaign.appStore || "";
    next.projectPlayStore = campaign.playStore || "";
    next.projectLogo = campaign.logo || "";
    next.projectScreens = Array.isArray(campaign.screenshots) ? campaign.screenshots : [];
    next.projectFounderPitch = campaign.founderPitch?.src
      ? {
          src: campaign.founderPitch.src,
          poster: campaign.founderPitch.poster || campaign.logo || "",
          duration: campaign.founderPitch.duration || "1:00",
          name: campaign.founderPitch.name || "",
        }
      : null;
    next.tags = Array.isArray(campaign.tags) ? campaign.tags : [];
    next.category = next.tags[0] || "";
    next.projectSocials = Array.isArray(campaign.socials)
      ? campaign.socials
        .filter((item) => item?.platform && item?.url)
        .map((item) => ({ platform: item.platform, url: item.url }))
      : [];
    next.projectInstructions = Array.isArray(campaign.instructions)
      ? campaign.instructions.map((item) => ({
          title: String(item?.title || "").trim(),
          text: String(item?.text || item?.detail || "").trim(),
        })).filter((item) => item.title || item.text)
      : [];
    next.projectSteps = next.projectInstructions.map((item) => item.text || item.title).filter(Boolean).join("\n\n");
  }

  writeAccount(next);
  return { synced: true, campaignId: next.campaignId, projectName: next.projectName };
}
