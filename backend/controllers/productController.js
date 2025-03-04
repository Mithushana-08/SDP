const db = require('../config/db');  // Correct path to your DB connection file

const getProducts = (req, res) => {
    const query = `
        SELECT i.product_id, 
               p.product_name, 
               c.CategoryName AS category, 
               i.price, 
               i.stock_qty, 
               i.total_price, 
               u.username AS crafter_name, 
               i.status
        FROM inventory i
        JOIN product_master p ON i.product_id = p.product_id
        JOIN Categories c ON p.category_id = c.CategoryID
        JOIN users u ON i.crafter_id = u.id
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching products:", err);
            return res.status(500).json({ error: "Database query error" });
        }
        res.json(results);  // This returns data to frontend
    });
};

module.exports = { getProducts };
