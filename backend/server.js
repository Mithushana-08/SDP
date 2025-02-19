require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',  // Change to your MySQL password
  database: 'crafttary'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ error: "User not found" });

    const user = results[0];

    // Plaintext password comparison
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, 'secretkey', { expiresIn: '1h' });
    res.json({ message: "Login successful", token, role: user.role });
  });
});

// Get all users
app.get('/users', (req, res) => {
  const sql = "SELECT id, username, password, role FROM users";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);  // Log the error
      return res.status(500).json({ error: err.message });
    }

    console.log('Query results:', results);  // Log the result for debugging
    res.json(results);
  });
});

// Add a new user
app.post('/users', (req, res) => {
  const { username, password, role } = req.body;
  const sql = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";

  db.query(sql, [username, password, role], (err, result) => {
      if (err) {
          console.error("Error inserting user:", err);
          return res.status(500).json({ error: err.message });
      }
      res.json({ id: result.insertId, username, password, role });
  });
});

// Start server
app.listen(5000, () => {
  console.log('Server running on port 5000');
});