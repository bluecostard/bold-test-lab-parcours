export const OFFERS = [
  { label: "Nuit courte", range: "00 h – 6 h", price: 19, applePrice: 19.99, appleProductId: "online.gemelo.slot.19" },
  { label: "Matinée", range: "6 h – 12 h", price: 39, applePrice: 39.99, appleProductId: "online.gemelo.slot.39" },
  { label: "Après-midi", range: "12 h – 18 h", price: 55, applePrice: 59.99, appleProductId: "online.gemelo.slot.55" },
  { label: "Soirée", range: "18 h – 00 h", price: 65, applePrice: 69.99, appleProductId: "online.gemelo.slot.65" },
  { label: "Demi-journée (matin)", range: "00 h – 12 h", price: 49, applePrice: 49.99, appleProductId: "online.gemelo.slot.49" },
  { label: "Demi-journée (après-midi)", range: "12 h – 00 h", price: 109, applePrice: 109.99, appleProductId: "online.gemelo.slot.109" },
  { label: "24 heures", range: "24 h", price: 149, applePrice: 149.99, appleProductId: "online.gemelo.slot.149" },
];

function formatAmount(amount) {
  return Number.isInteger(amount) ? String(amount) : String(amount).replace(".", ",");
}

export function formatOfferPrice(offer, nativeIos) {
  return `${formatAmount(nativeIos ? offer.applePrice : offer.price)} €`;
}

export function formatStoredOfferPrice(price, nativeIos) {
  const offer = OFFERS.find((item) => item.price === Number(price));
  if (!offer) return `${price} €`;
  return formatOfferPrice(offer, nativeIos);
}

export function matchOffer(label, range, price) {
  const amount = Number(price);
  return OFFERS.find((offer) => offer.label === label && offer.range === range && offer.price === amount) || null;
}

export function offerByAppleProduct(productId) {
  return OFFERS.find((offer) => offer.appleProductId === productId) || null;
}
