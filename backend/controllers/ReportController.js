const db = require('../config/db');

// Get Inventory Report
const getInventoryReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Initialize query and parameters
        let query = `
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
        `;
        const params = [];

        // Add date filter only if both dates are provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }
            if (end < start) {
                return res.status(400).json({ error: 'End date cannot be before start date' });
            }
            const endDateWithTime = new Date(end);
            endDateWithTime.setDate(endDateWithTime.getDate() + 1);
            query += ` WHERE pm.created_at BETWEEN ? AND ?`;
            params.push(startDate, endDateWithTime.toISOString().split('T')[0]);
        }

        query += `
            GROUP BY 
                pm.product_id, pm.product_name, c.CategoryName, pm.base_price, pm.created_at
            ORDER BY 
                pm.created_at DESC
        `;

        // Execute query
        db.query(query, params, (err, results) => {
            if (err) {
                console.error('Error fetching inventory report:', err);
                return res.status(500).json({ error: 'Database query error' });
            }

            // Format response
            const inventoryData = results.map(row => ({
                product_id: row.product_id,
                product_name: row.product_name,
                category_name: row.category_name || 'Uncategorized',
                base_price: parseFloat(row.base_price) || 0,
                stock_qty: parseInt(row.stock_qty) || 0,
                last_updated: row.last_updated ? row.last_updated.toISOString() : new Date().toISOString(),
            }));

            res.status(200).json(inventoryData);
        });
    } catch (error) {
        console.error('Error in getInventoryReport:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Orders Report
const getOrdersReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Initialize queries and parameters
        let ordersQuery = `
            SELECT 
                o.order_id,
                o.order_date,
                o.total_amount,
                o.status,
                o.shipping_address
            FROM 
                orders o
        `;
        let orderItemsQuery = `
            SELECT 
                pm.product_id,
                pm.product_name,
                c.CategoryName AS category_name,
                COALESCE(SUM(oi.quantity), 0) AS total_quantity,
                COALESCE(SUM(oi.total_price), 0) AS total_sales
            FROM 
                product_master pm
            LEFT JOIN 
                Categories c ON pm.category_id = c.CategoryID
            LEFT JOIN 
                order_items oi ON pm.product_id = oi.product_id
            LEFT JOIN 
                orders o ON oi.order_id = o.order_id
        `;
        let customizationsQuery = `
            SELECT 
                cd.customization_type,
                cd.customization_value,
                cd.size_type,
                COUNT(*) AS customization_count
            FROM 
                customization_details cd
            JOIN 
                order_items oi ON cd.item_id = oi.item_id
            JOIN 
                orders o ON oi.order_id = o.order_id
        `;
        const paramsOrders = [];
        const paramsItems = [];
        const paramsCustomizations = [];

        // Add date filter only if both dates are provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }
            if (end < start) {
                return res.status(400).json({ error: 'End date cannot be before start date' });
            }
            const endDateWithTime = new Date(end);
            endDateWithTime.setDate(endDateWithTime.getDate() + 1);
            ordersQuery += ` WHERE o.order_date BETWEEN ? AND ?`;
            orderItemsQuery += ` AND o.order_date BETWEEN ? AND ?`;
            customizationsQuery += ` WHERE o.order_date BETWEEN ? AND ?`;
            const endDateStr = endDateWithTime.toISOString().split('T')[0];
            paramsOrders.push(startDate, endDateStr);
            paramsItems.push(startDate, endDateStr);
            paramsCustomizations.push(startDate, endDateStr);
        }

        ordersQuery += ` ORDER BY o.order_date DESC`;
        orderItemsQuery += `
            GROUP BY 
                pm.product_id, pm.product_name, c.CategoryName
            ORDER BY 
                total_quantity DESC
        `;
        customizationsQuery += `
            GROUP BY 
                cd.customization_type, cd.customization_value, cd.size_type
            ORDER BY 
                customization_count DESC
            LIMIT 10
        `;

        // Execute queries sequentially using promises
        const [ordersResults] = await new Promise((resolve, reject) => {
            db.query(ordersQuery, paramsOrders, (err, results) => {
                if (err) reject(err);
                else resolve([results]);
            });
        });

        const [itemsResults] = await new Promise((resolve, reject) => {
            db.query(orderItemsQuery, paramsItems, (err, results) => {
                if (err) reject(err);
                else resolve([results]);
            });
        });

        const [customizationsResults] = await new Promise((resolve, reject) => {
            db.query(customizationsQuery, paramsCustomizations, (err, results) => {
                if (err) reject(err);
                else resolve([results]);
            });
        });

        // Calculate summary metrics
        const totalOrders = ordersResults.length;
        const confirmedOrders = ordersResults.filter(o => o.status === 'confirmed').length;
        const readyToDeliverOrders = ordersResults.filter(o => o.status === 'ready to deliver').length;
        const totalEarnings = ordersResults.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

        // Determine fast-moving and slow-moving items
        const sortedItemsDesc = [...itemsResults].sort((a, b) => b.total_quantity - a.total_quantity);
        const sortedItemsAsc = [...itemsResults].sort((a, b) => a.total_quantity - b.total_quantity);
        const fastMovingItems = sortedItemsDesc.slice(0, Math.min(5, sortedItemsDesc.length));
        const slowMovingItems = sortedItemsAsc.slice(0, Math.min(5, sortedItemsAsc.length));

        // Format response
        const reportData = {
            orders: ordersResults.map(row => ({
                order_id: row.order_id,
                order_date: row.order_date.toISOString(),
                total_amount: parseFloat(row.total_amount),
                status: row.status,
                shipping_address: row.shipping_address
            })),
            orderItems: itemsResults.map(row => ({
                product_id: row.product_id,
                product_name: row.product_name,
                category_name: row.category_name || 'Uncategorized',
                total_quantity: parseInt(row.total_quantity) || 0,
                total_sales: parseFloat(row.total_sales) || 0
            })),
            customizations: customizationsResults.map(row => ({
                customization_type: row.customization_type,
                customization_value: row.customization_value || row.size_type || 'N/A',
                customization_count: parseInt(row.customization_count)
            })),
            summary: {
                totalOrders,
                confirmedOrders,
                readyToDeliverOrders,
                totalEarnings: parseFloat(totalEarnings.toFixed(2)),
                fastMovingItems: fastMovingItems.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    category_name: item.category_name || 'Uncategorized',
                    total_quantity: parseInt(item.total_quantity)
                })),
                slowMovingItems: slowMovingItems.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    category_name: item.category_name || 'Uncategorized',
                    total_quantity: parseInt(item.total_quantity)
                })),
                noFastMovingMessage: fastMovingItems.every(item => item.total_quantity === 0) ? 'No products with sales in this period' : undefined
            }
        };

        res.status(200).json(reportData);
    } catch (error) {
        console.error('Error in getOrdersReport:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Export both functions
module.exports = { getInventoryReport, getOrdersReport };