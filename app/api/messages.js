import { readClerkUser } from "../lib/clerkAuth.js";
import { isPaidOwner, listPaidBookings, readBooking } from "../lib/bookingStore.js";
import { listCampaigns, readCampaign } from "../lib/campaignStore.js";
import { notifyDirectMessage } from "../lib/mandatoryMail.js";
import {
  appendMessage,
  conversationIdFor,
  listConversationsFor,
  readConversation,
} from "../lib/messageStore.js";

function clean(value, limit = 500) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function publicPeer(booking, campaign) {
  const name = clean(campaign?.name || booking?.campaign?.name || "Campagne", 80) || "Campagne";
  return {
    userId: booking.userId,
    campaignId: booking.campaignId || campaign?.id || "",
    name,
    logo: clean(campaign?.logo || booking?.campaign?.logo || "", 500),
    pitch: clean(campaign?.pitch || campaign?.description || "", 160),
  };
}

function publicConversation(conversation, viewerId, peerMap) {
  const peerId = (conversation.participants || []).find((id) => id !== viewerId) || "";
  const peer = peerMap.get(peerId) || { userId: peerId, name: "Campagne", logo: "", pitch: "", campaignId: "" };
  return {
    id: conversation.id,
    peerId,
    peer,
    lastPreview: clean(conversation.lastPreview, 160),
    updatedAt: conversation.updatedAt || conversation.createdAt || "",
    messages: Array.isArray(conversation.messages)
      ? conversation.messages.map((item) => ({
          id: item.id,
          fromId: item.fromId,
          text: clean(item.text, 500),
          sentAt: item.sentAt || "",
          mine: item.fromId === viewerId,
        }))
      : [],
  };
}

async function peerMapFromBookings(bookings) {
  const campaigns = await listCampaigns();
  const byOwner = new Map();
  for (const campaign of campaigns) {
    if (campaign?.ownerId) byOwner.set(campaign.ownerId, campaign);
  }
  const map = new Map();
  for (const booking of bookings) {
    const campaign = byOwner.get(booking.userId)
      || (booking.campaignId ? await readCampaign(booking.campaignId) : null)
      || booking.campaign
      || null;
    map.set(booking.userId, publicPeer(booking, campaign));
  }
  return map;
}

async function requirePaidUser(req, res) {
  const user = await readClerkUser(req);
  if (!user) {
    res.status(401).json({ error: "Connectez-vous pour continuer." });
    return null;
  }
  const paid = await isPaidOwner(user.id);
  if (!paid) {
    res.status(403).json({
      error: "La messagerie est réservée aux propriétaires de campagnes payantes.",
      unlocked: false,
    });
    return null;
  }
  return user;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const user = await readClerkUser(req);
    if (!user) return res.status(401).json({ error: "Connectez-vous pour voir vos messages." });

    const unlocked = await isPaidOwner(user.id);
    if (req.query.status === "1" || req.query.status === "true") {
      return res.status(200).json({ unlocked });
    }
    if (!unlocked) {
      return res.status(200).json({ unlocked: false, conversations: [], peers: [] });
    }

    try {
      const paidBookings = await listPaidBookings();
      const peers = await peerMapFromBookings(paidBookings);

      const conversationId = clean(req.query.conversationId || req.query.id || "", 160);
      if (conversationId) {
        const conversation = await readConversation(conversationId);
        if (!conversation || !(conversation.participants || []).includes(user.id)) {
          return res.status(404).json({ error: "Conversation introuvable." });
        }
        return res.status(200).json({
          unlocked: true,
          conversation: publicConversation(conversation, user.id, peers),
        });
      }

      if (req.query.peers === "1" || req.query.peers === "true") {
        const list = [...peers.values()].filter((peer) => peer.userId !== user.id);
        return res.status(200).json({ unlocked: true, peers: list });
      }

      const conversations = await listConversationsFor(user.id);
      return res.status(200).json({
        unlocked: true,
        conversations: conversations.map((item) => publicConversation(item, user.id, peers)),
        peers: [...peers.values()].filter((peer) => peer.userId !== user.id),
      });
    } catch (error) {
      console.log("messages-get", String(error?.message || error).slice(0, 180));
      return res.status(500).json({ error: "Messages indisponibles." });
    }
  }

  if (req.method === "POST") {
    const user = await requirePaidUser(req, res);
    if (!user) return undefined;

    const body = req.body || {};
    const peerId = clean(body.peerId || body.toId || "", 80);
    const text = clean(body.text, 500);
    if (!peerId) return res.status(400).json({ error: "Correspondant manquant." });
    if (!text) return res.status(400).json({ error: "Écrivez un message." });
    if (peerId === user.id) return res.status(400).json({ error: "Correspondant invalide." });

    try {
      const peerPaid = await isPaidOwner(peerId);
      if (!peerPaid) {
        return res.status(403).json({
          error: "Seuls les propriétaires de campagnes payantes peuvent s’écrire.",
        });
      }
      const peerBooking = await readBooking(peerId);
      if (!peerBooking?.paid) {
        return res.status(403).json({
          error: "Seuls les propriétaires de campagnes payantes peuvent s’écrire.",
        });
      }

      const conversation = await appendMessage({ fromId: user.id, toId: peerId, text });
      const paidBookings = await listPaidBookings();
      const peers = await peerMapFromBookings(paidBookings);
      const fromPeer = peers.get(user.id);
      notifyDirectMessage(peerId, {
        fromName: fromPeer?.name || "Un propriétaire",
        previewText: text.slice(0, 160),
      }).catch(() => {});
      return res.status(201).json({
        unlocked: true,
        conversation: publicConversation(conversation, user.id, peers),
        conversationId: conversationIdFor(user.id, peerId),
      });
    } catch (error) {
      console.log("messages-post", String(error?.message || error).slice(0, 180));
      return res.status(500).json({ error: error.message || "Envoi impossible pour le moment." });
    }
  }

  return res.status(405).json({ error: "Méthode refusée." });
}
