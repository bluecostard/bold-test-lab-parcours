import { saveBooking } from "./bookingStore.js";
import { saveCampaign } from "./campaignStore.js";

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
  return saveBooking({
    ...booking,
    paid: true,
    campaignId: campaign.id,
    paidAt: campaign.paidAt,
    sessionId: campaign.stripeSessionId,
  });
}
