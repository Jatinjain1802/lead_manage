const express = require("express");
const router = express.Router();
const leadController = require("../controllers/leadController");

router.get("/", leadController.getLeads);
router.post("/", leadController.createLead);
router.get("/statuses", leadController.getStatuses);
router.patch("/:id", leadController.updateLead);

module.exports = router;
