const db = require("../config/db");

const loginUser = (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

    db.query(sql, [username, password], (err, results) => {
        if (err) {
            console.error("Database Query Error: ", err);  // Log the actual error
            return res.status(500).json({ message: "Database error", error: err.message });
        }

        if (results.length > 0) {
            res.json({ message: "Login successful", user: results[0] });
        } else {
            res.status(401).json({ message: "Invalid username or password" });
        }
    });
};

module.exports = { loginUser };
