export function slotTaken(date, offerLabel, campaigns, ignoreId = "") {
  if (!date) return false;
  return campaigns.some((item) => (
    item
    && item.live !== false
    && item.id !== ignoreId
    && item.offerDate === date
    && (!item.offerLabel || !offerLabel || item.offerLabel === offerLabel)
  ));
}

export function slotAvailable(date, offerLabel, campaigns, ignoreId = "", today = "") {
  if (!date) return false;
  if (today && date < today) return false;
  return !slotTaken(date, offerLabel, campaigns, ignoreId);
}
