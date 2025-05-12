const db = require("../config/db");

const getUserProfile = (req, res) => {
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

const updateUserProfile = (req, res) => {
    const userId = req.user.id;
    const { username, phone, address } = req.body;

    const query = `
        UPDATE users
        SET username = ?, phone = ?, address = ?
        WHERE id = ?
    `;

    db.query(query, [username, phone, address, userId], (err, results) => {
        if (err) {
            console.error("Error updating user profile:", err);
            return res.status(500).json({ error: "Failed to update user profile" });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Profile updated successfully" });
    });
};

module.exports = { getUserProfile, updateUserProfile };