import { readAccount, writeAccount } from "../screens/account.js";

const MANAGE_MS = 72 * 60 * 60 * 1000;
const CAMPAIGN_CYCLE_MS = 24 * 60 * 60 * 1000;

function wallTimeToUtcMs(isoLocal, timeZone) {
  const utcGuess = Date.parse(`${isoLocal}Z`);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcGuess));
  const value = (type) => Number(parts.find((part) => part.type === type)?.value);
  const asIfUtc = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
  return utcGuess - (asIfUtc - utcGuess);
}

export const CAMPAIGN_CYCLE_ORIGIN_MS = wallTimeToUtcMs("2026-09-01T00:00:00", "Europe/Paris");

export function campaignRemainingMs(now = Date.now()) {
  const elapsed = now - CAMPAIGN_CYCLE_ORIGIN_MS;
  const intoCycle = ((elapsed % CAMPAIGN_CYCLE_MS) + CAMPAIGN_CYCLE_MS) % CAMPAIGN_CYCLE_MS;
  return CAMPAIGN_CYCLE_MS - intoCycle;
}

export function campaignRemainingMsFor(campaign, now = Date.now()) {
  if (campaign?.offerDate) {
    const start = slotStart(campaign.offerDate, campaign.offerRange, campaign.offerLabel);
    if (start) {
      const end = start.getTime() + slotDurationHours(campaign) * 60 * 60 * 1000;
      return Math.max(0, end - now);
    }
  }
  return campaignRemainingMs(now);
}

export function campaignTimerParts(remainingMs) {
  if (remainingMs <= 0) return { ended: true, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(remainingMs / 1000);
  return {
    ended: false,
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function campaignPeriodLabel(campaign) {
  const label = String(campaign?.offerLabel || "").trim();
  return label || "24 heures";
}

export function campaignSlotMs(campaign) {
  if (campaign?.offerDate) return slotDurationHours(campaign) * 60 * 60 * 1000;
  return CAMPAIGN_CYCLE_MS;
}

export function campaignTimerProgress(campaign, now = Date.now()) {
  const total = campaignSlotMs(campaign);
  if (!total) return 0;
  return Math.min(1, Math.max(0, campaignRemainingMsFor(campaign, now) / total));
}

export function campaignDeadlineLabel(now = Date.now(), campaign) {
  const remaining = campaign ? campaignRemainingMsFor(campaign, now) : campaignRemainingMs(now);
  const parts = campaignTimerParts(remaining);
  if (parts.ended) return "Campagne terminée";
  const two = (value) => String(value).padStart(2, "0");
  return `Se termine dans ${parts.hours} h ${two(parts.minutes)} min ${two(parts.seconds)} s`;
}

export function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Date calendrier YYYY-MM-DD uniquement (évite RangeError / crash input date). */
export function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const parsed = new Date(`${value}T12:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function addDays(value, days) {
  if (!isIsoDate(value)) return "";
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formattedDate(value) {
  if (!isIsoDate(value)) return "Jour à choisir";
  const raw = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function demoOfferDays(start, count = 4) {
  return Array.from({ length: count }, (_, index) => {
    const value = addDays(start, index);
    return { value, label: formattedDate(value), available: true };
  });
}

function rangeStartHour(offerRange, offerLabel) {
  if (offerLabel === "24 heures" || offerRange === "24 heures") return 0;
  const match = String(offerRange || "").match(/(\d{1,2})\s*h/i);
  if (!match) return 0;
  const hour = Number(match[1]);
  return hour === 24 ? 0 : hour;
}

export function slotStart(offerDate, offerRange, offerLabel) {
  if (!isIsoDate(offerDate)) return null;
  const hour = rangeStartHour(offerRange, offerLabel);
  const start = new Date(`${offerDate}T${String(hour).padStart(2, "0")}:00:00`);
  return Number.isNaN(start.getTime()) ? null : start;
}

export function slotDurationHours(account) {
  if (account?.offerLabel === "24 heures" || Number(account?.offerPrice) === 149) return 24;
  if (String(account?.offerRange || "").includes("24")) return 24;
  return 12;
}

export function slotEnded(account, now = Date.now()) {
  const start = slotStart(account?.offerDate, account?.offerRange, account?.offerLabel);
  if (!start) return false;
  return now >= start.getTime() + slotDurationHours(account) * 60 * 60 * 1000;
}

export function canManageBooking(account, now = new Date()) {
  const start = slotStart(account?.offerDate, account?.offerRange, account?.offerLabel);
  if (!start) return false;
  return now.getTime() < start.getTime() - MANAGE_MS;
}

export function apply(patch, current = readAccount()) {
  const next = { ...current };
  if (patch.offer) {
    next.offerLabel = patch.offer.label;
    next.offerRange = patch.offer.range;
    next.offerPrice = patch.offer.price;
  }
  if (patch.date !== undefined) {
    if (!patch.date) next.offerDate = "";
    else if (isIsoDate(patch.date)) next.offerDate = patch.date;
  }
  const priceDelta = (Number(next.offerPrice) || 0) - (Number(current.offerPrice) || 0);
  writeAccount(next);
  return { account: next, priceDelta };
}
