const db = require("../config/db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // For generating unique session IDs
require("dotenv").config(); // To load environment variables

const secretKey = process.env.JWT_SECRET_KEY;

// Function to generate a unique JWT token for the user
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,            // User ID
            role: user.role,        // User role
            sessionId: crypto.randomUUID(),  // Unique session ID
        },
        secretKey,                    // Secret key for signing the token
        { expiresIn: "5h" }           // Token expiry time
    );
};

// Login function to authenticate user and return the token
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
            const token = generateToken(user);

            // Respond with token and user info
            res.json({ message: "Login successful", token, user });
        } else {
            res.status(401).json({ message: "Invalid username or password" });
        }
    });
};

const logoutUser = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(400).json({ message: "No token provided" });
    }

    // Calculate token expiry (5 hours from now)
    const expiry = new Date(Date.now() + 5 * 60 * 60 * 1000);

    // Add token to blacklist
    const sql = "INSERT INTO token_blacklist (token, expiry) VALUES (?, ?)";
    db.query(sql, [token, expiry], (err) => {
        if (err) {
            console.error("Error blacklisting token:", err);
            return res.status(500).json({ message: "Database error", error: err.message });
        }
        res.json({ message: "Logout successful" });
    });
};

module.exports = { loginUser , logoutUser };
