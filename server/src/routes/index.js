const express = require("express");
const router = express.Router();
const leadRoutes = require("./leadRoutes");
const webhookRoutes = require("./webhookRoutes");

router.use("/leads", leadRoutes);
router.use("/whatsapp", webhookRoutes); // Hits /api/whatsapp/webhook

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
