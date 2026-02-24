const messageModel = require("../models/messageModel");
const userModel = require("../models/userModel");
const leadModel = require("../models/leadModel");
const { emitToAll } = require("../utils/socket");
const { sendWhatsAppMessage, sendWhatsAppMedia } = require("../services/whatsappService");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 16 * 1024 * 1024 } // 16MB validation limit
}).single('file');

/**
 * Get Chat History for a Lead
 */
const getChatHistory = async (req, res) => {
  try {
    const leadId = req.params.leadId;
    
    // Check if user has permission
    const user = await userModel.findById(req.user.id);
    if (!user.can_view_chat && user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied to chat details" });
    }

    const messages = await messageModel.getMessagesByLeadId(leadId);
    res.json(messages);
  } catch (err) {
    console.error("Fetch chat error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Send Text Message via Agent
 */
const sendAgentMessage = async (req, res) => {
  try {
    const leadId = req.params.leadId;
    const { messageText } = req.body;

    if (!messageText) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const lead = await leadModel.getLeadById(leadId);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    // Send to WhatsApp
    const waResult = await sendWhatsAppMessage(lead.phone, messageText);

    // Always log locally
    await messageModel.createMessage({
      leadId,
      senderType: 'agent',
      senderId: req.user.id,
      messageText,
      messageType: 'text'
    });

    await leadModel.updateLead(leadId, 
      ["last_message = ?", "last_message_at = CURRENT_TIMESTAMP"], 
      [messageText]
    );

    const updatedLead = await leadModel.getLeadById(leadId);
    emitToAll("lead_updated", updatedLead);

    res.status(201).json({ 
      success: true, 
      whatsappSent: waResult.success,
      waError: waResult.success ? null : waResult.error
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Handle Media (Image, Doc, Video) Upload and Send
 */
const sendAgentMedia = async (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `File is too large or invalid. Max 16MB allowed.` });
    } else if (err) {
      return res.status(500).json({ error: "Error during file upload" });
    }

    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const leadId = req.params.leadId;
    const { mediaType, caption } = req.body;
    
    try {
      const lead = await leadModel.getLeadById(leadId);
      if (!lead) return res.status(404).json({ error: "Lead not found" });

      // Generate full URL
      // CRITICAL: WhatsApp cannot access 'localhost'. You MUST use a public URL (like ngrok).
      const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
      const mediaUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${req.file.filename}`;

      // Hit WhatsApp Media API
      const waResult = await sendWhatsAppMedia(lead.phone, mediaType, mediaUrl, caption);

      const messageDesc = caption || req.file.originalname;

      // Record in Database
      await messageModel.createMessage({
        leadId,
        senderType: 'agent',
        senderId: req.user.id,
        messageText: messageDesc,
        messageType: mediaType,
        metadata: JSON.stringify({ url: mediaUrl, filename: req.file.filename, size: req.file.size })
      });

      await leadModel.updateLead(leadId, 
        ["last_message = ?", "last_message_at = CURRENT_TIMESTAMP"], 
        [messageDesc]
      );

      const updatedLead = await leadModel.getLeadById(leadId);
      emitToAll("lead_updated", updatedLead);

      res.status(201).json({ 
        success: true, 
        url: mediaUrl,
        whatsappSent: waResult.success 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });
};

module.exports = {
  getChatHistory,
  sendAgentMessage,
  sendAgentMedia,
};
