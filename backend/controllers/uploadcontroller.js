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



module.exports = {
    getAllUploads,
    getAllUploadsForAdmin,  // Admin page fetch
    
};



