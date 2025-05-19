const db = require("../config/db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("../utils/nodemailer"); // Import nodemailer
require("dotenv").config();

const secretKey = process.env.JWT_SECRET_KEY;

// Function to generate a unique JWT token for the user
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,
            sessionId: crypto.randomUUID(),
        },
        secretKey,
        { expiresIn: "5h" }
    );
};

// Generate a random 6-digit code
const generateResetCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Forgot Password - Send reset code
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        // Check if user exists
        const userQuery = "SELECT * FROM users WHERE email = ?";
        const userResults = await db.query(userQuery, [email]);

        if (userResults.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userResults[0];
        const resetCode = generateResetCode();
        const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

        // Store reset code in the database
        const storeCodeQuery = "INSERT INTO password_resets (user_id, reset_code, expiry) VALUES (?, ?, ?)";
        await db.query(storeCodeQuery, [user.id, resetCode, resetCodeExpiry]);

        // Send email with reset code
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Crafttary Password Reset Code",
            text: `Your password reset code is: ${resetCode}. It is valid for 15 minutes.`,
        };

        await nodemailer.sendMail(mailOptions);

        res.json({ message: "Reset code sent to your email" });
    } catch (err) {
        console.error("Error in forgotPassword:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Verify Reset Code
const verifyResetCode = async (req, res) => {
    const { email, resetCode } = req.body;

    if (!email || !resetCode) {
        return res.status(400).json({ message: "Email and reset code are required" });
    }

    try {
        const query = "SELECT * FROM password_resets WHERE reset_code = ? AND expiry > NOW()";
        const results = await db.query(query, [resetCode]);

        if (results.length === 0) {
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }

        const resetEntry = results[0];
        const userQuery = "SELECT * FROM users WHERE id = ? AND email = ?";
        const userResults = await db.query(userQuery, [resetEntry.user_id, email]);

        if (userResults.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Reset code verified" });
    } catch (err) {
        console.error("Error in verifyResetCode:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    const { email, resetCode, newPassword, confirmPassword } = req.body;

    if (!email || !resetCode || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
        const query = "SELECT * FROM password_resets WHERE reset_code = ? AND expiry > NOW()";
        const results = await db.query(query, [resetCode]);

        if (results.length === 0) {
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }

        const resetEntry = results[0];
        const userQuery = "SELECT * FROM users WHERE id = ? AND email = ?";
        const userResults = await db.query(userQuery, [resetEntry.user_id, email]);

        if (userResults.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update password
        const updateQuery = "UPDATE users SET password = ? WHERE id = ?";
        await db.query(updateQuery, [newPassword, resetEntry.user_id]);

        // Delete used reset code
        const deleteQuery = "DELETE FROM password_resets WHERE reset_code = ?";
        await db.query(deleteQuery, [resetCode]);

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error("Error in resetPassword:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
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
            const user = results[0];
            const token = generateToken(user);
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

    const expiry = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const sql = "INSERT INTO token_blacklist (token, expiry) VALUES (?, ?)";
    db.query(sql, [token, expiry], (err) => {
        if (err) {
            console.error("Error blacklisting token:", err);
            return res.status(500).json({ message: "Database error", error: err.message });
        }
        res.json({ message: "Logout successful" });
    });
};

module.exports = { loginUser, logoutUser, forgotPassword, verifyResetCode, resetPassword };