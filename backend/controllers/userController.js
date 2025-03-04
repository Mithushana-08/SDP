const db = require('../config/db');

// Function to get all users
const getUsers = (req, res) => {
    const sql = "SELECT id, username, role, phone, address FROM users";
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};

// Function to add a new user
const addUser = (req, res) => {
    const { id, username, password, role, phone, address } = req.body;

    if (!id || !username || !password || !role || !phone || !address) {
        return res.status(400).json({ error: "All fields are required." });
    }

    const sql = "INSERT INTO users (id, username, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [id, username, password, role, phone, address], (err, result) => {
        if (err) {
            console.error("Error inserting user:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(201).json({ message: "User added successfully!" });
    });
};

// Function to update a user
const updateUser = (req, res) => {
    const { id } = req.params;
    const { username, password, role, phone, address } = req.body;

    const sql = "UPDATE users SET username = ?, password = ?, role = ?, phone = ?, address = ? WHERE id = ?";
    db.query(sql, [username, password, role, phone, address, id], (err, result) => {
        if (err) {
            console.error("Error updating user:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(200).json({ message: "User updated successfully!" });
    });
};

// Function to delete a user
const deleteUser = (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting user:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    });
};

module.exports = { getUsers, addUser, updateUser, deleteUser };
