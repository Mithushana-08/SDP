const express = require("express");
const { getUserProfile, updateUserProfile, updateUserPassword, userUpload } = require("../controllers/Profilecontroller");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", authenticateUser, getUserProfile);
router.put("/profile", authenticateUser, userUpload.single('profileImage'), updateUserProfile);
router.put("/password", authenticateUser, updateUserPassword);

module.exports = router;