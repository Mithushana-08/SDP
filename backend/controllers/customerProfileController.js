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
const { updateAddress } = require('./customercontroller'); // Import updateAddress function

const updateCustomerProfile = (req, res) => {
    const customerId = req.user.customer_id; // Extract customer_id from the authenticated user
    const { first_name, last_name, email, phone, address_line1, address_line2, city, province, postal_code } = req.body;

    console.log("Request body:", req.body); // Debugging: Log the incoming data

    // Query to update customer details
    const updateCustomerQuery = `
        UPDATE Customer
        SET first_name = ?, last_name = ?, email = ?, phone = ?, username = CONCAT(?, ' ', ?)
        WHERE Customer_id = ?
    `;

    // Execute the customer update query
    db.query(updateCustomerQuery, [first_name, last_name, email, phone, first_name, last_name, customerId], (err) => {
        if (err) {
            console.error("Error updating customer details:", err);
            return res.status(500).json({ error: "Failed to update customer details" });
        }

        // Map property names to match what updateAddress expects
        const addressData = {
            addressLine1: address_line1,
            addressLine2: address_line2,
            city,
            province,
            postalCode: postal_code,
        };

        // Call the updateAddress function to update or insert the address
        updateAddress({ body: addressData, user: { customer_id: customerId } }, res); // Pass req-like object to updateAddress
    });
};
// Fetch all orders for a customer
const getOrdersByCustomer = (req, res) => {
    const customerId = req.user.customer_id; // Extract customer_id from the authenticated user

    // Query to fetch all orders for the customer
    const ordersQuery = `
        SELECT o.order_id, o.order_date, o.status, SUM(oi.quantity * oi.price) AS total_amount
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.customer_id = ?
        GROUP BY o.order_id, o.order_date, o.status
        ORDER BY o.order_date DESC
    `;

    db.query(ordersQuery, [customerId], (err, orders) => {
        if (err) {
            console.error("Error fetching orders:", err);
            return res.status(500).json({ error: "Failed to fetch orders" });
        }

        res.status(200).json({ orders });
    });
};

// Fetch details of a specific order
const getOrderDetails = (req, res) => {
    const { orderId } = req.params;

    // Query to fetch order details
    const orderDetailsQuery = `
        SELECT o.order_id, o.order_date, o.status, oi.product_id, p.product_name, oi.quantity, oi.price
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN product_master p ON oi.product_id = p.product_id
        WHERE o.order_id = ?
    `;

    db.query(orderDetailsQuery, [orderId], (err, orderDetails) => {
        if (err) {
            console.error("Error fetching order details:", err);
            return res.status(500).json({ error: "Failed to fetch order details" });
        }

        if (orderDetails.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Group order details by order
        const order = {
            orderId: orderDetails[0].order_id,
            orderDate: orderDetails[0].order_date,
            status: orderDetails[0].status,
            items: orderDetails.map((item) => ({
                productId: item.product_id,
                productName: item.product_name,
                quantity: item.quantity,
                price: item.price,
            })),
        };

        res.status(200).json({ order });
    });
};

module.exports = { getCustomerProfile, updateCustomerProfile, getOrdersByCustomer, getOrderDetails };

