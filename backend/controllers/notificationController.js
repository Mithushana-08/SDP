// backend/controllers/notificationController.js
const db = require('../config/db');

// Get low stock or out of stock notifications
const getStockNotifications = (req, res) => {
    // Only allow for admin role
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admins only' });
    }
    // Set thresholds
    const lowStockThreshold = 10;
    const query = `
        SELECT pm.product_id, pm.product_name, 
            SUM(COALESCE(i.stock_qty, 0)) AS total_stock_qty
        FROM product_master pm
        LEFT JOIN inventory i ON pm.product_id = i.product_id
        WHERE pm.product_status = 'active'
        GROUP BY pm.product_id, pm.product_name
        HAVING total_stock_qty = 0 OR (total_stock_qty > 0 AND total_stock_qty < ?)
        ORDER BY total_stock_qty ASC
    `;
    db.query(query, [lowStockThreshold], (err, results) => {
        if (err) {
            console.error('Error fetching stock notifications:', err);
            return res.status(500).json({ error: 'Database query error' });
        }
        // Map to match frontend expectations
        const mapped = results.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            stock_qty: item.total_stock_qty
        }));
        res.json(mapped);
    });
};

module.exports = { getStockNotifications };
