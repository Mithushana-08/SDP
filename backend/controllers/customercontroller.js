const db = require("../config/db"); 

const getCustomers = (req, res) => {
    const query = 'SELECT  username, email, phone FROM Customer ORDER BY customer_id';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching customer data:', err);
            res.status(500).json({ error: 'Failed to fetch customers' });
            return;
        }
        res.json(results);
    });
};

module.exports = {

    getCustomers, // Add this to the exports
};