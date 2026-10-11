import { listCampaigns, readCampaign } from "./campaignStore.js";
import { campaignEndMs, campaignRemainingMs, endsLabel, isParisMonday, parisWeekKey } from "./campaignTime.js";
import { campaignEmail, closingEmail, rankingEmail } from "./emails.js";
import { sendMail } from "./mail.js";
import { listRecipients, readMailPrefs, writeMailState, writePendingCampaign } from "./mailPrefs.js";
import { buildRanking } from "./ranking.js";

const HOUR = 60 * 60 * 1000;
const MAX_SENDS = 24;

const bedHop = {
  id: "bed-hop",
  name: "Bed Hop",
  tags: ["Application", "Repos", "Entreprise"],
};

function tagLine(campaign) {
  return Array.isArray(campaign?.tags) && campaign.tags.length ? campaign.tags.slice(0, 3).join(" · ") : "Campagne en cours";
}

async function deliver(to, mail) {
  await sendMail({ to, subject: mail.subject, text: mail.text, html: mail.html });
}

async function liveCampaigns() {
  const listed = (await listCampaigns()).filter((item) => item.live !== false && item.name);
  if (!listed.some((item) => item.id === "bed-hop")) listed.push(bedHop);
  return listed;
}

export async function queueCampaignNotice(campaignId) {
  if (!campaignId) return;
  await writePendingCampaign(campaignId);
}

async function sendCampaignNotices(prefs, budget) {
  const pending = (prefs.pendingCampaigns || []).filter((id) => !prefs.campaignSent?.[id]);
  let sent = 0;
  const done = { ...(prefs.campaignSent || {}) };
  const recipientsSent = { ...(prefs.campaignRecipients || {}) };
  const left = [];
  for (const id of pending) {
    if (sent >= budget) {
      left.push(id);
      continue;
    }
    const campaign = id === "bed-hop" ? bedHop : await readCampaign(id);
    if (!campaign?.name) continue;
    const already = recipientsSent[id] || {};
    const recipients = listRecipients(prefs, "campaigns").filter((entry) => entry.userId !== campaign.ownerId && !already[entry.userId]);
    let incomplete = false;
    for (const entry of recipients) {
      if (sent >= budget) {
        incomplete = true;
        break;
      }
      try {
        await deliver(entry.email, campaignEmail({
          name: entry.name,
          campaignName: campaign.name,
          tags: tagLine(campaign),
          endsLabel: endsLabel(campaign),
          token: entry.token,
        }));
        already[entry.userId] = new Date().toISOString();
        sent += 1;
      } catch (error) {
        console.log("mail-campaign", String(error?.message || error).slice(0, 180));
        incomplete = true;
        break;
      }
    }
    recipientsSent[id] = already;
    if (incomplete) left.push(id);
    else done[id] = new Date().toISOString();
  }
  return { sent, campaignSent: done, campaignRecipients: recipientsSent, pendingCampaigns: [...new Set(left)] };
}

async function sendRanking(prefs, budget) {
  const week = parisWeekKey();
  if (!isParisMonday() || prefs.rankingSent === week || budget <= 0) {
    return { sent: 0, rankingSent: prefs.rankingSent, rankingRecipients: prefs.rankingRecipients || {} };
  }
  const { ranking } = await buildRanking("");
  const already = { ...((prefs.rankingRecipients || {})[week] || {}) };
  const recipients = listRecipients(prefs, "ranking").filter((entry) => !already[entry.userId]);
  let sent = 0;
  let failed = false;
  for (const entry of recipients) {
    if (sent >= budget) {
      failed = true;
      break;
    }
    const rows = ranking.map((row) => ({ ...row, you: Boolean(row.authorId && row.authorId === entry.userId) }));
    try {
      await deliver(entry.email, rankingEmail({ name: entry.name, rows, token: entry.token }));
      already[entry.userId] = new Date().toISOString();
      sent += 1;
    } catch (error) {
      console.log("mail-ranking", String(error?.message || error).slice(0, 180));
      failed = true;
      break;
    }
  }
  return {
    sent,
    rankingSent: failed ? prefs.rankingSent : week,
    rankingRecipients: { ...(prefs.rankingRecipients || {}), [week]: already },
  };
}

async function sendClosing(prefs, budget) {
  const now = Date.now();
  const campaigns = await liveCampaigns();
  const closing = campaigns.find((campaign) => {
    const left = campaignRemainingMs(campaign, now);
    return left > 3 * HOUR && left <= 5 * HOUR && !prefs.closingSent?.[`${campaign.id}-${campaignEndMs(campaign, now)}`];
  });
  if (!closing || budget <= 0) return { sent: 0, closingSent: prefs.closingSent || {}, closingRecipients: prefs.closingRecipients || {} };
  const key = `${closing.id}-${campaignEndMs(closing, now)}`;
  const already = { ...((prefs.closingRecipients || {})[key] || {}) };
  const { ranking } = await buildRanking("");
  const recipients = listRecipients(prefs, "closing").filter((entry) => entry.userId !== closing.ownerId && !already[entry.userId]);
  const hours = Math.max(1, Math.round(campaignRemainingMs(closing, now) / HOUR));
  let sent = 0;
  let failed = false;
  for (const entry of recipients) {
    if (sent >= budget) {
      failed = true;
      break;
    }
    const mine = ranking.find((row) => row.authorId && row.authorId === entry.userId);
    try {
      await deliver(entry.email, closingEmail({
        name: entry.name,
        campaignName: closing.name,
        hours,
        rank: mine?.place || 0,
        points: mine?.points || 0,
        endsLabel: endsLabel(closing, now),
        token: entry.token,
      }));
      already[entry.userId] = new Date().toISOString();
      sent += 1;
    } catch (error) {
      console.log("mail-closing", String(error?.message || error).slice(0, 180));
      failed = true;
      break;
    }
  }
  const closingSent = { ...(prefs.closingSent || {}) };
  if (!failed) closingSent[key] = new Date().toISOString();
  return {
    sent,
    closingSent,
    closingRecipients: { ...(prefs.closingRecipients || {}), [key]: already },
  };
}

export async function runMailJobs() {
  const prefs = await readMailPrefs();
  const campaign = await sendCampaignNotices(prefs, MAX_SENDS);
  const ranking = await sendRanking(prefs, MAX_SENDS - campaign.sent);
  const closing = await sendClosing(prefs, MAX_SENDS - campaign.sent - ranking.sent);
  const dirty = campaign.sent || ranking.sent || closing.sent
    || (prefs.pendingCampaigns || []).join() !== campaign.pendingCampaigns.join()
    || ranking.rankingSent !== prefs.rankingSent
    || Object.keys(closing.closingSent || {}).length !== Object.keys(prefs.closingSent || {}).length;
  if (dirty) {
    await writeMailState({
      campaignSent: campaign.campaignSent,
      campaignRecipients: campaign.campaignRecipients,
      pendingCampaigns: campaign.pendingCampaigns,
      rankingSent: ranking.rankingSent,
      rankingRecipients: ranking.rankingRecipients,
      closingSent: closing.closingSent,
      closingRecipients: closing.closingRecipients,
    });
  }
  return { campaign: campaign.sent, ranking: ranking.sent, closing: closing.sent };
}
