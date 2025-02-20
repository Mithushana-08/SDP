const express = require("express");
const { loginUser } = require("../controllers/authController"); // Ensure this import is correct

const router = express.Router();

router.post("/login", loginUser); // Make sure loginUser is defined

module.exports = router;
