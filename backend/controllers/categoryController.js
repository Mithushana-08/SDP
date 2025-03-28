const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Multer Storage Configuration for Image Uploads
const storage = multer.diskStorage({
    destination: './uploads/categories/', // Store category images in a separate folder
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Get all categories
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

// Add a new category with image upload
const addCategory = (req, res) => {
    const { CategoryName, Description } = req.body;
    const image = req.file ? `/uploads/categories/${req.file.filename}` : null;

    if (!CategoryName || !Description) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const sql = "INSERT INTO Categories (CategoryName, Description, CategoryImage) VALUES (?, ?, ?)";
    db.query(sql, [CategoryName, Description, image], (err, result) => {
        if (err) {
            console.error("Error inserting category:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(201).json({ message: "Category added successfully", categoryId: result.insertId });
    });
};

// Update a category with image upload
const updateCategory = (req, res) => {
    const { CategoryID } = req.params;
    const { CategoryName, Description } = req.body;
    const image = req.file ? `/uploads/categories/${req.file.filename}` : req.body.existingImage;

    if (!CategoryName || !Description) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const sql = "UPDATE Categories SET CategoryName = ?, Description = ?, CategoryImage = ? WHERE CategoryID = ?";
    db.query(sql, [CategoryName, Description, image, CategoryID], (err, result) => {
        if (err) {
            console.error("Error updating category:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.status(200).json({ message: "Category updated successfully" });
    });
};

// Delete a category
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
    deleteCategory,
    upload
};