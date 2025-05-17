const express = require("express");
const { loginUser, logoutUser } = require("../controllers/authController");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

// Login route (public)
router.post("/login", loginUser);

// User profile route (protected)
router.get("/user-profile", authenticateUser, (req, res) => {
    const sql = "SELECT * FROM users WHERE id = ?";
    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error("Database Query Error: ", err);
            return res.status(500).json({ message: "Database error", error: err.message });
        }
        
        if (results.length > 0) {
            res.json({ user: results[0] });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    });
});

// Protected route for testing
router.get("/protected", authenticateUser, (req, res) => {
    res.json({ message: "This is a protected route", userId: req.user.id, role: req.user.role });
});

// Logout route (protected)
router.post("/logout", authenticateUser, logoutUser);

module.exports = router;