const db = require("../config/db");
const multer = require('multer');
const path = require('path');

// Multer configuration for user profile image upload
const userStorage = multer.diskStorage({
    destination: './uploads/users/',
    filename: (req, file, cb) => {
        cb(null, 'profile-' + Date.now() + path.extname(file.originalname));
    }
});
const userUpload = multer({ storage: userStorage });

// Fetch user profile details
const getUserProfile = (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT id, username, role, phone, lane1, lane2, city, email, profile_image
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

// Update user profile details (with image upload)
const updateUserProfile = (req, res) => {
    const userId = req.user.id;
    const { username, phone, lane1, lane2, city, email } = req.body;
    let profileImage = req.file ? `/uploads/users/${req.file.filename}` : req.body.existingImage;

    // Build dynamic query based on provided fields
    const fields = [];
    const values = [];

    if (username) {
        fields.push("username = ?");
        values.push(username);
    }
    if (phone) {
        fields.push("phone = ?");
        values.push(phone);
    }
    if (lane1) {
        fields.push("lane1 = ?");
        values.push(lane1);
    }
    if (lane2 !== undefined) { // Allow empty string for lane2
        fields.push("lane2 = ?");
        values.push(lane2);
    }
    if (city) {
        fields.push("city = ?");
        values.push(city);
    }
    if (email) {
        fields.push("email = ?");
        values.push(email);
    }
    if (profileImage) {
        fields.push("profile_image = ?");
        values.push(profileImage);
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: "At least one field must be provided for update." });
    }

    const query = `
        UPDATE users
        SET ${fields.join(", ")}
        WHERE id = ?
    `;

    values.push(userId);

    db.query(query, values, (err, results) => {
        if (err) {
            console.error("Error updating user profile:", err);
            return res.status(500).json({ error: "Failed to update user profile" });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Profile updated successfully", profileImage });
    });
};

// Update user password
const updateUserPassword = (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    const getPasswordQuery = `
        SELECT password
        FROM users
        WHERE id = ?
    `;

    db.query(getPasswordQuery, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching current password:", err);
            return res.status(500).json({ error: "Failed to fetch current password" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const storedPassword = results[0].password;

        if (storedPassword !== currentPassword) {
            return res.status(400).json({ error: "Current password is incorrect." });
        }

        const updatePasswordQuery = `
            UPDATE users
            SET password = ?
            WHERE id = ?
        `;

        db.query(updatePasswordQuery, [newPassword, userId], (err) => {
            if (err) {
                console.error("Error updating password:", err);
                return res.status(500).json({ error: "Failed to update password" });
            }

            res.status(200).json({ message: "Password updated successfully!" });
        });
    });
};

module.exports = { getUserProfile, updateUserProfile, updateUserPassword, userUpload };