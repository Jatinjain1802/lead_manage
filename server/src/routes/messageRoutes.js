const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { auth } = require("../middlewares/authMiddleware");

router.use(auth);

router.get("/lead/:leadId", messageController.getChatHistory);
router.post("/lead/:leadId", messageController.sendAgentMessage);
router.post("/lead/:leadId/media", messageController.sendAgentMedia);

module.exports = router;
