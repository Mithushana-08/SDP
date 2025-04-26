const db = require("../config/db");

// Fetch all orders with details
const getOrdersWithDetails = (req, res) => {
    const query = `
        SELECT 
            o.order_id, o.order_date, o.total_amount, o.status, o.shipping_address,
            c.username AS customer_name, c.phone AS customer_phone,
            COUNT(oi.item_id) AS product_count,
            SUM(CASE WHEN cd.customization_id IS NOT NULL THEN 1 ELSE 0 END) AS customizable_count
        FROM orders o
        JOIN customer c ON o.customer_id = c.customer_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN customization_details cd ON oi.item_id = cd.item_id
        GROUP BY o.order_id
        ORDER BY o.order_date DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching orders:", err);
            return res.status(500).json({ error: "Failed to fetch orders" });
        }
        res.json(results);
    });
};

// Fetch details of a specific order
const getOrderDetails = (req, res) => {
    const { orderId } = req.params;

    const query = `
        SELECT 
                oi.item_id,oi.product_id,oi.quantity,oi.price,oi.total_price,p.product_name,oi.status,
                c.CategoryName AS category_name,cd.customization_type,cd.customization_value,cd.uploaded_image,cd.size_type,
                u.username AS crafter_username, -- added line
                SUM(CASE WHEN cd.customization_id IS NOT NULL THEN 1 ELSE 0 END) AS customizable_count
        FROM order_items oi
        JOIN product_master p ON oi.product_id = p.product_id
        JOIN Categories c ON p.category_id = c.CategoryID
        LEFT JOIN customization_details cd ON oi.item_id = cd.item_id
        LEFT JOIN users u ON oi.crafter_id = u.id -- added join
        WHERE oi.order_id = ?
        GROUP BY 
              oi.item_id, oi.product_id, oi.quantity, oi.price, oi.total_price, 
              p.product_name, c.CategoryName, 
              cd.customization_type, cd.customization_value, cd.uploaded_image, cd.size_type,
              u.username; -- added u.username in GROUP BY

    
`

    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error("Error fetching order details:", err);
            return res.status(500).json({ error: "Failed to fetch order details" });
        }
        res.json(results);
    });
};

const getCrafters = (req, res) => {
    const query = `
        SELECT id, username AS crafter_name
        FROM users
        WHERE role = 'crafter'; -- Assuming 'role' column identifies crafters
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching crafters:", err);
            return res.status(500).json({ error: "Failed to fetch crafters" });
        }
        res.json(results);
    });
};

const assignCrafter = (req, res) => {
    const { item_id, crafter_id } = req.body;

    const query = `
        UPDATE order_items
        SET crafter_id = ?
        WHERE item_id = ?
    `;

    db.query(query, [crafter_id, item_id], (err, result) => {
        if (err) {
            console.error("Error assigning crafter:", err);
            return res.status(500).json({ error: "Failed to assign crafter" });
        }

        res.status(200).json({ message: "Crafter assigned successfully" });
    });
};


module.exports = {
    getOrdersWithDetails,
    getOrderDetails,
    getCrafters, 
    assignCrafter,// Export the new function
};

