// controllers/userController.js

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

module.exports = {
  getUsers,  // Make sure this is exported
};
