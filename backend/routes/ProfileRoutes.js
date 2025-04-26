const express = require("express");
const { getUserProfile } = require("../controllers/Profilecontroller");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", authenticateUser, getUserProfile);

module.exports = router;