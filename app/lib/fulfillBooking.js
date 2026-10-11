import { saveBooking } from "./bookingStore.js";
import { saveCampaign } from "./campaignStore.js";
import { queueCampaignNotice } from "./mailJobs.js";

export async function fulfillBooking(booking, session) {
  if (!booking?.userId) return null;
  if (booking.paid && booking.campaignId) return booking;
  const campaign = {
    ...(booking.campaign || {}),
    id: `camp-${booking.userId}`.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80),
    ownerId: booking.userId,
    live: true,
    offerLabel: booking.offerLabel,
    offerRange: booking.offerRange,
    offerPrice: booking.offerPrice,
    offerDate: booking.offerDate,
    publishedAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
    stripeSessionId: session?.id || booking.sessionId || "",
  };
  await saveCampaign(campaign);
  const paid = await saveBooking({
    ...booking,
    paid: true,
    campaignId: campaign.id,
    paidAt: campaign.paidAt,
    sessionId: campaign.stripeSessionId,
  });
  try {
    await queueCampaignNotice(campaign.id);
  } catch (error) {
    console.log("mail-campaign-queue", String(error?.message || error).slice(0, 180));
  }
  return paid;
}
