const db = require('../config/db');

// Get notifications for crafters: new order assignments from order_items
const getCrafterNotifications = (req, res) => {
    if (!req.user || req.user.role !== 'crafter') {
        return res.status(403).json({ error: 'Access denied: Crafters only' });
    }
    const crafterId = req.user.id;
    const query = `
        SELECT oi.item_id, oi.order_id, oi.product_id, oi.status, oi.quantity, oi.price, oi.total_price, oi.crafter_id, o.order_date, p.product_name
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        JOIN product_master p ON oi.product_id = p.product_id
        WHERE oi.crafter_id = ? 
        ORDER BY o.order_date DESC
    `;
    db.query(query, [crafterId], (err, results) => {
        if (err) {
            console.error('Error fetching crafter notifications:', err);
            return res.status(500).json({ error: 'Database query error' });
        }
        const mapped = results.map(item => ({
            item_id: item.item_id,
            order_id: item.order_id,
            product_id: item.product_id,
            product_name: item.product_name,
            status: item.status,
            quantity: item.quantity,
            price: item.price,
            total_price: item.total_price,
            order_date: item.order_date
        }));
        res.json(mapped);
    });
};

module.exports = { getCrafterNotifications };
