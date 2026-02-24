const leadModel = require("../models/leadModel");
const messageModel = require("../models/messageModel");
const { normalizePhone, getMessageText } = require("../utils/helpers");
const { getNextAgentForAssignment } = require("../utils/assignment");
const { emitToAll } = require("../utils/socket");

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
          rawMessage: message,
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

  if (mode === "subscribe" && verifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.status(403).json({ error: "Webhook verification failed" });
};

const handleWebhook = async (req, res) => {
  try {
    // Console log the raw payload for debugging
    console.log("--- New Webhook Request ---");
    console.log(JSON.stringify(req.body, null, 2));

    const incomingLeads = parseWebhookLeads(req.body);
    
    if (incomingLeads.length > 0) {
      console.log(`Parsed ${incomingLeads.length} leads from webhook.`);
      console.log(incomingLeads);
    }

    for (const lead of incomingLeads) {
      // 1. Check if lead already exists to see if it's "New" vs "Existing Chat"
      const existingLead = await leadModel.findLeadByPhone(lead.phone);
      
      let leadId;
      let assignedToId = null;

      if (!existingLead) {
        // NEW LEAD: Apply Round-Robin Assignment
        assignedToId = await getNextAgentForAssignment();
        
        leadId = await leadModel.upsertLead(
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

        // Update with assignment
        if (assignedToId) {
          await leadModel.updateLead(leadId, ["assigned_to_id = ?"], [assignedToId]);
        }
      } else {
        // EXISTING LEAD: Use existing assignment
        leadId = existingLead.id;
        await leadModel.upsertLead(
          {
            phone: lead.phone,
            name: lead.name,
            source: "whatsapp_ad",
            status: existingLead.status, // Keep current status
            lastMessage: lead.lastMessage,
            lastMessageAt: lead.lastMessageAt,
          },
          req.body
        );
      }

      // 2. Save Message to History
      await messageModel.createMessage({
        leadId,
        senderType: 'customer',
        messageText: lead.lastMessage,
        messageType: lead.rawMessage?.type || 'text',
        rawPayload: lead.rawMessage
      });

      // 3. Emit Real-time Notification via Socket
      const updatedLead = await leadModel.getLeadById(leadId);
      emitToAll("new_lead", {
        lead: updatedLead,
        isNew: !existingLead
      });
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
