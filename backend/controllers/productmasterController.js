const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Set up storage engine
const storage = multer.diskStorage({
    destination: './uploads/',  // Store images in an "uploads" folder
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const getProducts = (req, res) => {
    const query = `
        SELECT 
            pm.product_id,
            pm.product_name,
            c.CategoryName AS category_name,
            c.CategoryID AS category_id,
            pm.base_price,
            pm.customizable,
            pm.description,
            pm.image,
            pm.status
        FROM 
            product_master pm
        JOIN 
            Categories c ON pm.category_id = c.CategoryID
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching product data:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
};

const addProduct = (req, res) => {
    const { product_name, category_id, base_price, customizable, description, status } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    // Convert customizable to boolean
    const isCustomizable = customizable === 'true' || customizable === true || customizable === '1' || customizable === 1 ? 1 : 0;

    const query = `
        INSERT INTO product_master (product_name, category_id, base_price, customizable, description, image, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [product_name, category_id, base_price, isCustomizable, description, imagePath, status], (error, results) => {
        if (error) {
            console.error('Error inserting product:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json({ message: 'Product added successfully', productId: results.insertId });
    });
};


const deleteProduct = (req, res) => {
    const productId = req.params.id;

    const query = `DELETE FROM product_master WHERE product_id = ?`;

    db.query(query, [productId], (error, results) => {
        if (error) {
            console.error('Error deleting product:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    });
};

const getCategories = (req, res) => {
    const query = `SELECT CategoryID AS category_id, CategoryName AS category_name FROM Categories`;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching categories:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
};

module.exports = { getProducts, addProduct, deleteProduct, getCategories, upload };



