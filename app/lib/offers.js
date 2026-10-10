export const OFFERS = [
  { label: "Nuit courte", range: "00 h – 6 h", price: 19 },
  { label: "Matinée", range: "6 h – 12 h", price: 39 },
  { label: "Après-midi", range: "12 h – 18 h", price: 55 },
  { label: "Soirée", range: "18 h – 00 h", price: 65 },
  { label: "Demi-journée (matin)", range: "00 h – 12 h", price: 49 },
  { label: "Demi-journée (après-midi)", range: "12 h – 00 h", price: 109 },
  { label: "24 heures", range: "24 h", price: 149 },
];

export function matchOffer(label, range, price) {
  const amount = Number(price);
  return OFFERS.find((offer) => offer.label === label && offer.range === range && offer.price === amount) || null;
}
