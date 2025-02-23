const db = require('../config/db');

const getCategories = (req, res) => {
    const query = 'SELECT * FROM Categories';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).json({ error: 'Failed to fetch categories' });
            return;
        }
        res.json(results);
    });
};

const addCategory = (req, res) => {
    const { CategoryID, CategoryName, Description } = req.body;

    if (!CategoryID || !CategoryName || !Description) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const sql = "INSERT INTO Categories (CategoryID, CategoryName, Description) VALUES (?, ?, ?)";
    db.query(sql, [CategoryID, CategoryName, Description], (err, result) => {
        if (err) {
            console.error("Error inserting category:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(201).json({ id: result.insertId, CategoryID, CategoryName, Description });
    });
};

const updateCategory = (req, res) => {
    const { CategoryID } = req.params;
    const { CategoryName, Description } = req.body;

    if (!CategoryName || !Description) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const sql = "UPDATE Categories SET CategoryName = ?, Description = ? WHERE CategoryID = ?";
    db.query(sql, [CategoryName, Description, CategoryID], (err, result) => {
        if (err) {
            console.error("Error updating category:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(200).json({ CategoryID, CategoryName, Description });
    });
};

const deleteCategory = (req, res) => {
    const { CategoryID } = req.params;

    const sql = "DELETE FROM Categories WHERE CategoryID = ?";
    db.query(sql, [CategoryID], (err, result) => {
        if (err) {
            console.error("Error deleting category:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(200).json({ message: "Category deleted successfully" });
    });
};

module.exports = {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory
};