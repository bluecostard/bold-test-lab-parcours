const CYCLE_MS = 24 * 60 * 60 * 1000;

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

const CYCLE_ORIGIN_MS = wallTimeToUtcMs("2026-09-01T00:00:00", "Europe/Paris");

function rangeStartHour(offerRange, offerLabel) {
  if (offerLabel === "24 heures" || offerRange === "24 heures") return 0;
  const match = String(offerRange || "").match(/(\d{1,2})\s*h/i);
  if (!match) return 0;
  const hour = Number(match[1]);
  return hour === 24 ? 0 : hour;
}

export function slotHours(campaign) {
  const price = Number(campaign?.offerPrice);
  const label = String(campaign?.offerLabel || "");
  const range = String(campaign?.offerRange || "");
  if (label === "24 heures" || price === 149 || range.includes("24")) return 24;
  if (price === 19 || price === 39 || price === 55 || price === 65) return 6;
  if (price === 49 || price === 109) return 12;
  if (/00 h – 6|6 h – 12|12 h – 18|18 h – 00/.test(range)) return 6;
  return 12;
}

export function slotStartMs(campaign) {
  if (!campaign?.offerDate) return null;
  const hour = rangeStartHour(campaign.offerRange, campaign.offerLabel);
  const start = new Date(`${campaign.offerDate}T${String(hour).padStart(2, "0")}:00:00`);
  return Number.isNaN(start.getTime()) ? null : start.getTime();
}

export function campaignEndMs(campaign, now = Date.now()) {
  const start = slotStartMs(campaign);
  if (start != null) return start + slotHours(campaign) * 60 * 60 * 1000;
  const elapsed = now - CYCLE_ORIGIN_MS;
  const intoCycle = ((elapsed % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
  return now + (CYCLE_MS - intoCycle);
}

export function campaignRemainingMs(campaign, now = Date.now()) {
  return Math.max(0, campaignEndMs(campaign, now) - now);
}

export function endsLabel(campaign, now = Date.now()) {
  const end = new Date(campaignEndMs(campaign, now));
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(end);
}

export function parisParts(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }).formatToParts(now).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: parts.weekday,
  };
}

export function parisWeekKey(now = new Date()) {
  const { year, month, day } = parisParts(now);
  const utc = Date.UTC(year, month - 1, day);
  const date = new Date(utc);
  const thursday = new Date(utc);
  thursday.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function isParisMonday(now = new Date()) {
  return parisParts(now).weekday === "Mon";
}
