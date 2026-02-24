const express = require("express");
const router = express.Router();
const leadController = require("../controllers/leadController");
const { auth } = require("../middlewares/authMiddleware");

// Protected routes
router.use(auth);

router.get("/", leadController.getLeads);
router.post("/", leadController.createLead);
router.get("/statuses", leadController.getStatuses);
router.get("/:id/activities", leadController.getActivityHistory);
router.patch("/:id", leadController.updateLead);

module.exports = router;
