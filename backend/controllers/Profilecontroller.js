const db = require("../config/db");

const getUserProfile = (req, res) => {
    // The `req.user` object is populated by the `authMiddleware`
    const userId = req.user.id;

    const query = `
        SELECT id, username, role, phone, address
        FROM users
        WHERE id = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching user profile:", err);
            return res.status(500).json({ error: "Failed to fetch user profile" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(results[0]);
    });
};

module.exports = { getUserProfile };