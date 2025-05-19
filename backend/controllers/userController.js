const db = require('../config/db');

// Function to get all users (exclude password)
const getUsers = (req, res) => {
    const sql = "SELECT id, username, email, role, phone, lane1, lane2, city FROM users";
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};

// Function to get crafters (exclude password)
const getCrafters = (req, res) => {
    const sql = "SELECT id, username, email, role, phone, lane1, lane2, city FROM users WHERE role = 'crafter'";
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
    const { username, password, email, role, phone, lane1, lane2, city } = req.body;

    if (!username || !password || !email || !role || !phone || !lane1 || !city) {
        return res.status(400).json({ error: "Username, password, email, role, phone, lane1, and city are required." });
    }

    const sql = "INSERT INTO users (username, password, email, role, phone, lane1, lane2, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [username, password, email, role, phone, lane1, lane2, city], (err, result) => {
        if (err) {
            console.error("Error inserting user:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(201).json({ message: "User added successfully!" });
    });
};

// Function to update a user (exclude password)
const updateUser = (req, res) => {
    const { id } = req.params;
    const { username, email, role, phone, lane1, lane2, city } = req.body;

    if (!username || !email || !role || !phone || !lane1 || !city) {
        return res.status(400).json({ error: "Username, email, role, phone, lane1, and city are required." });
    }

    const sql = "UPDATE users SET username = ?, email = ?, role = ?, phone = ?, lane1 = ?, lane2 = ?, city = ? WHERE id = ?";
    db.query(sql, [username, email, role, phone, lane1, lane2, city, id], (err, result) => {
        if (err) {
            console.error("Error updating user:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
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
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    });
};

module.exports = { getUsers, getCrafters, addUser, updateUser, deleteUser };