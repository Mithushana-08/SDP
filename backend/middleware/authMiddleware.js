const jwt = require("jsonwebtoken");
require("dotenv").config(); // To load environment variables

const secretKey = process.env.JWT_SECRET_KEY;

// Middleware to authenticate the user using JWT
const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // If no token is provided, return an error
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization token is required" });
    }

    // Extract token from Authorization header
    const token = authHeader.split(" ")[1];

    // Verify the token using the secret key
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }

        // Attach user info to the request object (decoded from the token)
        req.user = decoded;

        next(); // Proceed to the next middleware or route handler
    });
};

module.exports = authenticateUser;
