const express = require("express");
const { getUserProfile , updateUserProfile } = require("../controllers/Profilecontroller");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", authenticateUser, getUserProfile);

router.put('/profile', authenticateUser, updateUserProfile);

module.exports = router;