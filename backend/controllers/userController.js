const db = require('../config/db');
const transporter = require('../utils/nodemailer'); // Add this line

// Function to get all users (exclude password)
const getUsers = (req, res) => {
    const sql = "SELECT id, username, email, role, phone, lane1, lane2, city, status FROM users";
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
        // Send email to the new user with their credentials
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Crafttary Account Credentials',
            html: `<p>Hello <b>${username}</b>,</p>
                   <p>Your account has been created for Crafttary Admin Panel.</p>
                   <p><b>Username:</b> ${username}<br/>
                   <b>Password:</b> ${password}</p>
                   <p>Please login and change your password after first login.</p>
                   <p>Thank you!</p>`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                // Still return success for user creation, but notify about email failure
                return res.status(201).json({ message: "User added successfully, but email could not be sent." });
            }
            res.status(201).json({ message: "User added successfully! Email sent." });
        });
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

// Function to soft delete (terminate) a user by setting status to 'non-active'
const terminateUser = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ error: "Status is required." });
    }
    const sql = "UPDATE users SET status = ? WHERE id = ?";
    db.query(sql, [status, id], (err, result) => {
        if (err) {
            console.error("Error updating user status:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ message: `User status updated to ${status}` });
    });
};

module.exports = { getUsers, getCrafters, addUser, updateUser, terminateUser };