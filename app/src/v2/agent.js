function pick(list, seed) {
  let total = 0;
  for (let index = 0; index < seed.length; index += 1) total += seed.charCodeAt(index) * (index + 3);
  return list[total % list.length];
}

function lastThem(messages) {
  return [...messages].reverse().find((item) => item.from === "them")?.text || "";
}

function camilleReply(text, messages) {
  const turns = messages.filter((item) => item.from === "me").length;
  if (/comment ça marche|comment ca marche|c.?est quoi|tu es qui|t.?es qui|bot|robot|ia|agent/.test(text)) {
    return [
      "Moi c’est Camille. Je te parle comme je le ferais en vrai, pas avec un menu.",
      "Sur Gemelo tu testes une campagne — là c’est Bed Hop — puis tu laisses un avis. Les messages servent à préciser un point, sans changer tes points.",
    ];
  }
  if (/^(salut|hello|hey|coucou|bonjour|bonsoir|yo)\b/.test(text) && text.length < 24) {
    return pick([
      "Salut ! Content que tu passes. Tu testes Bed Hop ou tu regardes juste comment ça marche ici ?",
      "Hey. Dis-moi ce que tu as sous les yeux, je te réponds comme je le ferais à un pote.",
      "Coucou. Je suis là. Qu’est-ce que tu veux clarifier ?",
    ], text);
  }
  if (/merci|nickel|super|top|génial|parfait/.test(text)) {
    return pick([
      "Avec plaisir. Si un truc coince encore, tu me le dis, même en vrac.",
      "Ok cool. Tu peux aussi liker un avis utile, ça fait monter les points.",
      "Tranquille. Je reste dans le fil si tu reviens avec une capture ou un doute.",
    ], text + turns);
  }
  if (/bed ?hop|chambre|créneau|creneau|11 ?h|réser|reser|entreprise paie|hôte|hote/.test(text)) {
    return pick([
      "Sur Bed Hop le truc à checker c’est le créneau 11 h – 17 h, et si on comprend que l’entreprise paie avant d’entrer. C’est ça que l’entrepreneur veut savoir.",
      "Ouais, l’hôte est censé être là. Moi j’irais d’abord sur Autour de toi, je chercherais une chambre, et je regarderais si Réserver est évident.",
      "Si la résa est floue, dis-le dans l’avis, avec une capture. Ça aide plus qu’un long texte.",
    ], text);
  }
  if (/avis|questionnaire|compte rendu|points|like|classement|top ?10/.test(text)) {
    return pick([
      "Ton avis reste le tien. Une question de l’entrepreneur après coup, tu peux passer, ça ne touche ni le texte ni les points.",
      "Les likes font monter les points, sauf sur ton propre avis. Le classement c’est sur 30 jours.",
      "Le top 10, c’est uniquement le classement des points sur 30 jours. Continue à publier des avis utiles.",
    ], text);
  }
  if (/paye|payé|paiement|stripe|offre|19|39|euro|€/.test(text)) {
    return "Le paiement passe par la page Stripe. Gemelo ne voit pas ta carte. Tu choisis un créneau, tu paies, puis ta campagne est programmée.";
  }
  if (/bug|bloque|bloqué|marche pas|cassé|erreur/.test(text)) {
    return "Ok, décris ce que tu as tapé et ce que tu voyais à l’écran. Même deux phrases, je te dis comment le noter dans le compte rendu.";
  }
  if (text.length < 8) {
    return pick([
      "Je t’écoute. Tu peux écrire normalement, pas besoin de faire une phrase parfaite.",
      "Vas-y, développe un peu. Qu’est-ce que tu as vu ?",
    ], text + lastThem(messages));
  }
  if (/\?/.test(text)) {
    return pick([
      "Bonne question. De mon côté je regarderais d’abord la page campagne, les consignes sont seulement là, pas dans le questionnaire.",
      "Je te le dis simplement : tu testes, tu écris ce que tu as compris, et si un bouton est caché tu le notes. C’est déjà précieux.",
      "Si tu veux, envoie-moi le moment exact — accueil, carte, ou paiement — je te dis ce que je checkerais.",
    ], text);
  }
  return pick([
    "Je vois. Continue comme si tu m’écrivais après le test, pas comme un rapport. Qu’est-ce qui t’a sauté aux yeux ?",
    "Ok je te suis. Le plus utile c’est le détail concret : un bouton, un texte, un moment où tu as hésité.",
    "Hmm. Si tu me dis l’écran, je te réponds plus juste. Accueil, Autour de toi, ou autre chose ?",
  ], text + turns);
}

function bedHopReply(text, messages) {
  const turns = messages.filter((item) => item.from === "me").length;
  if (/^(salut|hello|hey|coucou|bonjour|bonsoir)\b/.test(text)) {
    return "Bonjour. Merci de tester Bed Hop. Vous avez trouvé une chambre sur le créneau 11 h – 17 h ?";
  }
  if (/merci|top|super|clair/.test(text)) {
    return "Merci, ça nous aide. Si un point reste flou à la réservation, dites-le-nous, même en une phrase.";
  }
  if (/paye|entreprise|facture|boîte|boite/.test(text)) {
    return "Oui : l’entreprise est facturée avant l’entrée. L’hôte est sur place. On veut savoir si ça se lit tout de suite.";
  }
  if (/réser|reser|bouton|trouver/.test(text)) {
    return "Justement. Plusieurs personnes cherchent encore Réserver. Si vous l’avez eu sous les yeux, dites-nous à quel moment.";
  }
  if (/\?/.test(text) || turns < 2) {
    return pick([
      "Le test tient en trois gestes : ouvrir l’app, chercher entre 11 h et 17 h, puis dire si la réservation est claire.",
      "On ne vous demande pas un roman. Un retour honnête sur la recherche et le paiement suffisent.",
    ], text);
  }
  return "C’est noté. On lit tous les retours à la fin de la campagne. Autre chose sur le parcours ?";
}

export function replyAsPerson(peer, messages, userText) {
  const text = userText.trim().toLowerCase();
  if (!peer || !text) return "Je suis là. Écris-moi quand tu veux.";
  if (peer.id === "bed-hop") return bedHopReply(text, messages);
  return camilleReply(text, messages);
}
