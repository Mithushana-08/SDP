// filepath: /D:/crafttary/SDP/backend/controllers/authController.js
const db = require("../config/db");
const jwt = require("jsonwebtoken"); // Import the JWT library
require('dotenv').config(); // Load environment variables
const secretKey = process.env.JWT_SECRET_KEY;

const loginUser = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

    db.query(sql, [username, password], (err, results) => {
        if (err) {
            console.error("Database Query Error: ", err);
            return res.status(500).json({ message: "Database error", error: err.message });
        }

        if (results.length > 0) {
            // User found, generate JWT token
            const user = results[0];
            const token = jwt.sign({ id: user.id, role: user.role }, secretKey, { expiresIn: '1h' });

            // Respond with token and user info
            res.json({ message: "Login successful", token, user });
        } else {
            res.status(401).json({ message: "Invalid username or password" });
        }
    });
};

module.exports = { loginUser };