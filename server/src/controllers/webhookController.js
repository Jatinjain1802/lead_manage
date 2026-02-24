const leadModel = require("../models/leadModel");
const { normalizePhone, getMessageText } = require("../utils/helpers");

/**
 * Normalizes WhatsApp payloads and extracts relevant lead info.
 */
function parseWebhookLeads(payload) {
  const result = [];
  if (payload?.object !== "whatsapp_business_account") return result;

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const contactsByWaId = new Map();

      for (const contact of value.contacts || []) {
        const phone = normalizePhone(contact?.wa_id);
        if (phone) contactsByWaId.set(phone, contact);
      }

      for (const message of value.messages || []) {
        const phone = normalizePhone(message?.from);
        if (!phone) continue;

        const contact = contactsByWaId.get(phone);
        const name = contact?.profile?.name || null;
        const lastMessage = getMessageText(message);
        const timestampMs = message?.timestamp
          ? Number(message.timestamp) * 1000
          : Date.now();

        result.push({
          phone,
          name,
          lastMessage,
          lastMessageAt: new Date(timestampMs),
        });
      }
    }
  }

  return result;
}

const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const challenge = req.query["hub.challenge"];
  const verifyToken = req.query["hub.verify_token"];

  if (mode === "subscribe" && verifyToken === process.env.META_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.status(403).json({ error: "Webhook verification failed" });
};

const handleWebhook = async (req, res) => {
  try {
    const incomingLeads = parseWebhookLeads(req.body);

    if (!incomingLeads.length) {
      return res.status(200).json({ received: true, processed: 0 });
    }

    for (const lead of incomingLeads) {
      await leadModel.upsertLead(
        {
          phone: lead.phone,
          name: lead.name,
          source: "whatsapp_ad",
          status: "new",
          lastMessage: lead.lastMessage,
          lastMessageAt: lead.lastMessageAt,
        },
        req.body
      );
    }

    return res.status(200).json({
      received: true,
      processed: incomingLeads.length,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
};

module.exports = {
  verifyWebhook,
  handleWebhook,
};
