const jwt = require("jsonwebtoken");
const db = require("../config/db");
const secretKey = process.env.JWT_SECRET_KEY;

const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    // Check if token is blacklisted
    const sql = "SELECT token FROM token_blacklist WHERE token = ?";
    db.query(sql, [token], (err, results) => {
        if (err) {
            console.error("Error checking blacklist:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length > 0) {
            return res.status(401).json({ message: "Token is invalid" });
        }

        // Verify token
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Invalid token" });
            }
            req.user = decoded;
            next();
        });
    });
};

module.exports = authenticateUser;