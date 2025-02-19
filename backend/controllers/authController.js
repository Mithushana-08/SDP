const db = require('../config/db');
const jwt = require('jsonwebtoken');

const loginUser = (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ error: "User not found" });

    const user = results[0];

    // Simple password check (use bcrypt for better security)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, 'secretkey', { expiresIn: '1h' });

    res.json({ message: "Login successful", token, role: user.role });
  });
};

module.exports = { loginUser };
