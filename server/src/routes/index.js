const express = require("express");
const router = express.Router();
const leadRoutes = require("./leadRoutes");
const webhookRoutes = require("./webhookRoutes");
const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const messageRoutes = require("./messageRoutes");

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/messages", messageRoutes);
router.use("/leads", leadRoutes);
router.use("/whatsapp", webhookRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
