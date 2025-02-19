const db = require('../config/db');

const getUsers = (req, res) => {
  const sql = "SELECT id, username, role FROM users";
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    res.json(results);
  });
};

module.exports = { getUsers };
