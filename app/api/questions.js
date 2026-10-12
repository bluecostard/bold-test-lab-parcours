import { readClerkUser } from "../lib/clerkAuth.js";
import { readCampaign } from "../lib/campaignStore.js";
import { notifyReviewQuestion } from "../lib/mandatoryMail.js";
import { readQuestion, listQuestions, saveQuestion } from "../lib/questionStore.js";
import { readReview } from "../lib/reviewStore.js";

function clean(value, limit = 500) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function publicQuestion(question) {
  return {
    reviewId: question.reviewId,
    campaignId: question.campaignId,
    authorId: question.authorId || "",
    fromId: question.fromId || "",
    text: question.text,
    sentAt: question.sentAt,
    bugTitle: question.bugTitle || "",
    answer: question.answer || null,
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const reviewId = clean(req.query.reviewId, 80);
    const campaignId = clean(req.query.campaignId, 80);
    const mine = req.query.mine === "1" || req.query.mine === "true";
    try {
      if (mine) {
        const user = await readClerkUser(req);
        if (!user) return res.status(401).json({ error: "Connectez-vous pour voir vos messages." });
        const questions = await listQuestions();
        const mineItems = questions.filter((item) => item.authorId === user.id || item.fromId === user.id);
        return res.status(200).json({ questions: mineItems.map(publicQuestion) });
      }
      if (reviewId) {
        const question = await readQuestion(reviewId);
        if (!question) return res.status(404).json({ error: "Question introuvable." });
        return res.status(200).json({ question: publicQuestion(question) });
      }
      if (!campaignId) return res.status(400).json({ error: "Campagne manquante." });
      const questions = await listQuestions(campaignId);
      return res.status(200).json({ questions: questions.map(publicQuestion) });
    } catch (error) {
      console.log("questions-get", String(error?.message || error).slice(0, 180));
      return res.status(500).json({ error: "Questions indisponibles." });
    }
  }

  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour continuer." });
  const body = req.body || {};
  const reviewId = clean(body.reviewId, 80);
  const campaignId = clean(body.campaignId || "", 80);
  if (!reviewId) return res.status(400).json({ error: "Avis manquant." });

  if (req.method === "POST") {
    const text = clean(body.text, 500);
    if (!text) return res.status(400).json({ error: "Écrivez une question." });
    if (!campaignId) return res.status(400).json({ error: "Campagne manquante." });
    try {
      const campaign = campaignId === "bed-hop" ? { id: "bed-hop", ownerId: user.id } : await readCampaign(campaignId);
      if (!campaign) return res.status(404).json({ error: "Campagne introuvable." });
      if (campaign.ownerId && campaign.ownerId !== user.id && campaignId !== "bed-hop") {
        return res.status(403).json({ error: "Seul l’entrepreneur de la campagne peut poser une question." });
      }
      const review = await readReview(campaignId, reviewId);
      const question = {
        reviewId,
        campaignId,
        authorId: review?.authorId || "",
        fromId: user.id,
        text,
        bugTitle: clean(body.bugTitle || review?.title || "", 120),
        sentAt: new Date().toISOString(),
        answer: null,
      };
      const saved = await saveQuestion(question);
      if (saved.authorId && saved.authorId !== user.id) {
        notifyReviewQuestion(saved.authorId, {
          campaignName: campaign.name || "",
          question: saved.text,
        }).catch(() => {});
      }
      return res.status(201).json({ question: publicQuestion(saved) });
    } catch (error) {
      console.log("questions-post", String(error?.message || error).slice(0, 180));
      return res.status(500).json({ error: "Envoi impossible pour le moment." });
    }
  }

  if (req.method === "PATCH") {
    const status = body.status === "skipped" ? "skipped" : "answered";
    try {
      const current = await readQuestion(reviewId);
      if (!current) return res.status(404).json({ error: "Question introuvable." });
      if (current.authorId && current.authorId !== user.id) {
        return res.status(403).json({ error: "Seul le testeur de cet avis peut répondre." });
      }
      const saved = await saveQuestion({
        ...current,
        answer: status === "skipped"
          ? { status, label: "Précision non obtenue", answeredAt: new Date().toISOString() }
          : {
            status,
            choice: clean(body.choice, 20) || "Oui",
            detail: clean(body.detail, 500),
            answeredAt: new Date().toISOString(),
          },
      });
      return res.status(200).json({ question: publicQuestion(saved) });
    } catch (error) {
      console.log("questions-patch", String(error?.message || error).slice(0, 180));
      return res.status(500).json({ error: "Réponse impossible pour le moment." });
    }
  }

  return res.status(405).json({ error: "Méthode refusée." });
}
