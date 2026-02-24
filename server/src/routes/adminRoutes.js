const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const analyticsController = require("../controllers/analyticsController");
const { auth, adminOnly } = require("../middlewares/authMiddleware");

router.use(auth);
router.use(adminOnly);

router.get("/users", adminController.getUsers);
router.post("/users", adminController.createUser);
router.patch("/users/:id", adminController.updateUser);

// Analytics
router.get("/analytics", analyticsController.getAnalytics);

module.exports = router;
