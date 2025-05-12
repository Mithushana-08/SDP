const db = require('../config/db');

const getInventoryReport = (req, res) => {
    const { startDate, endDate } = req.query;

    // Validate date inputs
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
    }

    // Ensure endDate is not before startDate
    if (end < start) {
        return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    const query = `
        SELECT 
            pm.product_id,
            pm.product_name,
            c.CategoryName AS category_name,
            pm.base_price,
            SUM(COALESCE(i.stock_qty, 0)) AS stock_qty,
            pm.created_at AS last_updated
        FROM 
            product_master pm
        JOIN 
            Categories c ON pm.category_id = c.CategoryID
        LEFT JOIN 
            inventory i ON pm.product_id = i.product_id
        WHERE 
            pm.created_at BETWEEN ? AND ?
        GROUP BY 
            pm.product_id, pm.product_name, c.CategoryName, pm.base_price, pm.created_at
        ORDER BY 
            pm.created_at DESC
    `;

    // Add one day to endDate to include records from the entire end date
    const endDateWithTime = new Date(end);
    endDateWithTime.setDate(endDateWithTime.getDate() + 1);

    db.query(query, [startDate, endDateWithTime.toISOString().split('T')[0]], (err, results) => {
        if (err) {
            console.error('Error fetching inventory report:', err);
            return res.status(500).json({ error: 'Database query error' });
        }

        // Format results to match frontend expectations
        const inventoryData = results.map(row => ({
            product_id: row.product_id,
            product_name: row.product_name,
            category_name: row.category_name || 'Uncategorized',
            base_price: parseFloat(row.base_price) || 0,
            stock_qty: parseInt(row.stock_qty) || 0,
            last_updated: row.last_updated ? row.last_updated.toISOString() : new Date().toISOString(),
        }));

        res.json(inventoryData);
    });
};

module.exports = { getInventoryReport };