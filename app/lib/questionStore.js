import { get, list, put } from "@vercel/blob";

const access = "private";

function questionPath(reviewId) {
  return `questions/${reviewId}.json`;
}

async function readJson(pathname) {
  const result = await get(pathname, { access, useCache: false });
  if (!result || result.statusCode !== 200) return null;
  const text = await new Response(result.stream).text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeJson(pathname, value) {
  await put(pathname, JSON.stringify(value), {
    access,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function readQuestion(reviewId) {
  if (!reviewId) return null;
  return readJson(questionPath(reviewId));
}

export async function listQuestions(campaignId) {
  const listed = await list({ prefix: "questions/", limit: 200 });
  const questions = [];
  for (const blob of listed.blobs) {
    const question = await readJson(blob.pathname);
    if (!question?.reviewId) continue;
    if (campaignId && question.campaignId !== campaignId) continue;
    questions.push(question);
  }
  questions.sort((a, b) => String(b.sentAt || "").localeCompare(String(a.sentAt || "")));
  return questions;
}

export async function saveQuestion(question) {
  await writeJson(questionPath(question.reviewId), question);
  return question;
}
