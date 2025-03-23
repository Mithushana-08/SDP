const mysql = require('mysql');
const util = require('util');

const db = mysql.createConnection({
  host: 'localhost',  // Use your database host (default: localhost)
  user: 'root',       // Your MySQL username
  password: '123456', // Your MySQL password (leave empty if none)
  database: 'crafttary' // Your database name
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.message);
    return;
  }
  console.log("Connected to MySQL Database!");
});

// Promisify the query method
db.query = util.promisify(db.query);

module.exports = db;