const db = require('../config/db');

const getProducts = (req, res) => {
    const query = `
        SELECT 
            pm.product_id,
            pm.product_name,
            c.CategoryName AS category_name,
            c.CategoryID AS category_id,
            pm.base_price,
            pm.customizable,
            pm.description,
            pm.image,
            pm.status
        FROM 
            product_master pm
        JOIN 
            Categories c ON pm.category_id = c.CategoryID
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching product data:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
};

module.exports = { getProducts };