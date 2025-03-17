const jwt = require("jsonwebtoken");
require('dotenv').config(); // Load environment variables
const secretKey = process.env.JWT_SECRET_KEY;

const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Get token from Authorization header

    if (!token) {
        return res.status(401).json({ message: "Authorization token is required" });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }

        // Attach the userId to the request object
        req.id = decoded.id;
        req.role = decoded.role;

        next(); // Continue to the next middleware or route handler
    });
};

module.exports = authenticateUser;