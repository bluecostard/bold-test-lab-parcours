const APP = "https://gemelo.online";
const LOGO = `${APP}/logo-gemelo.png`;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function greeting(name) {
  const label = String(name || "").trim();
  return label ? `Bonjour ${label},` : "Bonjour,";
}

function footerLinks({ token, manageOnly }) {
  const manage = `${APP}/?app=1&ecran=settings`;
  const leave = token ? `${APP}/api/unsubscribe?t=${encodeURIComponent(token)}` : "";
  if (manageOnly || !leave) {
    return { html: `<a href="${manage}" style="color:#d6ff4a;text-decoration:underline">Gérer mes notifications</a>`, text: `Gérer mes notifications : ${manage}` };
  }
  return {
    html: `<a href="${manage}" style="color:#d6ff4a;text-decoration:underline">Gérer mes notifications</a> · <a href="${leave}" style="color:#d6ff4a;text-decoration:underline">Me désinscrire</a>`,
    text: `Gérer mes notifications : ${manage}\nMe désinscrire : ${leave}`,
  };
}

function wrap({ kicker, title, preview, inner, token, manageOnly }) {
  const links = footerLinks({ token, manageOnly });
  const html = `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#071426;color:#f4f7fb;font-family:'Plus Jakarta Sans','Segoe UI',sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#071426">
    <tr>
      <td align="center" style="padding:28px 16px">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
          <tr><td style="padding:0 0 18px;text-align:center">
            <img src="${LOGO}" alt="Gemelo" width="72" height="72" style="display:block;margin:0 auto 10px;border:0">
            <p style="margin:0;color:#aebed1;font-size:13px;letter-spacing:.04em">Les yeux rivés sur vous</p>
          </td></tr>
          <tr><td style="padding:22px 22px 8px;background:#10243a;border-radius:18px 18px 0 0">
            <p style="margin:0 0 10px;color:#d6ff4a;font-size:12px;font-weight:800;letter-spacing:.08em">${escapeHtml(kicker)}</p>
            <h1 style="margin:0;color:#f4f7fb;font-size:28px;line-height:1.2">${title}</h1>
          </td></tr>
          <tr><td style="padding:8px 22px 22px;background:#10243a;border-radius:0 0 18px 18px">
            ${inner}
          </td></tr>
          <tr><td style="padding:22px 8px 0;text-align:center;color:#aebed1;font-size:14px;line-height:1.5">
            <p style="margin:0 0 6px">Gemelo · Les yeux rivés sur vous · bonjour@gemelo.online</p>
            <p style="margin:0 0 10px">Instagram et TikTok : <a href="https://www.instagram.com/bluecostard" style="color:#d6ff4a">@bluecostard</a></p>
            <p style="margin:0">${links.html}</p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { html, footerText: links.text };
}

function button(href, label) {
  return `<p style="margin:22px 0 0"><a href="${href}" style="display:inline-block;padding:14px 20px;background:#d6ff4a;color:#142000;font-size:16px;font-weight:800;text-decoration:none;border-radius:12px">${escapeHtml(label)}</a></p>`;
}

export function welcomeEmail({ name, token }) {
  const subject = "Bienvenue sur Gemelo, votre regard compte.";
  const preview = "Testez des projets ou faites découvrir le vôtre.";
  const hello = greeting(name);
  const inner = `
    <p style="margin:16px 0 0;font-size:16px;line-height:1.45">${escapeHtml(hello)}</p>
    <p style="margin:12px 0 0;font-size:16px;line-height:1.45;color:#d5dfeb">Votre compte Gemelo est prêt. Découvrez des projets, partagez votre regard et aidez leurs créateurs à progresser.</p>
    <p style="margin:20px 0 8px;color:#d6ff4a;font-size:14px;font-weight:800">Deux façons de participer</p>
    <p style="margin:0 0 10px;font-size:16px;line-height:1.45"><strong>Je suis testeur</strong><br>Testez une appli ou un site, puis partagez un avis précis avec captures ou vidéos.</p>
    <p style="margin:0;font-size:16px;line-height:1.45"><strong>Je suis créateur</strong><br>Présentez votre projet et choisissez un créneau de mise en avant auprès de la communauté.</p>
    ${button(`${APP}/?app=1`, "Découvrir Gemelo")}
    <p style="margin:16px 0 0;color:#aebed1;font-size:14px;line-height:1.4">Vous pouvez passer de l’espace testeur à l’espace créateur à tout moment dans l’application.</p>
  `;
  const wrapped = wrap({
    kicker: "INSCRIPTION CONFIRMÉE",
    title: "Bienvenue dans<br>la communauté.",
    preview,
    inner,
    token,
    manageOnly: true,
  });
  const text = [
    subject,
    "",
    hello,
    "Votre compte Gemelo est prêt. Découvrez des projets, partagez votre regard et aidez leurs créateurs à progresser.",
    "",
    "Je suis testeur : testez une appli ou un site, puis partagez un avis précis avec captures ou vidéos.",
    "Je suis créateur : présentez votre projet et choisissez un créneau de mise en avant.",
    "",
    `Découvrir Gemelo : ${APP}/?app=1`,
    "",
    "Gemelo · Les yeux rivés sur vous",
    "Instagram et TikTok : @bluecostard",
    wrapped.footerText,
  ].join("\n");
  return { subject, preview, text, html: wrapped.html };
}

function formatOfferDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return "";
  const raw = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Confirmation transactionnelle au créateur après paiement du créneau. */
export function campaignPaidEmail({
  name,
  campaignName,
  offerLabel,
  offerRange,
  offerDate,
  offerPrice,
  token,
}) {
  const subject = "Votre campagne Gemelo est confirmée";
  const preview = "Paiement reçu. Votre créneau est réservé.";
  const hello = greeting(name);
  const day = formatOfferDay(offerDate);
  const price = offerPrice != null && offerPrice !== "" ? `${offerPrice} €` : "";
  const href = `${APP}/?app=1&ecran=results`;
  const inner = `
    <p style="margin:16px 0 0;font-size:16px;line-height:1.45">${escapeHtml(hello)}</p>
    <p style="margin:12px 0 0;font-size:16px;line-height:1.45;color:#d5dfeb">Votre paiement est confirmé. La campagne <strong>${escapeHtml(campaignName || "votre projet")}</strong> est réservée sur Gemelo.</p>
    <p style="margin:20px 0 8px;color:#d6ff4a;font-size:14px;font-weight:800">Votre créneau</p>
    <p style="margin:0;font-size:16px;line-height:1.45">
      ${day ? `${escapeHtml(day)}<br>` : ""}
      ${escapeHtml(offerLabel || "")}${offerRange ? ` · ${escapeHtml(offerRange)}` : ""}
      ${price ? `<br>${escapeHtml(price)} TTC` : ""}
    </p>
    <p style="margin:16px 0 0;font-size:16px;line-height:1.45;color:#d5dfeb">Pendant ce créneau, votre projet est mis en avant sur l’accueil. Les testeurs peuvent le découvrir et publier leurs avis. Vous suivez les retours depuis votre espace résultats.</p>
    ${button(href, "Voir mes résultats de test")}
    <p style="margin:16px 0 0;color:#aebed1;font-size:14px;line-height:1.4">Vous pouvez modifier ou annuler jusqu’à 72 h avant le début du créneau, depuis votre compte.</p>
  `;
  const wrapped = wrap({
    kicker: "CAMPAGNE CONFIRMÉE",
    title: "Votre créneau<br>est réservé.",
    preview,
    inner,
    token,
    manageOnly: true,
  });
  const text = [
    subject,
    "",
    hello,
    `Votre paiement est confirmé. La campagne ${campaignName || "votre projet"} est réservée sur Gemelo.`,
    "",
    "Votre créneau",
    day,
    [offerLabel, offerRange].filter(Boolean).join(" · "),
    price ? `${price} TTC` : "",
    "",
    `Voir mes résultats : ${href}`,
    "",
    "Modification ou annulation jusqu’à 72 h avant le début, depuis votre compte.",
    "",
    wrapped.footerText,
  ].filter(Boolean).join("\n");
  return { subject, preview, text, html: wrapped.html };
}

export function campaignEmail({ name, campaignName, tags, endsLabel, token }) {
  const subject = `Une nouvelle campagne vous attend : ${campaignName}`;
  const preview = "Découvrez les consignes et partagez un avis utile.";
  const hello = greeting(name);
  const href = `${APP}/?app=1&ecran=campaign`;
  const inner = `
    <p style="margin:16px 0 0;color:#aebed1;font-size:14px">${escapeHtml(tags || "Campagne en cours")}</p>
    <p style="margin:6px 0 0;font-size:22px;font-weight:800">${escapeHtml(campaignName)}</p>
    ${endsLabel ? `<p style="margin:8px 0 0;color:#d6ff4a;font-size:14px">Fin de campagne : ${escapeHtml(endsLabel)}</p>` : ""}
    <p style="margin:16px 0 0;font-size:16px;line-height:1.45">${escapeHtml(hello)}</p>
    <p style="margin:12px 0 0;font-size:16px;line-height:1.45;color:#d5dfeb">${escapeHtml(campaignName)} ouvre sa campagne de test. Parcourez le projet, consultez les consignes et testez les points indiqués par son créateur.</p>
    <p style="margin:18px 0 8px;color:#d6ff4a;font-size:14px;font-weight:800">À observer pendant votre test</p>
    <p style="margin:0;font-size:16px;line-height:1.45">Bugs et écran concerné · Consommation de batterie<br>Design · Logique du parcours</p>
    ${button(href, "Voir la campagne et les consignes")}
  `;
  const wrapped = wrap({
    kicker: "NOUVELLE CAMPAGNE DE TEST",
    title: "Un nouveau projet.<br>Votre prochain regard.",
    preview,
    inner,
    token,
  });
  const text = [
    subject,
    "",
    hello,
    `${campaignName} ouvre sa campagne de test. Parcourez le projet, consultez les consignes et testez les points indiqués par son créateur.`,
    endsLabel ? `Fin de campagne : ${endsLabel}` : "",
    "",
    `Voir la campagne : ${href}`,
    "",
    "Gemelo · Les yeux rivés sur vous",
    wrapped.footerText,
  ].filter(Boolean).join("\n");
  return { subject, preview, text, html: wrapped.html };
}

export function rankingEmail({ name, rows, token }) {
  const subject = "Cette semaine, découvrez le Top 10 Gemelo";
  const preview = "Les regards utiles à l’honneur. Et vous, où en êtes-vous ?";
  const hello = greeting(name);
  const href = `${APP}/?app=1&ecran=ranking`;
  const list = (rows || []).slice(0, 10).map((row) => {
    const place = String(row.place).padStart(2, "0");
    const mark = row.you ? " (vous)" : row.live === false ? " · Exemple" : "";
    return `<tr>
      <td style="padding:8px 0;border-top:1px solid rgba(151,185,218,.18);color:#d6ff4a;font-weight:800;width:36px">${place}</td>
      <td style="padding:8px 0;border-top:1px solid rgba(151,185,218,.18);font-size:16px">${escapeHtml(row.name)}${mark}</td>
      <td style="padding:8px 0;border-top:1px solid rgba(151,185,218,.18);text-align:right;font-weight:800">${Number(row.points || 0).toLocaleString("fr-FR")}</td>
    </tr>`;
  }).join("");
  const inner = `
    <p style="margin:16px 0 0;font-size:16px;line-height:1.45">${escapeHtml(hello)}</p>
    <p style="margin:12px 0 0;font-size:16px;line-height:1.45;color:#d5dfeb">Bravo aux membres qui font avancer les projets grâce à leurs retours pertinents et appréciés cette semaine.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0">
      <tr><td style="color:#aebed1;font-size:12px;padding-bottom:6px">TESTEUR</td><td style="color:#aebed1;font-size:12px;padding-bottom:6px;text-align:right">POINTS</td></tr>
      ${list}
    </table>
    <p style="margin:16px 0 0;color:#aebed1;font-size:14px;line-height:1.4">Votre projet gagne en visibilité tant que vous restez dans le Top 10. Continuez à partager des avis utiles et appréciés.</p>
    ${button(href, "Voir le classement et les projets")}
  `;
  const wrapped = wrap({
    kicker: "LE CLASSEMENT DE LA SEMAINE",
    title: "10 testeurs.<br>Des regards qui comptent.",
    preview,
    inner,
    token,
  });
  const lines = (rows || []).slice(0, 10).map((row) => {
    const mark = row.you ? " (vous)" : row.live === false ? " · Exemple" : "";
    return `${String(row.place).padStart(2, "0")} ${row.name}${mark} — ${row.points}`;
  });
  const text = [subject, "", hello, ...lines, "", `Voir le classement : ${href}`, "", wrapped.footerText].join("\n");
  return { subject, preview, text, html: wrapped.html };
}

export function closingEmail({ name, campaignName, hours, rank, points, endsLabel, token }) {
  const subject = `Plus que ${hours} h pour tester ${campaignName}`;
  const preview = "Un retour utile peut faire la différence dans votre classement.";
  const hello = greeting(name);
  const href = `${APP}/?app=1&ecran=campaign`;
  const rankLine = rank ? `Votre classement : ${rank}e · ${Number(points || 0).toLocaleString("fr-FR")} points` : "";
  const inner = `
    <p style="margin:16px 0 0;color:#d6ff4a;font-size:42px;font-weight:900;line-height:1">${escapeHtml(String(hours).padStart(2, "0"))} H</p>
    <p style="margin:8px 0 0;font-size:16px">avant la fin de la campagne ${escapeHtml(campaignName)}</p>
    ${endsLabel ? `<p style="margin:8px 0 0;color:#aebed1;font-size:14px">Clôture ${escapeHtml(endsLabel)}</p>` : ""}
    <p style="margin:16px 0 0;font-size:16px;line-height:1.45">${escapeHtml(hello)}</p>
    <p style="margin:12px 0 0;font-size:16px;line-height:1.45;color:#d5dfeb">Il reste ${hours} heures pour tester ${escapeHtml(campaignName)} et publier votre retour avant la clôture de la campagne.</p>
    ${rankLine ? `<p style="margin:14px 0 0;font-size:16px;font-weight:800">${escapeHtml(rankLine)}</p>` : ""}
    <p style="margin:12px 0 0;font-size:16px;line-height:1.45;color:#d5dfeb">Un avis pertinent et apprécié peut vous aider à conserver votre place ou à progresser.</p>
    <p style="margin:12px 0 0;color:#aebed1;font-size:14px;line-height:1.4">Décrivez l’écran concerné, expliquez ce qui vous a bloqué et ajoutez une capture ou une vidéo si cela aide.</p>
    ${button(href, "Tester et partager mon avis")}
  `;
  const wrapped = wrap({
    kicker: "DERNIÈRE LIGNE DROITE",
    title: `Encore ${hours} heures<br>pour faire la différence.`,
    preview,
    inner,
    token,
  });
  const text = [
    subject,
    "",
    hello,
    `Il reste ${hours} heures pour tester ${campaignName} et publier votre retour.`,
    rankLine,
    "",
    `Tester : ${href}`,
    "",
    wrapped.footerText,
  ].filter(Boolean).join("\n");
  return { subject, preview, text, html: wrapped.html };
}

/** Question d’un entrepreneur sur un avis publié (obligatoire). */
export function reviewQuestionEmail({ name, campaignName, question, token }) {
  const subject = `Une question sur votre avis — ${campaignName || "Gemelo"}`;
  const preview = "L’entrepreneur vous demande une précision.";
  const hello = greeting(name);
  const href = `${APP}/?app=1&ecran=messages`;
  const inner = `
    <p style="margin:16px 0 0;font-size:16px;line-height:1.45">${escapeHtml(hello)}</p>
    <p style="margin:12px 0 0;font-size:16px;line-height:1.45;color:#d5dfeb">L’entrepreneur de <strong>${escapeHtml(campaignName || "la campagne")}</strong> vous pose une question au sujet de votre avis.</p>
    <p style="margin:18px 0 8px;color:#d6ff4a;font-size:14px;font-weight:800">Question</p>
    <p style="margin:0;font-size:16px;line-height:1.45">${escapeHtml(question || "")}</p>
    <p style="margin:16px 0 0;font-size:16px;line-height:1.45;color:#d5dfeb">Vous pouvez répondre ou passer — cela ne modifie ni votre avis ni vos points.</p>
    ${button(href, "Voir la question dans Messages")}
  `;
  const wrapped = wrap({
    kicker: "QUESTION SUR VOTRE AVIS",
    title: "Une précision<br>vous est demandée.",
    preview,
    inner,
    token,
    manageOnly: true,
  });
  const text = [
    subject,
    "",
    hello,
    `L’entrepreneur de ${campaignName || "la campagne"} vous pose une question au sujet de votre avis.`,
    "",
    question || "",
    "",
    `Voir la question : ${href}`,
    "",
    wrapped.footerText,
  ].filter(Boolean).join("\n");
  return { subject, preview, text, html: wrapped.html };
}

/** Nouveau message entre propriétaires de campagnes payantes (obligatoire). */
export function directMessageEmail({ name, fromName, previewText, token }) {
  const subject = `Nouveau message — ${fromName || "Gemelo"}`;
  const preview = "Un propriétaire de campagne vous a écrit.";
  const hello = greeting(name);
  const href = `${APP}/?app=1&ecran=messages`;
  const inner = `
    <p style="margin:16px 0 0;font-size:16px;line-height:1.45">${escapeHtml(hello)}</p>
    <p style="margin:12px 0 0;font-size:16px;line-height:1.45;color:#d5dfeb"><strong>${escapeHtml(fromName || "Un propriétaire")}</strong> vous a envoyé un message sur Gemelo.</p>
    ${previewText ? `<p style="margin:18px 0 8px;color:#d6ff4a;font-size:14px;font-weight:800">Aperçu</p><p style="margin:0;font-size:16px;line-height:1.45">${escapeHtml(previewText)}</p>` : ""}
    ${button(href, "Ouvrir la conversation")}
  `;
  const wrapped = wrap({
    kicker: "NOUVEAU MESSAGE",
    title: "Quelqu’un vous<br>a écrit.",
    preview,
    inner,
    token,
    manageOnly: true,
  });
  const text = [
    subject,
    "",
    hello,
    `${fromName || "Un propriétaire"} vous a envoyé un message sur Gemelo.`,
    previewText || "",
    "",
    `Ouvrir : ${href}`,
    "",
    wrapped.footerText,
  ].filter(Boolean).join("\n");
  return { subject, preview, text, html: wrapped.html };
}

/** Modification ou annulation de créneau (obligatoire). */
export function bookingChangeEmail({
  name,
  campaignName,
  kind,
  offerLabel,
  offerRange,
  offerDate,
  token,
}) {
  const cancelled = kind === "cancel";
  const subject = cancelled
    ? "Votre campagne Gemelo a été annulée"
    : "Votre créneau Gemelo a été modifié";
  const preview = cancelled ? "Annulation confirmée." : "Nouveau créneau enregistré.";
  const hello = greeting(name);
  const day = formatOfferDay(offerDate);
  const href = `${APP}/?app=1&ecran=profile`;
  const inner = cancelled
    ? `
    <p style="margin:16px 0 0;font-size:16px;line-height:1.45">${escapeHtml(hello)}</p>
    <p style="margin:12px 0 0;font-size:16px;line-height:1.45;color:#d5dfeb">La campagne <strong>${escapeHtml(campaignName || "votre projet")}</strong> a été annulée. Votre projet reste enregistré sur votre compte.</p>
    ${button(href, "Voir mon profil")}
  `
    : `
    <p style="margin:16px 0 0;font-size:16px;line-height:1.45">${escapeHtml(hello)}</p>
    <p style="margin:12px 0 0;font-size:16px;line-height:1.45;color:#d5dfeb">Le créneau de <strong>${escapeHtml(campaignName || "votre projet")}</strong> a été mis à jour.</p>
    <p style="margin:20px 0 8px;color:#d6ff4a;font-size:14px;font-weight:800">Nouveau créneau</p>
    <p style="margin:0;font-size:16px;line-height:1.45">
      ${day ? `${escapeHtml(day)}<br>` : ""}
      ${escapeHtml(offerLabel || "")}${offerRange ? ` · ${escapeHtml(offerRange)}` : ""}
    </p>
    ${button(href, "Voir mon créneau")}
  `;
  const wrapped = wrap({
    kicker: cancelled ? "CAMPAGNE ANNULÉE" : "CRÉNEAU MODIFIÉ",
    title: cancelled ? "Annulation<br>confirmée." : "Créneau<br>mis à jour.",
    preview,
    inner,
    token,
    manageOnly: true,
  });
  const text = [
    subject,
    "",
    hello,
    cancelled
      ? `La campagne ${campaignName || "votre projet"} a été annulée.`
      : `Le créneau de ${campaignName || "votre projet"} a été mis à jour.`,
    day,
    [offerLabel, offerRange].filter(Boolean).join(" · "),
    "",
    `Voir le profil : ${href}`,
    "",
    wrapped.footerText,
  ].filter(Boolean).join("\n");
  return { subject, preview, text, html: wrapped.html };
}
