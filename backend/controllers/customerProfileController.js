const db = require('../config/db'); // Import your database connection

// Fetch customer profile details
const getCustomerProfile = (req, res) => {
    const customerId = req.user.customer_id; // Extract customer_id from the authenticated user

    // Query to fetch customer details
    const customerQuery = `
        SELECT first_name, last_name,username, email, phone
        FROM Customer
        WHERE Customer_id = ?
    `;

    // Query to fetch the latest saved address
    const addressQuery = `
        SELECT address_line1, address_line2, city, province, postal_code
        FROM addresses
        WHERE Customer_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    `;

    // Execute both queries
    db.query(customerQuery, [customerId], (err, customerResults) => {
        if (err) {
            console.error("Error fetching customer details:", err);
            return res.status(500).json({ error: "Failed to fetch customer details" });
        }

        if (customerResults.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        const customer = customerResults[0];

        db.query(addressQuery, [customerId], (err, addressResults) => {
            if (err) {
                console.error("Error fetching address details:", err);
                return res.status(500).json({ error: "Failed to fetch address details" });
            }

            const address = addressResults.length > 0 ? addressResults[0] : null;

            // Combine customer and address details in the response
            res.status(200).json({
                customer,
                address,
            });
        });
    });
};

// Update customer profile details
const updateCustomerProfile = (req, res) => {
    const customerId = req.user.customer_id; // Extract customer_id from the authenticated user
    const { first_name, last_name, email, phone, address_line1, address_line2, city, province, postal_code } = req.body;

    // Query to update customer details
    const updateCustomerQuery = `
        UPDATE Customer
        SET first_name = ?, last_name = ?, email = ?, phone = ?, username = CONCAT(?, ' ', ?)
        WHERE Customer_id = ?
    `;

    // Query to update or insert address
    const upsertAddressQuery = `
        INSERT INTO addresses (Customer_id, address_line1, address_line2, city, province, postal_code)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        address_line1 = VALUES(address_line1),
        address_line2 = VALUES(address_line2),
        city = VALUES(city),
        province = VALUES(province),
        postal_code = VALUES(postal_code)
    `;

    // Execute the queries
    db.query(updateCustomerQuery, [first_name, last_name, email, phone, first_name, last_name, customerId], (err) => {
        if (err) {
            console.error("Error updating customer details:", err);
            return res.status(500).json({ error: "Failed to update customer details" });
        }

        db.query(upsertAddressQuery, [customerId, address_line1, address_line2, city, province, postal_code], (err) => {
            if (err) {
                console.error("Error updating address details:", err);
                return res.status(500).json({ error: "Failed to update address details" });
            }

            res.status(200).json({ message: "Profile updated successfully" });
        });
    });
};
module.exports = { getCustomerProfile, updateCustomerProfile };

