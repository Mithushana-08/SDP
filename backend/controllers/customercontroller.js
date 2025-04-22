const db = require("../config/db");

// Existing getCustomers function
const getCustomers = (req, res) => {
    const query = 'SELECT username, email, phone FROM Customer ORDER BY customer_id';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching customer data:', err);
            res.status(500).json({ error: 'Failed to fetch customers' });
            return;
        }
        res.json(results);
    });
};

const saveAddress = (req, res) => {
    const { addressLine1, addressLine2, city, province, postalCode } = req.body;

    // Extract customer_id from req.user (set by authenticateCustomer middleware)
    const customer_id = req.user.customer_id;

    console.log("Request body:", req.body); // Log the request body
    console.log("Customer ID:", customer_id); // Log the customer ID

    if (!customer_id) {
        return res.status(400).json({ error: "Customer ID is required" });
    }

    // Check if the user already has a saved address
    const checkAddressQuery = `
        SELECT address_line1, address_line2, city, province, postal_code
        FROM addresses
        WHERE Customer_id = ?
    `;

    db.query(checkAddressQuery, [customer_id], (err, results) => {
        if (err) {
            console.error("Error checking existing address:", err);
            return res.status(500).json({ error: "Failed to check existing address" });
        }

        if (results.length > 0) {
            // If an address exists, return it to the frontend
            return res.status(200).json({ message: "Address already exists", address: results[0] });
        }

        // If no address exists, save the new address
        if (!addressLine1 || !city || !province || !postalCode) {
            return res.status(400).json({ error: "All required fields must be provided" });
        }

        const insertAddressQuery = `
            INSERT INTO addresses (Customer_id, address_line1, address_line2, city, province, postal_code)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [customer_id, addressLine1, addressLine2, city, province, postalCode];

        db.query(insertAddressQuery, values, (err, results) => {
            if (err) {
                console.error("Error saving address:", err);
                return res.status(500).json({ error: "Failed to save address" });
            }
            res.status(201).json({ message: "Address saved successfully" });
        });
    });
};

module.exports = {
    getCustomers,
    saveAddress, // Export the new function
};