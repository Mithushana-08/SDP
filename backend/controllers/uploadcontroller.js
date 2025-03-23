const db = require("../config/db");

// Fetch all uploads
const getAllUploads = (req, res) => {
    const query = `
        SELECT w.work_id, p.product_name, w.quantity, w.status, c.CategoryName, c.CategoryID
        FROM work_upload w
        JOIN product_master p ON w.product_id = p.product_id
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

// Fetch all uploads with additional details for admin
const getAllUploadsForAdmin = (req, res) => {
    const query = `
        SELECT w.work_id, p.product_name, w.quantity, w.status, p.base_price AS price, 
               u.username AS crafter, c.CategoryName 
        FROM work_upload w
        JOIN product_master p ON w.product_id = p.product_id
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

// Fetch all products
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
        res.json(results);
    });
};

// Add a new upload
const addUpload = (req, res) => {
    const { product_id, category_id, quantity, crafter_id } = req.body;

    console.log("Received data:", req.body); // Log the received data

    if (!product_id || !category_id || !quantity || !crafter_id) {
        console.error("Missing required fields:", { product_id, category_id, quantity, crafter_id });
        return res.status(400).json({ message: "All fields are required" });
    }

    const query = `
        INSERT INTO work_upload (product_id, category_id, quantity, crafter_id)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [product_id, category_id, quantity, crafter_id], (err, result) => {
        if (err) {
            console.error("Error adding upload:", err);
            return res.status(500).json({ message: "Internal server error", error: err.message });
        }
        console.log("Upload added successfully:", result);
        res.status(201).json({ message: "Upload added successfully", work_id: result.insertId });
    });
};

// Update an existing upload
const updateUpload = (req, res) => {
    const { product_id, category_id, quantity, crafter_id } = req.body;
    const { id } = req.params;

    if (!product_id || !category_id || !quantity || !crafter_id) {
        console.error("Missing required fields:", { product_id, category_id, quantity, crafter_id });
        return res.status(400).json({ message: "All fields are required" });
    }

    const query = `
        UPDATE work_upload
        SET product_id = ?, category_id = ?, quantity = ?, crafter_id = ?
        WHERE work_id = ?
    `;

    db.query(query, [product_id, category_id, quantity, crafter_id, id], (err, result) => {
        if (err) {
            console.error("Error updating upload:", err);
            return res.status(500).json({ message: "Internal server error", error: err.message });
        }
        console.log("Upload updated successfully:", result);
        res.status(200).json({ message: "Upload updated successfully" });
    });
};

// Delete an upload
const deleteUpload = (req, res) => {
    const { id } = req.params;

    const query = `
        DELETE FROM work_upload
        WHERE work_id = ?
    `;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error("Error deleting upload:", err);
            return res.status(500).json({ message: "Internal server error", error: err.message });
        }
        console.log("Upload deleted successfully:", result);
        res.status(200).json({ message: "Upload deleted successfully" });
    });
};

module.exports = {
    getAllUploads,
    getAllUploadsForAdmin,
    getAllProducts,
    addUpload,
    updateUpload,
    deleteUpload
};