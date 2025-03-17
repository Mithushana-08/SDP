const db = require("../config/db");

const getAllUploads = (req, res) => {
    const query = `
        SELECT w.work_id, w.product_name, w.quantity, w.status, c.CategoryName
        FROM work_upload w
        JOIN Categories c ON w.category_id = c.CategoryID
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching uploads:", err);
            res.status(500).json({ message: "Internal server error", error: err.message });
        } else {
            res.json(results);
        }
    });
};

const getAllUploadsForAdmin = (req, res) => {
    const query = `
        SELECT w.work_id, w.product_name, w.quantity, w.status, w.price, 
               u.username AS crafter, c.CategoryName 
        FROM work_upload w
        JOIN Categories c ON w.category_id = c.CategoryID
        JOIN users u ON w.crafter_id = u.id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching admin uploads:", err);
            return res.status(500).json({ message: "Internal server error", error: err.message });
        }
        res.json(results);
    });
};

const getAllProducts = (req, res) => {
    const query = `
        SELECT p.product_id, p.product_name, p.category_id, c.CategoryName, 
               p.customizable, p.base_price
        FROM product_master p
        JOIN Categories c ON p.category_id = c.CategoryID
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching products:", err);
            return res.status(500).json({ message: "Internal server error", error: err.message });
        }
        res.json(results); // Send product data including CategoryName
    });
};

const addUpload = (req, res) => {
    const { product_id, product_name, category_id, quantity, crafter_id, customizable } = req.body;

    console.log("Received data:", req.body); // Log the received data

    if (!product_id || !product_name || !category_id || !quantity || !crafter_id || !customizable) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const query = `
        INSERT INTO work_upload (product_id, product_name, category_id, quantity, crafter_id, customizable)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [product_id, product_name, category_id, quantity, crafter_id, customizable], (err, result) => {
        if (err) {
            console.error("Error adding upload:", err);
            return res.status(500).json({ message: "Internal server error", error: err.message });
        }
        res.status(201).json({ message: "Upload added successfully", work_id: result.insertId });
    });
};

module.exports = {
    getAllUploads,
    getAllUploadsForAdmin,
    getAllProducts,
    addUpload,
};