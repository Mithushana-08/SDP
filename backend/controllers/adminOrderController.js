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
            oi.item_id, oi.product_id, oi.quantity, oi.price, oi.total_price,
            p.product_name, c.CategoryName AS category_name,
            cd.customization_type, cd.customization_value, cd.uploaded_image, cd.size_type
        FROM order_items oi
        JOIN product_master p ON oi.product_id = p.product_id
        JOIN Categories c ON p.category_id = c.CategoryID
        LEFT JOIN customization_details cd ON oi.item_id = cd.item_id
        WHERE oi.order_id = ?;
    `;

    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error("Error fetching order details:", err);
            return res.status(500).json({ error: "Failed to fetch order details" });
        }
        res.json(results);
    });
};

module.exports = {
    getOrdersWithDetails,
    getOrderDetails,
};