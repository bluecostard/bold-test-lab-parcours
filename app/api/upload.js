import { handleUpload } from "@vercel/blob/client";
import { readClerkUser } from "../lib/clerkAuth.js";

const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const videoTypes = ["video/mp4", "video/quicktime", "video/webm"];

function payloadKind(clientPayload) {
  try {
    const parsed = JSON.parse(clientPayload || "{}");
    return parsed.kind === "video" ? "video" : "image";
  } catch {
    return "image";
  }
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode refusée." });
  const user = await readClerkUser(req);
  if (!user) return res.status(401).json({ error: "Connectez-vous pour envoyer un fichier." });
  try {
    const json = await handleUpload({
      body: readBody(req),
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const kind = payloadKind(clientPayload);
        return {
          allowedContentTypes: kind === "video" ? videoTypes : imageTypes,
          maximumSizeInBytes: kind === "video" ? 100 * 1024 * 1024 : 10 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id, kind }),
        };
      },
      onUploadCompleted: async () => {},
    });
    return res.status(200).json(json);
  } catch (error) {
    console.log("upload", String(error?.message || error).slice(0, 180));
    return res.status(400).json({ error: "Envoi impossible." });
  }
}
