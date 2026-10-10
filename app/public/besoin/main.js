const offers = [
  { key: 'nuit', title: 'Nuit courte', time: '00 h – 6 h', price: 19 },
  { key: 'matin', title: 'Matinée', time: '6 h – 12 h', price: 39 },
  { key: 'apresmidi', title: 'Après-midi', time: '12 h – 18 h', price: 55 },
  { key: 'soir', title: 'Soirée', time: '18 h – 00 h', price: 65 },
  { key: 'demimatin', title: 'Demi-journée (matin)', time: '00 h – 12 h', price: 49 },
  { key: 'demisoir', title: 'Demi-journée (après-midi)', time: '12 h – 00 h', price: 109 },
  { key: 'jour', title: '24 heures', time: '24 h', price: 149 }
];
const params = new URLSearchParams(location.search);
const source = params.get('utm_source') || '';
const medium = params.get('utm_medium') || '';
const campaign = params.get('utm_campaign') || '';
const session = crypto.randomUUID();
let selected = null;
const $ = selector => document.querySelector(selector);
const track = (name, slot) => {
  // Les événements sont envoyés sur le même domaine, sans cookie ni service tiers.
  fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slot, session, source, medium, campaign }), keepalive: true }).catch(() => {});
};
$('#offerGrid').innerHTML = offers.map(offer => `<button type="button" class="offer" data-slot="${offer.key}" aria-label="Demander ${offer.title}, ${offer.time}, ${offer.price} euros"><span class="offerTitle">${offer.title}</span><span class="offerTime">${offer.time}</span><strong>${offer.price} €</strong><span class="offerAction">Choisir ce créneau →</span></button>`).join('');
track('page_view');
let pricingSeen = false;
const observer = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting) && !pricingSeen) {
    pricingSeen = true;
    track('pricing_view');
    observer.disconnect();
  }
}, { threshold: 0.2 });
observer.observe($('#offers'));
$('#seePricing').addEventListener('click', () => {
  $('#offers').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#offerGrid').addEventListener('click', event => {
  const button = event.target.closest('[data-slot]');
  if (!button) return;
  selected = offers.find(offer => offer.key === button.dataset.slot);
  for (const el of document.querySelectorAll('.offer')) el.classList.toggle('selected', el === button);
  track('offer_select', selected.key);
  $('#pickedOffer').textContent = `${selected.title} · ${selected.time} · ${selected.price} €`;
  $('#request').hidden = false;
  track('form_view', selected.key);
  $('#request').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#leadForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!selected) return;
  const form = event.currentTarget;
  const button = $('#submitLead');
  const message = $('#formMessage');
  const data = Object.fromEntries(new FormData(form));
  button.disabled = true;
  message.textContent = '';
  try {
    const response = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, consent: data.consent === 'on', slot: selected.key, session, source, medium, campaign }) });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'Veuillez réessayer.');
    $('#request').hidden = true;
    $('#thanks').hidden = false;
    $('#thanks').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('#thanks').focus({ preventScroll: true });
  } catch (error) { message.textContent = error.message; }
  finally { button.disabled = false; }
});
