const db = require('../config/db'); // Assuming you have a db.js file for your DB connection

// Function to get all users
const getUsers = (req, res) => {
  const sql = "SELECT id, username, password, role FROM users";

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
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
  db.query(sql, [username, password, role], (err, result) => {
    if (err) {
      console.error("Error inserting user:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(201).json({ id: result.insertId, username, password, role });
  });
};


// Function to update a user
const updateUser = (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?";
  db.query(sql, [username, password, role, id], (err, result) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json({ id, username, password, role });
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


module.exports = {
  getUsers,
  addUser,
  updateUser,
  deleteUser

};