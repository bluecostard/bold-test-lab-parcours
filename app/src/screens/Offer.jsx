import { useEffect, useState } from "react";
import { readAccount, writeAccount } from "./account.js";

const offers = [
  ["Nuit courte", "00 h – 6 h", 19],
  ["Matinée", "6 h – 12 h", 39],
  ["Après-midi", "12 h – 18 h", 55],
  ["Soirée", "18 h – 00 h", 65],
  ["Demi-journée (matin)", "00 h – 12 h", 49],
  ["Demi-journée (après-midi)", "12 h – 00 h", 109],
  ["24 heures", "24 h", 149],
];

const benefits = [
  ["◉", "Visibilité dès l’ouverture", "Votre campagne est mise en avant sur notre page d’accueil."],
  ["▤", "Page projet dédiée", "Une page avec vos liens et instructions pour les testeurs."],
  ["▥", "Suivi des résultats", "Un tableau de bord pour suivre la performance en temps réel."],
  ["▧", "Rapport final", "Un bilan complet à la fin de la campagne."],
];

function formatDate(value) {
  if (!value) return "Choisir une date";
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateShort(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function localToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDate(value, minimum) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= minimum;
}

export function OfferPick({ onOpen }) {
  const saved = readAccount();
  const today = localToday();
  const savedIndex = offers.findIndex((row) => row[0] === saved.offerLabel);
  const [index, setIndex] = useState(savedIndex >= 0 ? savedIndex : 6);
  const [date, setDate] = useState(isValidDate(saved.offerDate, today) ? saved.offerDate : "");
  const selected = offers[index];
  const dateIsValid = isValidDate(date, today);
  const projectName = saved.projectName.trim();
  const projectPitch = saved.projectPitch.trim();
  const category = saved.category.trim();

  useEffect(() => {
    const account = readAccount();
    if (account.offerDate && !isValidDate(account.offerDate, today)) {
      writeAccount({ ...account, offerDate: "" });
    }
  }, [today]);

  function choose(next) {
    const row = offers[next];
    setIndex(next);
    writeAccount({
      ...readAccount(),
      offerLabel: row[0],
      offerRange: row[1],
      offerPrice: row[2],
    });
  }

  function chooseDate(nextDate) {
    if (nextDate && !isValidDate(nextDate, today)) return;
    setDate(nextDate);
    writeAccount({ ...readAccount(), offerDate: nextDate });
  }

  return (
    <main className="offer-page">
      <header className="offer-header">
        <button type="button" className="offer-back" onClick={() => onOpen(11)} aria-label="Retour au profil">←</button>
        <div>
          <h1>Choisir <b>une offre</b></h1>
          <p>Lancez votre campagne et gagnez en visibilité</p>
        </div>
      </header>

      <section className="offer-project" aria-label="Projet de la campagne">
        <div className="offer-project-logo">
          {saved.projectLogo ? <img src={saved.projectLogo} alt={`Logo de ${projectName || "votre projet"}`} /> : <span aria-hidden="true">Logo</span>}
        </div>
        <div className="offer-project-copy">
          <h2>{projectName || "Votre projet"}</h2>
          <p>{projectPitch || "Ajoutez les informations de votre campagne."}</p>
        </div>
        {category ? <span className="offer-category">{category}</span> : null}
      </section>

      <section className="offer-card offer-duration" aria-labelledby="offer-duration-title">
        <div className="offer-section-title">
          <span className="offer-title-icon" aria-hidden="true">◔</span>
          <div>
            <h2 id="offer-duration-title">1. Choisir <b>une durée</b></h2>
            <p>Plus de temps = plus de visibilité</p>
          </div>
        </div>
        <div className="offer-list" role="radiogroup" aria-label="Durée de la campagne">
          {offers.map((row, rowIndex) => (
            <button
              key={row[0]}
              type="button"
              role="radio"
              aria-checked={rowIndex === index}
              className={rowIndex === index ? "offer-row is-on" : "offer-row"}
              onClick={() => choose(rowIndex)}
            >
              <span>{row[0]}</span>
              <span>{row[1]}</span>
              <b>{row[2]} €</b>
              <i aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="offer-card offer-date" aria-labelledby="offer-date-title">
        <div className="offer-section-title">
          <span className="offer-title-icon offer-calendar-icon" aria-hidden="true">▦</span>
          <div>
            <h2 id="offer-date-title">2. Choisir <b>le jour</b></h2>
            <p>Vérifiez les disponibilités pour votre campagne</p>
          </div>
        </div>
        <div className="offer-date-controls">
          <label>
            <span className="offer-date-readable">▣ <strong>{formatDate(date)}</strong></span>
            <input type="date" min={today} value={date} onChange={(event) => chooseDate(event.target.value)} aria-label="Date de début de la campagne" required />
          </label>
          {dateIsValid ? <span className="offer-available" title="Disponibilité simulée pour ce prototype"><i aria-hidden="true" /> Disponible</span> : null}
        </div>
        <p className="offer-availability-note">Disponibilité simulée pour ce prototype.</p>
      </section>

      <section className="offer-card offer-includes" aria-labelledby="offer-includes-title">
        <div className="offer-section-title">
          <span className="offer-title-icon" aria-hidden="true">✓</span>
          <h2 id="offer-includes-title">Ce que comprend <b>chaque offre</b></h2>
        </div>
        <div className="offer-benefits">
          {benefits.map(([icon, title, description]) => (
            <article key={title}>
              <span aria-hidden="true">{icon}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <p className="offer-note"><span aria-hidden="true">ⓘ</span> Aucune offre ne garantit un nombre de tests ou d’avis positifs. Les résultats dépendent de notre communauté de testeurs.</p>
      </section>

      <footer className="offer-footer">
        <div className="offer-summary">
          <div className="offer-summary-logo">
            {saved.projectLogo ? <img src={saved.projectLogo} alt="" /> : <span aria-hidden="true">Logo</span>}
          </div>
          <div>
            <strong>{projectName || "Votre projet"}</strong>
            <span>{selected[0]} · {selected[2]} €</span>
            <span>{dateIsValid ? formatDateShort(date) : "Jour à choisir"}</span>
          </div>
        </div>
        <button type="button" disabled={!selected || !dateIsValid} onClick={() => onOpen(13)}>Continuer vers le paiement <span aria-hidden="true">→</span></button>
      </footer>
    </main>
  );
}
