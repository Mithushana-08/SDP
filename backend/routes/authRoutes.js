const express = require("express");
const { loginUser } = require("../controllers/authController");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginUser); // Public route, no auth middleware needed

// Example protected route
router.get("/user-profile", authenticateUser, (req, res) => {
    // Use req.userId to fetch user data from the database
    const sql = "SELECT * FROM users WHERE id = ?";
    db.query(sql, [req.userId], (err, results) => {
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

// New protected route for testing
router.get("/protected", authenticateUser, (req, res) => {
    res.json({ message: "This is a protected route", userId: req.id, role: req.role });
});

module.exports = router;