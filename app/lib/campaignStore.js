import { get, list, put } from "@vercel/blob";

const access = "private";

function campaignPath(id) {
  return `campaigns/${id}.json`;
}

async function readJson(pathname) {
  const result = await get(pathname, { access, useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const text = await new Response(result.stream).text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function readCampaign(id) {
  if (!id) return null;
  return readJson(campaignPath(id));
}

export async function listCampaigns() {
  const listed = await list({ prefix: "campaigns/", limit: 100 });
  const campaigns = [];
  for (const blob of listed.blobs) {
    const campaign = await readJson(blob.pathname);
    if (campaign?.id) campaigns.push(campaign);
  }
  campaigns.sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));
  return campaigns;
}

export async function saveCampaign(campaign) {
  await put(campaignPath(campaign.id), JSON.stringify(campaign), {
    access,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return campaign;
}
