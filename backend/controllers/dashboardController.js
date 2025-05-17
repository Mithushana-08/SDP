const db = require('../config/db');

// Get Dashboard Report
const getDashboardReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Initialize queries
        const categoriesQuery = `SELECT COUNT(*) AS totalCategories FROM Categories`;
        const productsQuery = `SELECT COUNT(*) AS totalProducts FROM product_master`;
        const stockQuery = `SELECT COALESCE(SUM(stock_qty), 0) AS totalStock FROM inventory WHERE status = 'active'`;
        const ordersCountQuery = `
            SELECT 
                COUNT(*) AS totalOrders,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingOrders,
                SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmedOrders
            FROM orders
        `;
        const ordersSalesQuery = `
            SELECT 
                DATE_FORMAT(order_date, '%Y-%m-%d') AS order_date,
                SUM(total_amount) AS total_amount
            FROM orders
        `;
        const params = [];

        // Add date filter for orders if provided
        let whereClause = '';
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
            whereClause = ` WHERE order_date BETWEEN ? AND ?`;
            params.push(startDate, endDateWithTime.toISOString().split('T')[0]);
        }

        const ordersCountQueryWithFilter = ordersCountQuery + whereClause;
        const ordersSalesQueryWithFilter = ordersSalesQuery + whereClause + ` GROUP BY DATE_FORMAT(order_date, '%Y-%m-%d')`;

        // Execute queries using promises
        const [categoriesResult] = await new Promise((resolve, reject) => {
            db.query(categoriesQuery, (err, results) => {
                if (err) reject(err);
                else resolve([results]);
            });
        });

        const [productsResult] = await new Promise((resolve, reject) => {
            db.query(productsQuery, (err, results) => {
                if (err) reject(err);
                else resolve([results]);
            });
        });

        const [stockResult] = await new Promise((resolve, reject) => {
            db.query(stockQuery, (err, results) => {
                if (err) reject(err);
                else resolve([results]);
            });
        });

        const [ordersCountResult] = await new Promise((resolve, reject) => {
            db.query(ordersCountQueryWithFilter, params, (err, results) => {
                if (err) reject(err);
                else resolve([results]);
            });
        });

        const ordersSalesResult = await new Promise((resolve, reject) => {
            db.query(ordersSalesQueryWithFilter, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        // Process sales data for the graph
        const salesByDate = ordersSalesResult.reduce((acc, order) => {
            const date = new Date(order.order_date).toLocaleDateString();
            acc[date] = (acc[date] || 0) + parseFloat(order.total_amount || 0);
            return acc;
        }, {});
        const salesData = {
            labels: Object.keys(salesByDate).sort((a, b) => new Date(a) - new Date(b)),
            values: Object.keys(salesByDate)
                .sort((a, b) => new Date(a) - new Date(b))
                .map(date => salesByDate[date])
        };

        // Format response
        const reportData = {
            totalCategories: parseInt(categoriesResult[0].totalCategories) || 0,
            totalProducts: parseInt(productsResult[0].totalProducts) || 0,
            totalStock: parseInt(stockResult[0].totalStock) || 0,
            totalOrders: parseInt(ordersCountResult[0].totalOrders) || 0,
            pendingOrders: parseInt(ordersCountResult[0].pendingOrders) || 0,
            confirmedOrders: parseInt(ordersCountResult[0].confirmedOrders) || 0,
            salesData: {
                labels: salesData.labels,
                datasets: [{
                    label: 'Sales ($)',
                    data: salesData.values,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            }
        };

        res.status(200).json(reportData);
    } catch (error) {
        console.error('Error in getDashboardReport:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getDashboardReport };